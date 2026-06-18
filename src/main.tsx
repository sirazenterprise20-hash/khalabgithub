import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global API interceptor pointing to the production Cloud Run URL when running on Netlify
if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  const isNetlify = hostname.includes("exquisite-raindrop-fd6fd6.netlify.app") || hostname.includes("netlify.app");
  
  if (isNetlify) {
    const prodCloudRunUrl = "https://ais-pre-mlblprmea5x27qr4ihex5e-983253631521.asia-southeast1.run.app";
    
    // Set localStorage key
    if (localStorage.getItem("khalab_api_base") !== prodCloudRunUrl) {
      localStorage.setItem("khalab_api_base", prodCloudRunUrl);
    }
    
    // Intercept native fetch requests for API calls to ensure no relative network errors occur
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let targetInput = input;
      if (typeof input === "string" && input.startsWith("/api/")) {
        targetInput = `${prodCloudRunUrl}${input}`;
      } else if (input instanceof URL && input.pathname.startsWith("/api/")) {
        targetInput = new URL(`${prodCloudRunUrl}${input.pathname}${input.search}`);
      } else if (input && typeof input === "object" && "url" in input) {
        const reqObj = input as any;
        if (typeof reqObj.url === "string" && reqObj.url.startsWith("/api/")) {
          try {
            targetInput = new Request(`${prodCloudRunUrl}${reqObj.url}`, reqObj);
          } catch {
            // fallback
          }
        }
      }
      return originalFetch(targetInput, init);
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

