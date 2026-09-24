import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Test from "./pages/Test";
import Investigation from "./pages/Investigation";
import Evidence from "./pages/Evidence";
import Risk from "./pages/Risk";
import Reasoning from "./pages/Reasoning";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/investigation" element={<Investigation />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/reasoning" element={<Reasoning />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
