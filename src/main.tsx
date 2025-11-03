import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/monitoring/sentry";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Initialize Sentry before rendering app
initSentry();

// Clear old service worker and caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🔄 Cleared old service worker');
    });
  });
  
  caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
    console.log('🔄 Cleared all caches');
  });
  
  // Re-register service worker after clearing
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service worker registered');
        // Force update check
        reg.update().catch(err => console.warn('SW update check failed:', err));
      })
      .catch(err => {
        console.error('❌ SW registration failed:', err);
        // Don't block app if SW fails
      });
  }, 1000);
}

// Render app with error boundary
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

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
