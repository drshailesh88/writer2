import { test, expect } from "@playwright/test";

/* ── 404 Page Tests ── */

/**
 * NOTE: Currently, the middleware protects all routes including 404 pages,
 * so non-existent routes redirect to sign-in for unauthenticated users.
 *
 * FUTURE: Consider adding 404 routes to public routes in middleware.ts
 * so users can see custom 404 page without authentication.
 *
 * These tests verify current behavior (redirect to sign-in).
 */
test.describe("404 Page — Current Behavior", () => {
  test("non-existent route redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test("invalid route redirects to sign-in (middleware protection)", async ({ page }) => {
    await page.goto("/nonexistent-route-12345");
    // Current behavior: middleware protects all non-public routes
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

/**
 * 404 Page Component Tests (when accessible).
 * These test the not-found.tsx component structure.
 * Currently skipped for unauthenticated users due to middleware.
 */
test.describe("404 Page — Component Structure", () => {
  test.skip(
    !process.env.CLERK_TESTING_TOKEN,
    "Requires CLERK_TESTING_TOKEN to access 404 page (currently protected by middleware)"
  );

  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await page.goto("/");
      await page.evaluate((token) => {
        document.cookie = `__session=${token}; path=/`;
      }, process.env.CLERK_TESTING_TOKEN);
    }
  });

  test("shows 'Page Not Found' heading", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page.locator("h1")).toContainText("Page Not Found");
  });

  test("shows descriptive message", async ({ page }) => {
    await page.goto("/missing-page");
    await expect(
      page.locator("text=The page you're looking for doesn't exist or has been moved")
    ).toBeVisible();
  });

  test("has 'Go to Dashboard' button", async ({ page }) => {
    await page.goto("/invalid-url");
    const dashboardBtn = page.locator('a:has-text("Go to Dashboard")');
    await expect(dashboardBtn).toBeVisible();
    await expect(dashboardBtn).toHaveAttribute("href", "/dashboard");
  });

  test("has 'Go Home' button", async ({ page }) => {
    await page.goto("/nowhere");
    const homeBtn = page.locator('a:has-text("Go Home")');
    await expect(homeBtn).toBeVisible();
    await expect(homeBtn).toHaveAttribute("href", "/");
  });

  test("has FileQuestion icon", async ({ page }) => {
    await page.goto("/not-found");
    // Check for SVG element (lucide-react renders as SVG)
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible();
  });

  test("buttons navigate correctly", async ({ page }) => {
    await page.goto("/bad-route");

    // Test Go Home button
    const homeBtn = page.locator('a:has-text("Go Home")');
    await homeBtn.click();
    await expect(page).toHaveURL("/");
  });

  test("is mobile responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/nonexistent");

    await expect(page.locator("h1", { hasText: "Page Not Found" })).toBeVisible();
    await expect(page.locator('a:has-text("Go to Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Go Home")')).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("has proper heading hierarchy", async ({ page }) => {
    await page.goto("/does-not-exist-123");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });
});

/* ── Navigation Tests (Unauthenticated) ── */

test.describe("Navigation — Unauthenticated Access", () => {
  test("landing page at / is accessible without auth", async ({ page }) => {
    await page.goto("/");
    // Should NOT redirect to sign-in
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1", { hasText: "Your research thesis" })).toBeVisible();
  });

  test("/plagiarism-free is accessible without auth (free funnel)", async ({ page }) => {
    await page.goto("/plagiarism-free");
    // Should NOT redirect to sign-in
    await expect(page).toHaveURL("/plagiarism-free");
  });

  test("protected routes redirect to sign-in", async ({ page }) => {
    const protectedRoutes = ["/dashboard", "/search", "/library", "/account"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
    }
  });
});

/* ── Navigation Tests (Authenticated) ── */

/**
 * Authenticated navigation tests.
 *
 * These tests require a Clerk testing token to be configured.
 * To enable:
 * 1. Create a Clerk testing token at https://dashboard.clerk.com → Testing
 * 2. Set CLERK_TESTING_TOKEN in .env.test
 * 3. Tests will automatically run when token is present
 *
 * Without CLERK_TESTING_TOKEN, these tests are skipped.
 */
test.describe("Navigation — Authenticated Shell", () => {
  test.skip(
    !process.env.CLERK_TESTING_TOKEN,
    "Requires CLERK_TESTING_TOKEN to test authenticated navigation"
  );

  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await page.goto("/");
      await page.evaluate((token) => {
        document.cookie = `__session=${token}; path=/`;
      }, process.env.CLERK_TESTING_TOKEN);
      await page.goto("/dashboard");
    }
  });

  test("nav shell shows 'V1 Drafts' brand link", async ({ page }) => {
    const brandLink = page.locator('a:has-text("V1 Drafts")');
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute("href", "/dashboard");
  });

  test("desktop nav shows all navigation links", async ({ page }) => {
    // Desktop viewport (default)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");

    await expect(page.locator('a:has-text("Write")')).toBeVisible();
    await expect(page.locator('a:has-text("Search Papers")')).toBeVisible();
    await expect(page.locator('a:has-text("My Library")')).toBeVisible();
    await expect(page.locator('a:has-text("Deep Research")')).toBeVisible();
  });

  test("desktop nav shows user avatar dropdown", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");

    const avatarButton = page.locator("button:has(div[class*='avatar'])");
    await expect(avatarButton).toBeVisible();
  });

  test("desktop dropdown contains Account, Subscription, Pricing, Sign Out", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");

    // Click avatar dropdown
    const avatarButton = page.locator("button:has(div[class*='avatar'])");
    await avatarButton.click();

    // Check dropdown menu items
    await expect(page.locator('a:has-text("Account")')).toBeVisible();
    await expect(page.locator('a:has-text("Subscription")')).toBeVisible();
    await expect(page.locator('a:has-text("Pricing")')).toBeVisible();
    await expect(page.locator('text=Sign Out').last()).toBeVisible();
  });

  test("dropdown menu items have correct hrefs", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");

    const avatarButton = page.locator("button:has(div[class*='avatar'])");
    await avatarButton.click();

    await expect(page.locator('a:has-text("Account")')).toHaveAttribute("href", "/account");
    await expect(page.locator('a:has-text("Subscription")')).toHaveAttribute("href", "/account/subscription");
    await expect(page.locator('a:has-text("Pricing")')).toHaveAttribute("href", "/pricing");
  });

  test("mobile hamburger menu shows all links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Open mobile menu
    const menuButton = page.locator('button[aria-label="Open menu"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Check all nav links in mobile menu
    await expect(page.locator('a:has-text("Write")')).toBeVisible();
    await expect(page.locator('a:has-text("Search Papers")')).toBeVisible();
    await expect(page.locator('a:has-text("My Library")')).toBeVisible();
    await expect(page.locator('a:has-text("Deep Research")')).toBeVisible();
    await expect(page.locator('a:has-text("Account")')).toBeVisible();
    await expect(page.locator('a:has-text("Subscription")')).toBeVisible();
    await expect(page.locator('a:has-text("Pricing")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test("mobile menu shows user info", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    const menuButton = page.locator('button[aria-label="Open menu"]');
    await menuButton.click();

    // Check for avatar and user info (structure)
    const avatar = page.locator("div[class*='avatar']");
    await expect(avatar.first()).toBeVisible();
  });

  test("navigation links work on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");

    // Test Write link (goes to dashboard)
    await page.locator('a:has-text("Write")').click();
    await expect(page).toHaveURL("/dashboard");

    // Test Search Papers link
    await page.locator('a:has-text("Search Papers")').click();
    await expect(page).toHaveURL("/search");

    // Test My Library link
    await page.locator('a:has-text("My Library")').click();
    await expect(page).toHaveURL("/library");

    // Test Deep Research link
    await page.locator('a:has-text("Deep Research")').click();
    await expect(page).toHaveURL("/deep-research");
  });

  test("brand link navigates to dashboard", async ({ page }) => {
    await page.goto("/search");

    const brandLink = page.locator('a:has-text("V1 Drafts")');
    await brandLink.click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("mobile touch targets are at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Check hamburger button
    const menuButton = page.locator('button[aria-label="Open menu"]');
    const menuBox = await menuButton.boundingBox();
    if (menuBox) {
      expect(menuBox.height).toBeGreaterThanOrEqual(44);
      expect(menuBox.width).toBeGreaterThanOrEqual(44);
    }

    // Open menu and check nav items
    await menuButton.click();

    const navLinks = page.locator('a:has-text("Write"), a:has-text("Search Papers"), a:has-text("My Library")');
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("desktop nav items have minimum 44px height", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/dashboard");

    const navLinks = page.locator('a:has-text("Write"), a:has-text("Search Papers"), a:has-text("My Library"), a:has-text("Deep Research")');
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("no horizontal overflow on mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);

    // Open mobile menu
    await page.locator('button[aria-label="Open menu"]').click();

    const menuScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(menuScrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});

/* ── Navigation Accessibility ── */

test.describe("Navigation — Accessibility", () => {
  test.skip(
    !process.env.CLERK_TESTING_TOKEN,
    "Requires CLERK_TESTING_TOKEN"
  );

  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await page.goto("/");
      await page.evaluate((token) => {
        document.cookie = `__session=${token}; path=/`;
      }, process.env.CLERK_TESTING_TOKEN);
    }
  });

  test("mobile menu button has aria-label", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    const menuButton = page.locator('button[aria-label="Open menu"]');
    await expect(menuButton).toBeVisible();
  });

  test("navigation has semantic header element", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("header")).toBeVisible();
  });
});
