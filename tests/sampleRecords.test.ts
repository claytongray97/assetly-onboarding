import { describe, expect, it } from "vitest";
import { DATA_TYPES, SYSTEMS } from "@/lib/catalog";
import { SAMPLE_ROWS, sampleContext, sampleRecords } from "@/lib/sampleRecords";

const ctx = { domain: "northwind.example", city: "Denver", currency: "EUR" };

describe("sampleRecords", () => {
  it("produces a well-formed table for every system × supplied data type", () => {
    for (const system of SYSTEMS) {
      for (const dt of system.supplies) {
        const t = sampleRecords(system.id, dt, ctx);
        expect(t.rows.length, `${system.id}/${dt}`).toBeGreaterThan(0);
        expect(t.rows.length).toBeLessThanOrEqual(SAMPLE_ROWS);
        for (const row of t.rows) expect(row).toHaveLength(t.columns.length);
      }
    }
  });

  it("covers every data type", () => {
    for (const dt of DATA_TYPES) expect(() => sampleRecords("unknown", dt.id, ctx)).not.toThrow();
  });

  it("is deterministic", () => {
    expect(sampleRecords("jamf", "assets", ctx)).toEqual(sampleRecords("jamf", "assets", ctx));
  });

  it("personalizes emails, locations and currency", () => {
    const users = sampleRecords("okta", "users", ctx);
    expect(users.rows.every((r) => r[1].endsWith("@northwind.example"))).toBe(true);

    const assets = sampleRecords("jamf", "assets", ctx);
    expect(assets.rows.every((r) => r[3].startsWith("Denver"))).toBe(true);

    const fin = sampleRecords("netsuite", "financial", ctx);
    expect(fin.rows[0][2]).toContain("€");
  });

  it("uses source-appropriate asset models", () => {
    const jamf = sampleRecords("jamf", "assets", ctx).rows.map((r) => r[1]).join(" ");
    expect(jamf).toMatch(/Mac|iPad|iPhone|iMac/);
    expect(sampleRecords("jamf", "assets", ctx).rows[0][0]).toMatch(/^MAC-\d{4}$/);
  });

  it("sampleContext derives the email domain", () => {
    expect(sampleContext({ adminEmail: "Jordan@Northwind.Example", city: "Denver", currency: "USD" }).domain).toBe(
      "northwind.example",
    );
  });
});
