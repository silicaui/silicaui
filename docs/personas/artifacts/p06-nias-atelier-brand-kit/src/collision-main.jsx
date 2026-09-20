import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./collision.css";
import Collision from "./Collision.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Collision mode="sans préfixe" />
  </StrictMode>,
);
