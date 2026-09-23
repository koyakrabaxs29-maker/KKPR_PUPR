import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept and suppress benign development WebSocket / HMR connection errors in the sandbox iframe
if (typeof window !== 'undefined') {
  const isBenignWsError = (err: any) => {
    const errMsg = String(err?.message || err || '');
    return errMsg.toLowerCase().includes('websocket') || errMsg.toLowerCase().includes('ws://') || errMsg.toLowerCase().includes('wss://');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignWsError(event.reason)) {
      event.preventDefault();
      console.warn('Silently ignored benign sandbox HMR WebSocket error:', event.reason);
    }
  });

  window.addEventListener('error', (event) => {
    if (isBenignWsError(event.error) || isBenignWsError(event.message)) {
      event.preventDefault();
      console.warn('Silently ignored benign sandbox HMR WebSocket error:', event.message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
