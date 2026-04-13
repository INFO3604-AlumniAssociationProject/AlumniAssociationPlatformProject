const envApiUrl = (import.meta.env?.VITE_API_URL as string | undefined)?.trim();

const deriveDefaultApi = (): string => {
  if (typeof window === 'undefined') return 'http://localhost:5000/api'; // Default for SSR or non-browser environments.

  const { protocol, hostname, port } = window.location;
  if (!port) {
    // Production build served from same origin (80/443) - use same host.
    return `${protocol}//${hostname}`;
  }

  const frontendPorts = new Set(['3000', '4173', '5173', '1420']);
  const apiPort = frontendPorts.has(port) ? '5000' : port;
  return `${protocol}//${hostname}:${apiPort}`;
};

export const API_ROOT = (envApiUrl || deriveDefaultApi()).replace(/\/$/, '');
export const API_BASE = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;
