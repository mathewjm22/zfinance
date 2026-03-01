import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("main.tsx is running");
try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("App rendered successfully");
} catch (e) {
  console.error("Error rendering App:", e);
  document.getElementById("error-log")!.textContent += "Render Error: " + (e as Error).message + "\n";
}
