import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/monitoring/sentry";

// Initialize Sentry before rendering app
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
