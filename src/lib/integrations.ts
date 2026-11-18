import { getSystem, type DataTypeId } from "./catalog";
import { recordCount } from "./recordCounts";
import { sampleRecords, type SampleTable } from "./sampleRecords";
import type { ConnectRequest, ImportRequest } from "./schemas";

/**
 * Server-side simulation of third-party connections. These functions are pure
 * so they can be unit-tested; the route handlers add latency and HTTP framing.
 */

export type ConnectResult =
  | { ok: true; account: string }
  | { ok: false; status: number; error: string };

export function simulateConnect(req: ConnectRequest): ConnectResult {
  const system = getSystem(req.systemId);
  if (!system) return { ok: false, status: 404, error: "Unknown integration." };
  if (system.auth !== req.method) {
    return { ok: false, status: 400, error: `${system.name} does not support this sign-in method.` };
  }

  switch (req.method) {
    case "sso": {
      const { account } = req.credentials;
      if (account.toLowerCase().includes("denied")) {
        return { ok: false, status: 403, error: "Access was denied by your identity provider." };
      }
      return { ok: true, account };
    }
    case "apiKey": {
      const key = req.credentials.apiKey.trim();
      if (key.length < 16 || /invalid/i.test(key)) {
        return { ok: false, status: 401, error: `${system.name} rejected the API key. Check it and try again.` };
      }
      return { ok: true, account: `API key ••••${key.slice(-4)}` };
    }
    case "oauthClient": {
      const { instanceUrl, clientId, clientSecret } = req.credentials;
      let host: string;
      try {
        const url = new URL(instanceUrl);
        if (url.protocol !== "https:") throw new Error();
        host = url.host;
      } catch {
        return { ok: false, status: 400, error: "Instance URL must be a valid https:// address." };
      }
      if (!clientId.trim() || clientSecret.length < 8 || /invalid/i.test(clientSecret)) {
        return { ok: false, status: 401, error: "Client ID or secret is incorrect." };
      }
      return { ok: true, account: host };
    }
  }
}

export interface ImportResult {
  counts: Partial<Record<DataTypeId, number>>;
  samples: Partial<Record<DataTypeId, SampleTable>>;
}

export function simulateImport(req: ImportRequest): ImportResult | null {
  const system = getSystem(req.systemId);
  if (!system) return null;
  const result: ImportResult = { counts: {}, samples: {} };
  for (const dt of req.dataTypes) {
    if (!system.supplies.includes(dt)) continue;
    result.counts[dt] = recordCount(system.id, dt, req.companySize);
    result.samples[dt] = sampleRecords(system.id, dt, req.context);
  }
  return result;
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const latency = () => 600 + Math.floor(Math.random() * 900);
