import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end walkthrough of all five steps. Set SCREENSHOTS=1 to also write
 * README screenshots to docs/screenshots/<project>.
 */

const LOGO_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1e3a8a"/><path d="M14 46 32 14l18 32z" fill="#fbbf24"/></svg>`,
);

async function shot(page: Page, name: string) {
  if (!process.env.SCREENSHOTS) return;
  const project = test.info().project.name;
  await page.waitForTimeout(350); // let fade-in settle
  await page.screenshot({ path: `docs/screenshots/${project}/${name}.png`, fullPage: project === "desktop" });
}

async function fillCompany(page: Page) {
  await page.getByTestId("logo-input").setInputFiles({ name: "logo.svg", mimeType: "image/svg+xml", buffer: LOGO_SVG });
  await page.getByLabel("Company name").fill("Northwind Manufacturing");
  await page.getByLabel("Industry").selectOption("Manufacturing");
  await page.getByLabel("Company size").selectOption("201–1,000");
  await page.getByLabel("Street address").fill("1200 Industrial Pkwy");
  await page.getByLabel("City").fill("Denver");
  await page.getByLabel("Country").selectOption("United States");
  await page.getByLabel("Time zone").selectOption("America/Denver");
  await page.getByLabel("Full name").fill("Jordan Lee");
  await page.getByLabel("Work email").fill("jordan.lee@northwind.example");
}

const next = (page: Page) => page.getByRole("button", { name: /^Next/ }).click();

/** Toggle a card-style checkbox by clicking its visible label. */
async function pick(page: Page, name: string) {
  const box = page.getByRole("checkbox", { name: new RegExp(`^${name}`) });
  await page.locator("label").filter({ has: box }).click();
  await expect(box).toBeChecked();
}

// Each test gets a fresh browser context, so localStorage starts empty.
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("completes the full onboarding flow", async ({ page }) => {
  // Step 1 — validation, then valid details
  await expect(page.getByRole("heading", { name: "Tell us about your company" })).toBeVisible();
  await next(page);
  await expect(page.getByText("Company name is required")).toBeVisible();

  await fillCompany(page);
  await expect(page.getByAltText("Company logo preview")).toBeVisible();
  await shot(page, "1-company");
  await next(page);

  // Step 2 — data types
  await expect(page.getByRole("heading", { name: "What data do you want to bring in?" })).toBeVisible();
  await next(page);
  await expect(page.getByText("Select at least one type of data")).toBeVisible();
  for (const label of ["Assets", "Users", "Financial"]) {
    await pick(page, label);
  }
  await shot(page, "2-data");
  await next(page);

  // Step 3 — systems are filtered by data type
  await expect(page.getByRole("heading", { name: "Choose systems to connect" })).toBeVisible();
  await expect(page.getByText("Samsara")).toHaveCount(0); // IoT not selected
  for (const name of ["Google Workspace", "Jamf", "NetSuite"]) {
    await pick(page, name);
  }
  await shot(page, "3-systems");
  await next(page);

  // Step 4 — SSO via mock consent dialog
  await expect(page.getByRole("heading", { name: "Connect your systems" })).toBeVisible();
  const google = page.getByTestId("connection-google-workspace");
  await google.getByRole("button", { name: "Sign in" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "jordan.lee@northwind.example" }).click();
  await expect(dialog.getByText("Review permissions")).toBeVisible();
  if (process.env.SCREENSHOTS && test.info().project.name === "desktop") {
    await page.waitForTimeout(300);
    await page.screenshot({ path: "docs/screenshots/desktop/4a-sso.png" });
  }
  await dialog.getByRole("button", { name: "Allow access" }).click();
  await expect(google.getByText(/Connected · jordan.lee@northwind.example/)).toBeVisible();

  // API key — failure then retry
  const jamf = page.getByTestId("connection-jamf");
  await jamf.getByRole("button", { name: /Connect/ }).click();
  await jamf.getByLabel("Jamf API key").fill("short");
  await jamf.getByRole("button", { name: "Test & connect" }).click();
  await expect(jamf.getByText(/rejected the API key/)).toBeVisible();
  await jamf.getByLabel("Jamf API key").fill("jamf_live_9f8e7d6c5b4a");
  await jamf.getByRole("button", { name: "Test & connect" }).click();
  await expect(jamf.getByText("Connected · API key ••••5b4a")).toBeVisible();

  // Skip one
  await page.getByTestId("connection-netsuite").getByRole("button", { name: "Skip" }).click();
  await shot(page, "4-connect");
  await next(page);

  // Step 5 — import results
  await expect(page.getByRole("heading", { name: "Your data is in Assetly" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("grand-total")).toHaveText(/^[\d,]+$/);
  await expect(page.getByText(/Not connected yet: NetSuite/)).toBeVisible();
  await shot(page, "5-review");

  // Sample records are personalized with the company's domain and HQ city
  const googleImport = page.getByTestId("import-google-workspace");
  await googleImport.getByRole("button", { name: "Preview records" }).click();
  await expect(googleImport.getByRole("table")).toContainText("@northwind.example");
  const jamfImport = page.getByTestId("import-jamf");
  await jamfImport.getByRole("button", { name: "Preview records" }).click();
  const jamfTable = jamfImport.getByRole("table");
  await expect(jamfTable.getByRole("row")).toHaveCount(6); // header + 5 samples
  await expect(jamfTable).toContainText(/MAC-\d{4}/);
  await expect(jamfTable).toContainText("Denver");
  await expect(jamfImport.getByText(/Showing 5 of [\d,]+ assets/)).toBeVisible();
  await googleImport.getByRole("button", { name: "Hide records" }).click();
  await shot(page, "5b-preview");

  await page.getByRole("button", { name: "Complete setup" }).click();
  await expect(page.getByRole("heading", { name: "You're all set" })).toBeVisible();
  await expect(page.getByText("Active integrations").locator("..")).toContainText("2");
  await shot(page, "6-complete");
});

test("resumes progress after a page refresh", async ({ page }) => {
  await fillCompany(page);
  await next(page);
  await expect(page.getByRole("heading", { name: "What data do you want to bring in?" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "What data do you want to bring in?" })).toBeVisible();

  // Going back shows the saved company details
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByLabel("Company name")).toHaveValue("Northwind Manufacturing");
});

test("start over clears saved progress", async ({ page }) => {
  await fillCompany(page);
  await next(page);
  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("button", { name: "Click again to reset" }).click();
  await expect(page.getByRole("heading", { name: "Tell us about your company" })).toBeVisible();
  await expect(page.getByLabel("Company name")).toHaveValue("");
});
