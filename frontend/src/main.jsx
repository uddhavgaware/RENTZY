import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'
import './index.css'

// Remove the static HTML skeleton loader once React has mounted
const skeleton = document.getElementById('app-loading-skeleton');
if (skeleton) {
  skeleton.style.opacity = '0';
  setTimeout(() => skeleton.remove(), 200);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
