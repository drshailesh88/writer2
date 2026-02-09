import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("unauthenticated user visiting /dashboard is redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("landing page loads with sign-in and sign-up links", async ({
    page,
  }) => {
    await page.goto("/");
    // Logo text in header
    await expect(
      page.locator("header").locator("text=Drafts")
    ).toBeVisible();
    await expect(
      page.locator("header").locator("text=Sign In")
    ).toBeVisible();
    await expect(
      page.locator("header").locator("text=Get Started")
    ).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/sign-up/);
  });

  test("all CTA buttons have minimum 44px touch targets on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Check buttons with text content (excludes system buttons like Next.js dev tools)
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = (await button.textContent())?.trim() ?? "";
        if (text.length === 0) continue;
        const box = await button.boundingBox();
        if (box) {
          expect(
            box.height,
            `Button "${text}" has height ${box.height}px`
          ).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test("landing page has no horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
