/**
 * Resolve the default sync server URL for local and hosted deployments.
 */
export function getDefaultSyncServerUrl() {
  const envUrl = import.meta.env.VITE_SYNC_SERVER_URL?.trim();
  if (envUrl) return envUrl;

  if (typeof window === "undefined") return "ws://localhost:3001";

  const { protocol, hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "ws://localhost:3001";
  }

  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${hostname}`;
}
