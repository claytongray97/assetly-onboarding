import { describe, expect, it } from "vitest";
import { simulateConnect, simulateImport } from "@/lib/integrations";
import { recordCount, sumCounts } from "@/lib/recordCounts";

describe("simulateConnect", () => {
  it("accepts SSO and echoes the account", () => {
    expect(
      simulateConnect({ systemId: "slack", method: "sso", credentials: { account: "a@acme.com" } }),
    ).toEqual({ ok: true, account: "a@acme.com" });
  });

  it("rejects a method the system doesn't support", () => {
    const r = simulateConnect({ systemId: "slack", method: "apiKey", credentials: { apiKey: "x".repeat(20) } });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects short or 'invalid' API keys and masks valid ones", () => {
    expect(simulateConnect({ systemId: "jamf", method: "apiKey", credentials: { apiKey: "short" } })).toMatchObject({
      ok: false,
      status: 401,
    });
    expect(
      simulateConnect({ systemId: "jamf", method: "apiKey", credentials: { apiKey: "invalid-key-1234567890" } }),
    ).toMatchObject({ ok: false });
    expect(
      simulateConnect({ systemId: "jamf", method: "apiKey", credentials: { apiKey: "jamf_live_abcdef123456" } }),
    ).toEqual({ ok: true, account: "API key ••••3456" });
  });

  it("requires an https instance URL for client credentials", () => {
    const base = { systemId: "netsuite", method: "oauthClient" as const };
    expect(
      simulateConnect({ ...base, credentials: { instanceUrl: "http://x.com", clientId: "id", clientSecret: "secret123" } }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      simulateConnect({ ...base, credentials: { instanceUrl: "https://acme.netsuite.com", clientId: "id", clientSecret: "secret123" } }),
    ).toEqual({ ok: true, account: "acme.netsuite.com" });
  });

  it("404s an unknown system", () => {
    expect(
      simulateConnect({ systemId: "nope", method: "sso", credentials: { account: "a@b.co" } }),
    ).toMatchObject({ ok: false, status: 404 });
  });
});

describe("simulateImport / recordCount", () => {
  const context = { domain: "northwind.example", city: "Denver", currency: "USD" as const };

  it("only returns counts and samples for data types the system supplies", () => {
    const result = simulateImport({ systemId: "netsuite", dataTypes: ["financial", "users"], companySize: "51–200", context });
    expect(Object.keys(result!.counts)).toEqual(["financial"]);
    expect(Object.keys(result!.samples)).toEqual(["financial"]);
  });

  it("is deterministic", () => {
    expect(recordCount("jamf", "assets", "201–1,000")).toBe(recordCount("jamf", "assets", "201–1,000"));
  });

  it("scales with company size", () => {
    expect(recordCount("jamf", "assets", "5,000+")).toBeGreaterThan(recordCount("jamf", "assets", "1–50"));
  });

  it("sumCounts totals a record", () => {
    expect(sumCounts({ assets: 10, users: 5 })).toBe(15);
    expect(sumCounts(undefined)).toBe(0);
  });
});
