import { describe, expect, it } from "vitest";
import { DATA_TYPES, SYSTEMS, pruneSystems, relevantDataTypes, systemsForDataTypes, getSystem } from "@/lib/catalog";

describe("catalog", () => {
  it("every data type is supplied by at least one system", () => {
    for (const dt of DATA_TYPES) {
      expect(SYSTEMS.some((s) => s.supplies.includes(dt.id)), dt.id).toBe(true);
    }
  });

  it("system ids are unique", () => {
    expect(new Set(SYSTEMS.map((s) => s.id)).size).toBe(SYSTEMS.length);
  });

  it("returns only systems that supply a selected data type", () => {
    const ids = systemsForDataTypes(["financial"]).map((s) => s.id);
    expect(ids).toEqual(["quickbooks", "netsuite", "sap"]);
  });

  it("returns nothing when nothing is selected", () => {
    expect(systemsForDataTypes([])).toEqual([]);
  });

  it("de-duplicates systems that supply multiple selected types", () => {
    const ids = systemsForDataTypes(["users", "locations"]).map((s) => s.id);
    expect(ids.filter((id) => id === "google-workspace")).toHaveLength(1);
  });

  it("relevantDataTypes intersects a system's supply with the selection", () => {
    expect(relevantDataTypes(getSystem("netsuite")!, ["vendors", "assets"])).toEqual(["vendors"]);
  });

  it("pruneSystems drops systems that no longer apply", () => {
    expect(pruneSystems(["jamf", "slack", "zoom"], ["licenses"])).toEqual(["slack", "zoom"]);
  });
});
