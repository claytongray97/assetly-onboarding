import { beforeEach, describe, expect, it } from "vitest";
import { initialData, useWizard } from "@/lib/store";

const get = () => useWizard.getState();

describe("wizard store", () => {
  beforeEach(() => {
    localStorage.clear();
    useWizard.setState({ ...initialData });
  });

  it("advances and tracks the furthest step reached", () => {
    get().advance();
    get().advance();
    get().back();
    expect(get().currentStep).toBe(1);
    expect(get().furthestStep).toBe(2);
  });

  it("does not jump past the furthest step", () => {
    get().goTo(3);
    expect(get().currentStep).toBe(0);
  });

  it("clamps at the last step", () => {
    for (let i = 0; i < 10; i++) get().advance();
    expect(get().currentStep).toBe(4);
  });

  it("changing data types prunes systems and their connections", () => {
    get().saveDataTypes(["assets", "users"]);
    get().saveSystems(["jamf", "slack"]);
    get().setConnection("jamf", { status: "connected", account: "k", connectedAt: "" });
    get().setConnection("slack", { status: "connected", account: "a", connectedAt: "" });

    get().saveDataTypes(["users"]);
    expect(get().systems).toEqual(["slack"]);
    expect(Object.keys(get().connections)).toEqual(["slack"]);
  });

  it("disconnecting clears that system's imported counts", () => {
    get().setConnection("jamf", { status: "connected", account: "k", connectedAt: "" });
    get().setImport("jamf", { counts: { assets: 12 }, samples: {} });
    get().setConnection("jamf", null);
    expect(get().imports.jamf).toBeUndefined();
  });

  it("persists data (but never actions) to localStorage", () => {
    get().saveDataTypes(["assets"]);
    const stored = JSON.parse(localStorage.getItem("assetly-onboarding")!);
    expect(stored.state.dataTypes).toEqual(["assets"]);
    expect(stored.state.advance).toBeUndefined();
  });

  it("changing personalization fields in company details clears imports", () => {
    const company = {
      name: "A", industry: "Retail", size: "1–50", address: "1 St", city: "Denver", country: "Other",
      timeZone: "UTC", adminName: "J", adminEmail: "j@a.com", adminPhone: "", fiscalYearStart: "January",
      currency: "USD", logo: null,
    } as const;
    get().saveCompany(company);
    get().setImport("jamf", { counts: { assets: 1 }, samples: {} });
    get().saveCompany({ ...company, name: "Renamed" });
    expect(get().imports.jamf).toBeDefined();
    get().saveCompany({ ...company, city: "Austin" });
    expect(get().imports).toEqual({});
  });

  it("reset returns to the initial state", () => {
    get().advance();
    get().saveDataTypes(["iot"]);
    get().reset();
    expect(get()).toMatchObject(initialData);
  });
});
