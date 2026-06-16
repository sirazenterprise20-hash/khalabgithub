import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to support Netlify static hosting by redirecting API requests to the Cloud Run server
try {
  if (typeof window !== "undefined") {
    const originalFetch = window.fetch;
    const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" 
        ? input 
        : (input instanceof URL ? input.toString() : (input && 'url' in input ? (input as any).url : ""));
      
      if (typeof url === "string" && url.startsWith("/api/")) {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const isExternalStatic = hostname.includes("netlify.app") || 
                                 hostname.includes("github.io") || 
                                 (hostname === "localhost" && port !== "3000");

        if (isExternalStatic) {
          // Resolve target API Base
          const metaCast = import.meta as any;
          const envApiUrl = (metaCast && metaCast.env && metaCast.env.VITE_API_BASE_URL) || "";
          const savedApiUrl = localStorage.getItem("khalab_api_base") || "";
          const defaultCloudRunUrl = "https://ais-pre-mlblprmea5x27qr4ihex5e-983253631521.asia-southeast1.run.app";
          
          const finalBase = (envApiUrl || savedApiUrl || defaultCloudRunUrl).replace(/\/$/, "");
          const targetUrl = `${finalBase}${url}`;
          
          console.log(`[API Proxy] Redirecting static fetch from ${url} to: ${targetUrl}`);
          
          if (typeof input === "string") {
            return originalFetch(targetUrl, init);
          } else if (input instanceof URL) {
            return originalFetch(new URL(targetUrl), init);
          } else if (input && typeof input === "object" && 'url' in input) {
            const newRequest = new Request(targetUrl, input as RequestInit);
            return originalFetch(newRequest, init);
          }
        }
      }
      return originalFetch(input, init);
    };

    // Attempt to redefine fetch safely to guarantee zero startup crashes
    try {
      Object.defineProperty(window, "fetch", {
        value: customFetch,
        writable: true,
        configurable: true
      });
    } catch (e1) {
      try {
        (window as any).fetch = customFetch;
      } catch (e2) {
        console.warn("[API Proxy] Could not patch window.fetch globally due to restrictive environment:", e2);
      }
    }
  }
} catch (globalError) {
  console.error("[API Proxy] Critical global fetch setup caught:", globalError);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
