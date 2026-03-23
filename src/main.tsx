import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import Phase0DemoApp from './phase0/Phase0DemoApp.tsx';
import Phase1App from './phase1/Phase1App.tsx';
import './index.css';

// Shim to prevent libraries from overwriting fetch and causing errors
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    // We try to redefine fetch with a no-op setter to avoid "only a getter" errors
    Object.defineProperty(window, 'fetch', {
      get() { return originalFetch; },
      set() { console.warn('Something tried to overwrite window.fetch. This was prevented to avoid errors.'); },
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    // If it's not configurable, we can't do much here
    console.warn('Could not redefine window.fetch:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).get('phase1') === '1' ? (
      <Phase1App />
    ) : new URLSearchParams(window.location.search).get('phase0') === '1' ? (
      <Phase0DemoApp />
    ) : (
      <App />
    )}
  </StrictMode>,
);
