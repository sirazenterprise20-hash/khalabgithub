import { handleFirebaseMockFetch } from "./firebase";

// Robust API routing utility supporting local Cloud Run containers and static hosting proxies (like Netlify)
export function getApiUrl(path: string): string {
  if (!path.startsWith("/api/") && !path.startsWith("/uploads/")) {
    return path;
  }

  if (typeof window === "undefined") {
    return path;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Check if we are running on an external static hosting environment (e.g., Netlify with subdomain or custom domain, Vercel, etc.)
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isCloudRun = hostname.includes(".run.app");
  
  const isExternalStatic = !isCloudRun && (!isLocal || (isLocal && port !== "3000"));

  if (isExternalStatic) {
    const metaCast = import.meta as any;
    let envApiUrl = ((metaCast && metaCast.env && metaCast.env.VITE_API_BASE_URL) || "").trim();
    let savedApiUrl = (localStorage.getItem("khalab_api_base") || "").trim();
    const defaultCloudRunUrl = "https://ais-pre-mlblprmea5x27qr4ihex5e-983253631521.asia-southeast1.run.app";
    
    if (savedApiUrl === "null" || savedApiUrl === "undefined" || !savedApiUrl.startsWith("http")) {
      savedApiUrl = "";
    }
    if (envApiUrl === "null" || envApiUrl === "undefined" || !envApiUrl.startsWith("http")) {
      envApiUrl = "";
    }
    
    const finalBase = (envApiUrl || savedApiUrl || defaultCloudRunUrl).replace(/\/$/, "");
    return `${finalBase}${path}`;
  }

  return path;
}

export function getImgUrl(path?: string): string {
  if (!path) return "/uploads/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return getApiUrl(normalizedPath);
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isCloudRun = hostname.includes(".run.app");
  const isExternalStatic = !isCloudRun && (!isLocal || (isLocal && port !== "3000"));

  // On Netlify or any static host, run completely, securely and directly on Firebase client-side database
  if (isExternalStatic) {
    return handleFirebaseMockFetch(input, init);
  }

  // Otherwise, run on the custom Node server (local development or container)
  const targetUrl = getApiUrl(input);
  const response = await fetch(targetUrl, init);

  // Auto-sync write commands (POST, PUT, DELETE) dynamically directly to Firestore too so everything matches!
  const method = (init?.method || "GET").toUpperCase();
  if (response.ok && (method === "POST" || method === "PUT" || method === "DELETE")) {
    try {
      handleFirebaseMockFetch(input, init).catch(e => {
        console.warn("Silent background Firestore sync failed:", e);
      });
    } catch (e) {
      console.warn("Silent background Firestore sync trigger failed:", e);
    }
  }

  return response;
}
