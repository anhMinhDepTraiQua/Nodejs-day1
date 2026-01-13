import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./Home.jsx";

export default function App() {
  return (
    <BrowserRouter basename="/nodejs-day-1/">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}