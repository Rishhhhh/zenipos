import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/monitoring/sentry";
import { initDB } from "./lib/offline/indexedDB";
import { terminalManager } from "./lib/payments/CardTerminal";
import { SimulatorTerminal } from "./lib/payments/terminals/SimulatorTerminal";

// Initialize Sentry before rendering app
initSentry();

// Initialize IndexedDB for offline storage
initDB()
  .then(() => console.log('✅ IndexedDB initialized'))
  .catch(err => console.error('❌ IndexedDB init failed:', err));

// Initialize card terminal (simulator for testing)
const simulator = new SimulatorTerminal();
simulator.connect({ type: 'simulator', connection: 'cloud' })
  .then(() => {
    terminalManager.registerTerminal('simulator-1', simulator);
    terminalManager.setActiveTerminal('simulator-1');
    console.log('✅ Card terminal simulator initialized');
  })
  .catch(err => console.error('❌ Terminal init failed:', err));

createRoot(document.getElementById("root")!).render(<App />);
