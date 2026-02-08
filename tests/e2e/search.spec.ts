import { test, expect } from "@playwright/test";

/* ── Search Page — Unauthenticated Access ── */

test.describe("Search Page — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

/* ── Search Page — Structure & Layout ── */

test.describe("Search Page — Layout", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("search page has correct heading and description", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Search Papers");
    await expect(
      page.locator("text=Search across PubMed, Semantic Scholar, and OpenAlex")
    ).toBeVisible();
  });

  test("search page has search input and button", async ({ page }) => {
    await expect(page.locator('input[aria-label="Search papers"]')).toBeVisible();
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
  });

  test("search button is disabled when input is empty", async ({ page }) => {
    const searchButton = page.locator('button:has-text("Search")');
    await expect(searchButton).toBeDisabled();
  });

  test("shows empty state before searching", async ({ page }) => {
    await expect(
      page.locator("text=Search across 200M+ academic papers")
    ).toBeVisible();
  });
});

/* ── Navigation — Search Link ── */

test.describe("Navigation — Search Link", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("navigation includes Search Papers link on desktop", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('a[href="/search"]')).toBeVisible();
    await expect(page.locator("text=Search Papers")).toBeVisible();
  });

  test("navigation includes Search Papers link on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // Open mobile menu
    await page.locator('button[aria-label="Open menu"]').click();
    await expect(page.locator("text=Search Papers")).toBeVisible();
  });
});

/* ── Mobile Responsiveness ── */

test.describe("Search Page — Mobile Responsiveness", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("no horizontal scroll on iPhone SE viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("touch targets are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/search");

    // Check search button
    const searchButton = page.locator('button:has-text("Search")');
    const box = await searchButton.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // Check search input
    const searchInput = page.locator('input[aria-label="Search papers"]');
    const inputBox = await searchInput.boundingBox();
    if (inputBox) {
      expect(inputBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});

/* ── Accessibility ── */

test.describe("Search Page — Accessibility", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("search input has proper aria-label", async ({ page }) => {
    await page.goto("/search");
    await expect(
      page.locator('input[aria-label="Search papers"]')
    ).toBeVisible();
  });

  test("page has correct heading hierarchy", async ({ page }) => {
    await page.goto("/search");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });
});
