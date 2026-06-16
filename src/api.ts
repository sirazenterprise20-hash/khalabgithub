// Robust API routing utility supporting local Cloud Run containers and static hosting proxies (like Netlify)
export function getApiUrl(path: string): string {
  if (!path.startsWith("/api/")) {
    return path;
  }

  if (typeof window === "undefined") {
    return path;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Check if we are running on an external static hosting environment
  const isExternalStatic = hostname.includes("netlify.app") || 
                           hostname.includes("github.io") || 
                           (hostname === "localhost" && port !== "3000");

  if (isExternalStatic) {
    const metaCast = import.meta as any;
    const envApiUrl = (metaCast && metaCast.env && metaCast.env.VITE_API_BASE_URL) || "";
    const savedApiUrl = localStorage.getItem("khalab_api_base") || "";
    const defaultCloudRunUrl = "https://ais-pre-mlblprmea5x27qr4ihex5e-983253631521.asia-southeast1.run.app";
    
    const finalBase = (envApiUrl || savedApiUrl || defaultCloudRunUrl).replace(/\/$/, "");
    return `${finalBase}${path}`;
  }

  return path;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const targetUrl = getApiUrl(input);
  return fetch(targetUrl, init);
}
