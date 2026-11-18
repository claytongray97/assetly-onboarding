import type { ImportResult } from "./integrations";
import type { ConnectRequest, ImportRequest } from "./schemas";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const connectIntegration = (req: ConnectRequest) =>
  post<{ status: "connected"; account: string; connectedAt: string }>("/api/integrations/connect", req);

export const importIntegration = (req: ImportRequest) =>
  post<{ systemId: string } & ImportResult>("/api/integrations/import", req);
