const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");

const db = {
  tasks: [
    { id: 1, title: "Nau com", isCompleted: false },
    { id: 2, title: "Quet nha", isCompleted: false },
    { id: 3, title: "Di cho", isCompleted: true },
    { id: 4, title: "Giat quan ao", isCompleted: false },
  ],
};

let nextId = 5;

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Helper function để fetch URL
const fetchUrl = (targetUrl, method, body) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const request = protocol.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (body) {
      request.write(body);
    }
    
    request.end();
  });
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // [BYPASS-CORS] Proxy any request
  if (req.url.startsWith("/bypass-cors")) {
    try {
      const fullUrl = new URL(req.url, `http://${req.headers.host}`);
      const queryParams = fullUrl.searchParams;
      const targetUrl = queryParams.get('url');

      if (!targetUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "URL parameter is required" }));
        return;
      }

      // Lấy body nếu có (cho POST, PUT, etc.)
      let body = '';
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        await new Promise((resolve) => {
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', resolve);
        });
      }

      // Gọi đến URL đích
      const result = await fetchUrl(targetUrl, req.method, body);

      // Trả về response từ URL đích
      res.writeHead(result.statusCode, { 
        "Content-Type": result.headers['content-type'] || 'application/json' 
      });
      res.end(result.body);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        error: "Failed to fetch target URL",
        message: error.message 
      }));
    }
    return;
  }

  // [GET] all tasks
  if (req.method === "GET" && req.url === "/api/tasks") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(db.tasks));
    return;
  }

  // [GET] single task by id
  if (req.method === "GET" && req.url.startsWith("/api/tasks/")) {
    const id = parseInt(req.url.split("/")[3]);
    const task = db.tasks.find((task) => task.id === id);
    
    if (task) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(task));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Task not found" }));
    }
    return;
  }

  // [POST] create new task
  if (req.method === "POST" && req.url === "/api/tasks") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { title } = JSON.parse(body);
        
        if (!title || typeof title !== 'string') {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Title is required" }));
          return;
        }

        const newTask = {
          id: nextId++,
          title,
          isCompleted: false,
        };
        
        db.tasks.push(newTask);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newTask));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // [PUT] update task by id
  if (req.method === "PUT" && req.url.startsWith("/api/tasks/")) {
    const id = parseInt(req.url.split("/")[3]);
    let body = "";
    
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    
    req.on("end", () => {
      try {
        const taskIndex = db.tasks.findIndex((task) => task.id === id);
        
        if (taskIndex === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Task not found" }));
          return;
        }

        const { title, isCompleted } = JSON.parse(body);
        
        if (title !== undefined) {
          db.tasks[taskIndex].title = title;
        }
        if (isCompleted !== undefined) {
          db.tasks[taskIndex].isCompleted = isCompleted;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(db.tasks[taskIndex]));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // [DELETE] delete task by id
  if (req.method === "DELETE" && req.url.startsWith("/api/tasks/")) {
    const id = parseInt(req.url.split("/")[3]);
    const taskIndex = db.tasks.findIndex((task) => task.id === id);
    
    if (taskIndex === -1) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Task not found" }));
      return;
    }

    db.tasks.splice(taskIndex, 1);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Task deleted successfully" }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
  console.log("CORS Bypass available at: http://localhost:3000/bypass-cors?url=[target-url]");
});