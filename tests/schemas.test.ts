import { describe, expect, it } from "vitest";
import { companySchema, connectRequestSchema, dataTypesSchema } from "@/lib/schemas";

const valid = {
  name: "Acme Manufacturing",
  industry: "Manufacturing",
  size: "201–1,000",
  address: "100 Main St",
  city: "Denver",
  country: "United States",
  timeZone: "America/Denver",
  adminName: "Jordan Lee",
  adminEmail: "jordan@acme.com",
  adminPhone: "",
  fiscalYearStart: "January",
  currency: "USD",
  logo: null,
};

describe("companySchema", () => {
  it("accepts a complete company", () => {
    expect(companySchema.safeParse(valid).success).toBe(true);
  });

  it("requires a name and a valid email", () => {
    const r = companySchema.safeParse({ ...valid, name: "  ", adminEmail: "nope" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toContain("name");
    expect(paths).toContain("adminEmail");
  });

  it("rejects an unselected dropdown", () => {
    expect(companySchema.safeParse({ ...valid, industry: "" }).success).toBe(false);
  });

  it("phone is optional but validated when present", () => {
    expect(companySchema.safeParse({ ...valid, adminPhone: "+1 (555) 123-4567" }).success).toBe(true);
    expect(companySchema.safeParse({ ...valid, adminPhone: "call me" }).success).toBe(false);
  });
});

describe("dataTypesSchema", () => {
  it("requires at least one selection", () => {
    expect(dataTypesSchema.safeParse([]).success).toBe(false);
    expect(dataTypesSchema.safeParse(["assets"]).success).toBe(true);
  });

  it("rejects unknown data types", () => {
    expect(dataTypesSchema.safeParse(["spaceships"]).success).toBe(false);
  });
});

describe("connectRequestSchema", () => {
  it("discriminates on method", () => {
    expect(
      connectRequestSchema.safeParse({ systemId: "jamf", method: "apiKey", credentials: { apiKey: "x" } }).success,
    ).toBe(true);
    expect(
      connectRequestSchema.safeParse({ systemId: "jamf", method: "apiKey", credentials: { account: "a@b.co" } }).success,
    ).toBe(false);
  });
});
