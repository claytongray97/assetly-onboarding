/**
 * Static catalog of importable data types and the third-party systems that
 * supply them. Step 3's list is derived from the user's Step 2 selections.
 */

export type DataTypeId =
  | "assets"
  | "users"
  | "financial"
  | "locations"
  | "vendors"
  | "contracts"
  | "licenses"
  | "iot";

export interface DataType {
  id: DataTypeId;
  label: string;
  description: string;
  icon: string; // lucide icon name, resolved in the UI
}

export const DATA_TYPES: DataType[] = [
  { id: "assets", label: "Assets", description: "Hardware, equipment, vehicles and their lifecycle status.", icon: "Package" },
  { id: "users", label: "Users", description: "Employees and contractors who own or check out assets.", icon: "Users" },
  { id: "financial", label: "Financial", description: "Purchase cost, depreciation schedules and GL accounts.", icon: "DollarSign" },
  { id: "locations", label: "Locations", description: "Sites, buildings, floors and rooms where assets live.", icon: "MapPin" },
  { id: "vendors", label: "Vendors", description: "Suppliers, manufacturers and service providers.", icon: "Truck" },
  { id: "contracts", label: "Contracts", description: "Warranties, leases and service agreements.", icon: "FileText" },
  { id: "licenses", label: "Software Licenses", description: "SaaS seats and license utilization.", icon: "KeyRound" },
  { id: "iot", label: "IoT / Sensor Data", description: "Telemetry, GPS and meter readings from connected devices.", icon: "Radio" },
];

export type AuthMethod = "sso" | "apiKey" | "oauthClient";

export type SystemCategory =
  | "Identity & Productivity"
  | "IT & Device Management"
  | "Finance & ERP"
  | "Procurement & Contracts"
  | "IoT & Telematics";

export interface IntegrationSystem {
  id: string;
  name: string;
  category: SystemCategory;
  auth: AuthMethod;
  /** Brand-ish color used for the generic initial badge (not trademarked art). */
  color: string;
  supplies: DataTypeId[];
}

export const SYSTEMS: IntegrationSystem[] = [
  { id: "google-workspace", name: "Google Workspace", category: "Identity & Productivity", auth: "sso", color: "#4285F4", supplies: ["users", "locations"] },
  { id: "microsoft-365", name: "Microsoft 365", category: "Identity & Productivity", auth: "sso", color: "#D83B01", supplies: ["users", "locations"] },
  { id: "okta", name: "Okta", category: "Identity & Productivity", auth: "sso", color: "#007DC1", supplies: ["users", "licenses"] },
  { id: "slack", name: "Slack", category: "Identity & Productivity", auth: "sso", color: "#4A154B", supplies: ["users", "licenses"] },
  { id: "zoom", name: "Zoom", category: "Identity & Productivity", auth: "sso", color: "#2D8CFF", supplies: ["licenses"] },
  { id: "servicenow", name: "ServiceNow", category: "IT & Device Management", auth: "oauthClient", color: "#62D84E", supplies: ["assets"] },
  { id: "jamf", name: "Jamf", category: "IT & Device Management", auth: "apiKey", color: "#3E4B5E", supplies: ["assets"] },
  { id: "intune", name: "Microsoft Intune", category: "IT & Device Management", auth: "oauthClient", color: "#0078D4", supplies: ["assets"] },
  { id: "quickbooks", name: "QuickBooks", category: "Finance & ERP", auth: "apiKey", color: "#2CA01C", supplies: ["financial"] },
  { id: "netsuite", name: "NetSuite", category: "Finance & ERP", auth: "oauthClient", color: "#1F3A5F", supplies: ["financial", "vendors"] },
  { id: "sap", name: "SAP S/4HANA", category: "Finance & ERP", auth: "oauthClient", color: "#0A6ED1", supplies: ["financial"] },
  { id: "coupa", name: "Coupa", category: "Procurement & Contracts", auth: "apiKey", color: "#1E5FB4", supplies: ["vendors"] },
  { id: "docusign", name: "DocuSign", category: "Procurement & Contracts", auth: "apiKey", color: "#FFBE00", supplies: ["contracts"] },
  { id: "salesforce", name: "Salesforce", category: "Procurement & Contracts", auth: "oauthClient", color: "#00A1E0", supplies: ["contracts"] },
  { id: "samsara", name: "Samsara", category: "IoT & Telematics", auth: "apiKey", color: "#0F2A47", supplies: ["iot"] },
  { id: "aws-iot", name: "AWS IoT", category: "IoT & Telematics", auth: "oauthClient", color: "#FF9900", supplies: ["iot"] },
];

export const AUTH_LABELS: Record<AuthMethod, string> = {
  sso: "Single sign-on",
  apiKey: "API key",
  oauthClient: "OAuth client credentials",
};

export function getSystem(id: string): IntegrationSystem | undefined {
  return SYSTEMS.find((s) => s.id === id);
}

export function getDataType(id: DataTypeId): DataType {
  return DATA_TYPES.find((d) => d.id === id)!;
}

/** Systems that supply at least one of the selected data types, in catalog order. */
export function systemsForDataTypes(selected: DataTypeId[]): IntegrationSystem[] {
  const set = new Set(selected);
  return SYSTEMS.filter((s) => s.supplies.some((d) => set.has(d)));
}

/** The subset of a system's data types that the user actually asked for. */
export function relevantDataTypes(system: IntegrationSystem, selected: DataTypeId[]): DataTypeId[] {
  return system.supplies.filter((d) => selected.includes(d));
}

/** Drop selected system ids that no longer supply any selected data type. */
export function pruneSystems(systemIds: string[], selected: DataTypeId[]): string[] {
  const allowed = new Set(systemsForDataTypes(selected).map((s) => s.id));
  return systemIds.filter((id) => allowed.has(id));
}
