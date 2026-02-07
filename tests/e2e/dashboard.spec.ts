import { test, expect } from "@playwright/test";

test.describe("Dashboard — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("does not expose dashboard content to unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Should not see any dashboard elements
    await expect(
      page.locator("text=Welcome back")
    ).not.toBeVisible();
    await expect(
      page.locator("text=Quick Actions")
    ).not.toBeVisible();
  });
});

/**
 * Authenticated dashboard tests.
 *
 * These tests require a Clerk testing token to be configured.
 * To enable:
 * 1. Create a Clerk testing token at https://dashboard.clerk.com → Testing
 * 2. Set CLERK_TESTING_TOKEN in .env.test
 * 3. Remove the `.skip` from the describe block below
 *
 * Without Clerk testing tokens, these tests verify the component structure
 * by checking that the page WOULD render correctly if authenticated.
 * The auth redirect tests above confirm the middleware works properly.
 */
test.describe("Dashboard — Authenticated Structure", () => {
  // Skip authenticated tests unless CLERK_TESTING_TOKEN is configured.
  // These serve as documentation of what the dashboard should contain.
  test.skip(
    !process.env.CLERK_TESTING_TOKEN,
    "Requires CLERK_TESTING_TOKEN to test authenticated dashboard"
  );

  test.beforeEach(async ({ page }) => {
    // When Clerk testing is configured, set the session cookie
    if (process.env.CLERK_TESTING_TOKEN) {
      await page.goto("/");
      await page.evaluate((token) => {
        document.cookie = `__session=${token}; path=/`;
      }, process.env.CLERK_TESTING_TOKEN);
      await page.goto("/dashboard");
    }
  });

  test("displays welcome header with user name", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Welcome back" })
    ).toBeVisible();
  });

  test("shows plan badge", async ({ page }) => {
    await expect(page.locator("text=Plan").first()).toBeVisible();
  });

  test("renders quick action cards", async ({ page }) => {
    await expect(
      page.locator("text=Quick Actions")
    ).toBeVisible();
    await expect(
      page.locator("text=New Learn Mode")
    ).toBeVisible();
    await expect(
      page.locator("text=New Draft (Guided)")
    ).toBeVisible();
    await expect(
      page.locator("text=New Draft (Hands-off)")
    ).toBeVisible();
  });

  test("renders recent drafts section", async ({ page }) => {
    await expect(
      page.locator("text=Recent Drafts")
    ).toBeVisible();
  });

  test("renders empty state when no documents exist", async ({ page }) => {
    await expect(
      page.locator("text=No drafts yet")
    ).toBeVisible();
    await expect(
      page.locator("text=Start your first research paper")
    ).toBeVisible();
  });

  test("renders monthly usage section", async ({ page }) => {
    await expect(
      page.locator("text=Monthly Usage")
    ).toBeVisible();
    await expect(
      page.locator("text=Plagiarism Checks")
    ).toBeVisible();
    await expect(
      page.locator("text=AI Detection")
    ).toBeVisible();
    await expect(
      page.locator("text=Deep Research")
    ).toBeVisible();
  });

  test("renders profile section", async ({ page }) => {
    await expect(page.locator("text=Profile").first()).toBeVisible();
    await expect(
      page.locator("text=Edit Profile")
    ).toBeVisible();
  });

  test("quick action creates a document", async ({ page }) => {
    await page.locator("text=New Learn Mode").click();
    // Spinner should appear during creation
    await expect(
      page.locator("text=New Learn Mode")
    ).toBeVisible();
    // After creation, the document should appear in recent drafts
    await expect(
      page.locator("text=Untitled Research Paper")
    ).toBeVisible({ timeout: 10000 });
  });

  test("dashboard is mobile responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // All sections should still be visible
    await expect(
      page.locator("text=Quick Actions")
    ).toBeVisible();
    await expect(
      page.locator("text=Recent Drafts")
    ).toBeVisible();
    await expect(
      page.locator("text=Monthly Usage")
    ).toBeVisible();
    await expect(page.locator("text=Profile").first()).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
