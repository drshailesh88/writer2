import { test, expect } from "@playwright/test";

test.describe("Deep Research — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/deep-research");
    await expect(page).toHaveURL(/sign-in/);
  });
});

/**
 * Authenticated deep research tests.
 *
 * These tests require:
 * 1. A Clerk testing token
 * 2. A valid user account in Convex
 *
 * To enable, remove .skip and set up test fixtures.
 */
test.describe("Deep Research — Authenticated", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("page loads with topic input and heading", async ({ page }) => {
    await page.goto("/deep-research");

    // Heading should be visible
    await expect(page.getByText("Deep Research")).toBeVisible();

    // Topic input should be visible
    await expect(
      page.getByPlaceholder(/role of TREM2/i)
    ).toBeVisible();
  });

  test("Start Research button is visible", async ({ page }) => {
    await page.goto("/deep-research");

    await expect(
      page.getByRole("button", { name: /start research/i })
    ).toBeVisible();
  });

  test("Start Research button is disabled when topic is empty", async ({
    page,
  }) => {
    await page.goto("/deep-research");

    const button = page.getByRole("button", { name: /start research/i });
    await expect(button).toBeDisabled();
  });

  test("Start Research button enables when topic has 5+ chars", async ({
    page,
  }) => {
    await page.goto("/deep-research");

    const input = page.getByPlaceholder(/role of TREM2/i);
    await input.fill("COVID-19 vaccine efficacy");

    const button = page.getByRole("button", { name: /start research/i });
    await expect(button).toBeEnabled();
  });

  test("character counter shows correct count", async ({ page }) => {
    await page.goto("/deep-research");

    const input = page.getByPlaceholder(/role of TREM2/i);
    await input.fill("Test topic");

    await expect(page.getByText("10 / 500")).toBeVisible();
  });

  test("usage counter is displayed", async ({ page }) => {
    await page.goto("/deep-research");

    // Should show usage info
    await expect(page.getByText(/reports? used this month/i)).toBeVisible();
  });

  test("previous reports section is visible", async ({ page }) => {
    await page.goto("/deep-research");

    await expect(page.getByText("Previous Reports")).toBeVisible();
  });

  test("shows empty state when no reports exist", async ({ page }) => {
    await page.goto("/deep-research");

    await expect(
      page.getByText(/no research reports yet/i)
    ).toBeVisible();
  });
});

/**
 * Subscription gating tests.
 */
test.describe("Deep Research — Subscription Gating", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("free-tier user sees upgrade modal", async ({ page }) => {
    await page.goto("/deep-research");

    const input = page.getByPlaceholder(/role of TREM2/i);
    await input.fill("Test research topic");

    await page.getByRole("button", { name: /start research/i }).click();

    // Upgrade modal should appear
    await expect(page.getByText("Upgrade Required")).toBeVisible();
  });

  test("upgrade modal shows Deep Research as feature name", async ({
    page,
  }) => {
    await page.goto("/deep-research");

    const input = page.getByPlaceholder(/role of TREM2/i);
    await input.fill("Test research topic");

    await page.getByRole("button", { name: /start research/i }).click();

    await expect(
      page.getByText("Deep Research is available on Basic and Pro plans")
    ).toBeVisible();
  });
});

/**
 * Mobile responsiveness tests.
 */
test.describe("Deep Research — Mobile", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("responsive layout on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/deep-research");

    // Page should render without horizontal scroll
    const body = page.locator("body");
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test("touch targets are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/deep-research");

    const button = page.getByRole("button", { name: /start research/i });
    const box = await button.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

/**
 * Navigation tests.
 */
test.describe("Deep Research — Navigation", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("Deep Research link is visible in desktop nav", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.locator("nav >> text=Deep Research")
    ).toBeVisible();
  });

  test("Deep Research link is visible in mobile nav", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // Open mobile menu
    await page.getByLabel(/menu/i).click();

    await expect(page.getByText("Deep Research")).toBeVisible();
  });
});
