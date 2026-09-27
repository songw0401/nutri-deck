import { Navigate, Route, Routes } from "react-router-dom";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { MyPage } from "./pages/MyPage";
import { Play } from "./pages/Play";
import { Ranking } from "./pages/Ranking";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/me" element={<MyPage />} />
      <Route path="/play" element={<Play />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
