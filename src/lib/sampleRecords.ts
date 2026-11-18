import type { DataTypeId } from "./catalog";
import { hash } from "./recordCounts";

/**
 * Deterministic, personalized sample records shown in the Step 5 preview.
 * Rows are pre-formatted strings so the server owns formatting (currency etc.)
 * and the client just renders a table.
 */

export interface SampleTable {
  columns: string[];
  rows: string[][];
}

export interface SampleContext {
  /** Company email domain, e.g. "northwind.com". */
  domain: string;
  /** HQ city. */
  city: string;
  /** ISO currency code. */
  currency: string;
}

export const SAMPLE_ROWS = 5;

/** mulberry32 — tiny seeded PRNG. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const pick = <T>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)];
const int = (r: Rand, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
const pad = (n: number, w = 4) => String(n).padStart(w, "0");

const FIRST = ["Maya", "Rohan", "Elena", "Marcus", "Aisha", "Daniel", "Priya", "Lucas", "Sofia", "Kenji", "Grace", "Omar", "Hannah", "Mateo", "Zoe", "Ethan"];
const LAST = ["Chen", "Patel", "Garcia", "Okafor", "Nguyen", "Schmidt", "Rossi", "Kim", "Johnson", "Silva", "Novak", "Haddad", "Brooks", "Ito", "Murphy", "Reyes"];
const DEPARTMENTS = ["Operations", "Engineering", "Finance", "Facilities", "IT", "Sales", "Maintenance", "HR"];
const TITLES = ["Manager", "Analyst", "Technician", "Specialist", "Coordinator", "Engineer", "Director"];

/** Asset models vary by source so Jamf looks like Apple, Intune like Windows, etc. */
const ASSET_MODELS: Record<string, string[]> = {
  jamf: ['MacBook Pro 14"', 'MacBook Air 13"', "iPad Air (5th gen)", "iMac 24\"", "iPhone 15", "Mac mini (M2)"],
  intune: ["Dell Latitude 7440", "Surface Laptop 5", "HP EliteBook 840", "Lenovo ThinkPad T14", "Surface Pro 9"],
  servicenow: ["Cisco Catalyst 9300", "Dell PowerEdge R760", "Zebra TC52 Scanner", "HP LaserJet M507", "Lenovo ThinkCentre M90", "Forklift — Toyota 8FGU25"],
};
const ASSET_STATUS = ["In use", "In use", "In use", "In stock", "In repair", "Retired"];
const ASSET_PREFIX: Record<string, string> = { jamf: "MAC", intune: "WIN", servicenow: "AST" };

const SITE_TYPES = ["Headquarters", "Warehouse", "Plant", "Office", "Data center", "Depot"];
const FLOORS = ["Floor 1", "Floor 2", "Floor 3", "Building B", "Room 104", "Server room"];

const VENDORS = ["Grainger", "CDW", "Fastenal", "Dell Technologies", "Uline", "Siemens", "Johnson Controls", "Staples Business", "Cintas", "Graybar"];
const VENDOR_CATEGORIES = ["IT hardware", "MRO supplies", "Facilities services", "Industrial equipment", "Office supplies", "Safety & PPE"];
const TERMS = ["Net 30", "Net 45", "Net 60", "2/10 Net 30"];

const CONTRACT_TYPES = ["Warranty", "Service agreement", "Equipment lease", "Maintenance plan", "Software subscription"];
const CONTRACT_SUBJECTS = ["HVAC preventive maintenance", "Laptop fleet lease", "Forklift service plan", "Copier lease", "Generator inspection", "Network support"];

const LICENSES: Record<string, string[]> = {
  okta: ["Okta Workforce Identity", "Okta MFA", "Okta Lifecycle Management"],
  slack: ["Slack Business+", "Slack Enterprise Grid", "Slack Huddles add-on"],
  zoom: ["Zoom Workplace Business", "Zoom Rooms", "Zoom Webinars 500"],
};

const IOT_DEVICES: Record<string, { device: string; metric: string; unit: string; min: number; max: number }[]> = {
  samsara: [
    { device: "Vehicle gateway VG54", metric: "Odometer", unit: "mi", min: 12000, max: 98000 },
    { device: "Asset tag AG46", metric: "Battery", unit: "%", min: 18, max: 100 },
    { device: "Env. monitor EM21", metric: "Temperature", unit: "°F", min: 34, max: 78 },
  ],
  "aws-iot": [
    { device: "Compressor sensor", metric: "Vibration", unit: "mm/s", min: 1, max: 12 },
    { device: "Chiller controller", metric: "Supply temp", unit: "°F", min: 40, max: 48 },
    { device: "Pump meter", metric: "Runtime", unit: "hrs", min: 200, max: 9000 },
  ],
};

function person(r: Rand) {
  const first = pick(r, FIRST);
  const last = pick(r, LAST);
  return { first, last, short: `${first[0]}. ${last}`, full: `${first} ${last}` };
}

function makeMoney(currency: string) {
  let f: Intl.NumberFormat;
  try {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
  } catch {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
  return (n: number) => f.format(n);
}

function date(r: Rand, fromYear: number, toYear: number) {
  const d = new Date(Date.UTC(int(r, fromYear, toYear), int(r, 0, 11), int(r, 1, 28)));
  return d.toISOString().slice(0, 10);
}

export function sampleRecords(systemId: string, dataType: DataTypeId, ctx: SampleContext): SampleTable {
  const r = rng(hash(`${systemId}:${dataType}:${ctx.domain}`));
  const money = makeMoney(ctx.currency);
  const rows = (fn: (i: number) => string[]) => Array.from({ length: SAMPLE_ROWS }, (_, i) => fn(i));
  const start = int(r, 100, 900);

  switch (dataType) {
    case "assets": {
      const models = ASSET_MODELS[systemId] ?? ASSET_MODELS.servicenow;
      const prefix = ASSET_PREFIX[systemId] ?? "AST";
      return {
        columns: ["Asset tag", "Model", "Assigned to", "Location", "Status"],
        rows: rows((i) => {
          const status = pick(r, ASSET_STATUS);
          return [
            `${prefix}-${pad(start + i)}`,
            pick(r, models),
            status === "In use" ? person(r).short : "—",
            `${ctx.city} · ${pick(r, FLOORS)}`,
            status,
          ];
        }),
      };
    }
    case "users":
      return {
        columns: ["Name", "Email", "Department", "Title"],
        rows: rows(() => {
          const p = person(r);
          const dept = pick(r, DEPARTMENTS);
          return [p.full, `${p.first}.${p.last}@${ctx.domain}`.toLowerCase(), dept, `${dept} ${pick(r, TITLES)}`];
        }),
      };
    case "financial":
      return {
        columns: ["Ref", "Description", "Cost", "In service", "Book value"],
        rows: rows((i) => {
          const cost = int(r, 8, 400) * 100;
          const pctLeft = int(r, 20, 95) / 100;
          return [
            `FA-${pad(start + i * 7, 5)}`,
            pick(r, [...ASSET_MODELS.servicenow, ...ASSET_MODELS.intune]),
            money(cost),
            date(r, 2019, 2025),
            money(Math.round(cost * pctLeft)),
          ];
        }),
      };
    case "locations": {
      const types = [...SITE_TYPES];
      return {
        columns: ["Site", "Type", "City", "Assets"],
        rows: rows((i) => {
          const type = i === 0 ? types[0] : pick(r, types.slice(1));
          return [i === 0 ? `${ctx.city} HQ` : `${ctx.city} ${type} ${i}`, type, ctx.city, String(int(r, 40, 2400))];
        }),
      };
    }
    case "vendors":
      return {
        columns: ["Vendor", "Category", "Payment terms", "YTD spend"],
        rows: rows(() => [pick(r, VENDORS), pick(r, VENDOR_CATEGORIES), pick(r, TERMS), money(int(r, 5, 900) * 1000)]),
      };
    case "contracts":
      return {
        columns: ["Contract", "Type", "Counterparty", "Expires", "Value"],
        rows: rows(() => [
          pick(r, CONTRACT_SUBJECTS),
          pick(r, CONTRACT_TYPES),
          pick(r, VENDORS),
          date(r, 2026, 2029),
          money(int(r, 2, 250) * 1000),
        ]),
      };
    case "licenses": {
      const products = LICENSES[systemId] ?? Object.values(LICENSES).flat();
      return {
        columns: ["Product", "Seats", "Assigned", "Utilization"],
        rows: products.slice(0, SAMPLE_ROWS).map((product) => {
          const seats = int(r, 2, 60) * 10;
          const used = Math.round(seats * (int(r, 55, 99) / 100));
          return [product, String(seats), String(used), `${Math.round((used / seats) * 100)}%`];
        }),
      };
    }
    case "iot": {
      const devices = IOT_DEVICES[systemId] ?? IOT_DEVICES.samsara;
      return {
        columns: ["Device", "Metric", "Last reading", "Location", "Updated"],
        rows: rows((i) => {
          const d = pick(r, devices);
          return [
            `${d.device} #${pad(start + i, 3)}`,
            d.metric,
            `${int(r, d.min, d.max).toLocaleString("en-US")} ${d.unit}`,
            `${ctx.city} · ${pick(r, FLOORS)}`,
            `${int(r, 1, 59)} min ago`,
          ];
        }),
      };
    }
  }
}

/** Derive the personalization context from Step 1 data. */
export function sampleContext<C extends string>(company: {
  adminEmail: string;
  city: string;
  currency: C;
}): SampleContext & { currency: C } {
  const domain = company.adminEmail.split("@")[1]?.toLowerCase() || "example.com";
  return { domain, city: company.city, currency: company.currency };
}
