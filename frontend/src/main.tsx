import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { GameProvider } from "./context/GameContext";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("root 요소를 찾지 못했습니다.");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <GameProvider>
        <App />
      </GameProvider>
    </BrowserRouter>
  </StrictMode>,
);
