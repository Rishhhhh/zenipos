import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/monitoring/sentry";

// Initialize Sentry before rendering app
initSentry();

// Render app first
createRoot(document.getElementById("root")!).render(<App />);

// Initialize offline & payment systems after React has loaded
setTimeout(() => {
  // Dynamically import to avoid blocking React initialization
  Promise.all([
    import('./lib/offline/indexedDB'),
    import('./lib/payments/CardTerminal'),
    import('./lib/payments/terminals/SimulatorTerminal')
  ]).then(([{ initDB }, { terminalManager }, { SimulatorTerminal }]) => {
    // Initialize IndexedDB
    initDB()
      .then(() => console.log('✅ IndexedDB initialized'))
      .catch(err => console.error('❌ IndexedDB init failed:', err));
    
    // Initialize card terminal simulator
    const simulator = new SimulatorTerminal();
    simulator.connect({ type: 'simulator', connection: 'cloud' })
      .then(() => {
        terminalManager.registerTerminal('simulator-1', simulator);
        terminalManager.setActiveTerminal('simulator-1');
        console.log('✅ Card terminal simulator initialized');
      })
      .catch(err => console.error('❌ Terminal init failed:', err));
  }).catch(err => console.error('❌ Initialization failed:', err));
}, 0);
