import { z } from "zod";
import { DATA_TYPES, type DataTypeId } from "./catalog";

export const INDUSTRIES = [
  "Manufacturing",
  "Healthcare",
  "Education",
  "Government",
  "Energy & Utilities",
  "Transportation & Logistics",
  "Technology",
  "Construction",
  "Retail",
  "Other",
] as const;

export const COMPANY_SIZES = ["1–50", "51–200", "201–1,000", "1,001–5,000", "5,000+"] as const;

export const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "India",
  "Japan",
  "Other",
] as const;

export const TIME_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
] as const;

export const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD", "INR", "JPY"] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

export const companySchema = z.object({
  name: required("Company name").max(100, "Keep it under 100 characters"),
  industry: z.enum(INDUSTRIES, { error: "Select an industry" }),
  size: z.enum(COMPANY_SIZES, { error: "Select a company size" }),
  address: required("Address"),
  city: required("City"),
  country: z.enum(COUNTRIES, { error: "Select a country" }),
  timeZone: z.enum(TIME_ZONES, { error: "Select a time zone" }),
  adminName: required("Admin name"),
  adminEmail: z.string().trim().email("Enter a valid email address"),
  adminPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number")
    .or(z.literal("")),
  fiscalYearStart: z.enum(MONTHS, { error: "Select a month" }),
  currency: z.enum(CURRENCIES, { error: "Select a currency" }),
  logo: z.string().nullable(),
});

export type CompanyDetails = z.infer<typeof companySchema>;

const dataTypeIds = DATA_TYPES.map((d) => d.id) as [DataTypeId, ...DataTypeId[]];

export const dataTypesSchema = z
  .array(z.enum(dataTypeIds))
  .min(1, "Select at least one type of data to import");

export const systemsSchema = z.array(z.string()).min(1, "Select at least one system to connect");

/* ---- API payloads (shared by client and route handlers) ---- */

export const connectRequestSchema = z.discriminatedUnion("method", [
  z.object({
    systemId: z.string(),
    method: z.literal("sso"),
    credentials: z.object({ account: z.string().email() }),
  }),
  z.object({
    systemId: z.string(),
    method: z.literal("apiKey"),
    credentials: z.object({ apiKey: z.string() }),
  }),
  z.object({
    systemId: z.string(),
    method: z.literal("oauthClient"),
    credentials: z.object({
      instanceUrl: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
    }),
  }),
]);

export type ConnectRequest = z.infer<typeof connectRequestSchema>;

export const importRequestSchema = z.object({
  systemId: z.string(),
  dataTypes: z.array(z.enum(dataTypeIds)).min(1),
  companySize: z.enum(COMPANY_SIZES),
  /** Used to personalize sample records (email domain, HQ city, currency). */
  context: z.object({
    domain: z.string().min(1).max(253),
    city: z.string().min(1).max(100),
    currency: z.enum(CURRENCIES),
  }),
});

export type ImportRequest = z.infer<typeof importRequestSchema>;
