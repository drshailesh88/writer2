import { test, expect } from "@playwright/test";

/* ── Library Page — Unauthenticated Access ── */

test.describe("Library Page — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

/* ── Library Page — Structure & Layout ── */

test.describe("Library Page — Layout", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to library page — will redirect if not authenticated
    // For unauthenticated structural tests, we verify the redirect above
    // These tests verify the page structure when accessible
    await page.goto("/library");
  });

  test("library page has correct heading", async ({ page }) => {
    // If redirected to sign-in, skip structural tests
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(page.locator("h1")).toContainText("My Library");
  });

  test("shows paper count", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(
      page.locator("text=/\\d+ papers? saved/i")
    ).toBeVisible();
  });

  test("shows search input for filtering papers", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(
      page.locator('input[placeholder="Search library..."]')
    ).toBeVisible();
  });

  test("shows sort dropdown", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Sort trigger should be visible
    const sortTrigger = page.locator('button:has-text("Date Added")');
    await expect(sortTrigger).toBeVisible();
  });

  test("shows upload PDF button", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(page.locator('button:has-text("Upload PDF")')).toBeVisible();
  });

  test("shows collections sidebar on desktop", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.locator("text=All Papers")).toBeVisible();
  });

  test("shows grid/list view toggle on desktop", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check for view toggle buttons (by aria-label)
    await expect(
      page.locator('button[aria-label="List view"]')
    ).toBeVisible();
    await expect(
      page.locator('button[aria-label="Grid view"]')
    ).toBeVisible();
  });

  test("shows empty state when no papers saved", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Check if empty state or papers are shown
    // Empty state should show "No papers saved yet" or papers should exist
    const emptyState = page.locator("text=No papers saved yet");
    const paperCount = page.locator("text=/\\d+ papers? saved/i");

    // At least one should be visible
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    const countVisible = await paperCount.isVisible().catch(() => false);

    expect(emptyVisible || countVisible).toBeTruthy();
  });
});

/* ── Navigation — Library Link ── */

test.describe("Navigation — Library Link", () => {
  test("navigation includes Library link on desktop", async ({ page }) => {
    await page.goto("/dashboard");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(page.locator('a[href="/library"]')).toBeVisible();
  });

  test("navigation includes Library link on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Open mobile menu
    await page.locator('button[aria-label="Open menu"]').click();
    await expect(page.locator("text=Library").first()).toBeVisible();
  });
});

/* ── Mobile Responsiveness ── */

test.describe("Library Page — Mobile Responsiveness", () => {
  test("no horizontal scroll on iPhone SE viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("touch targets are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Check upload button
    const uploadButton = page.locator('button:has-text("Upload PDF")');
    const uploadBox = await uploadButton.boundingBox();
    if (uploadBox) {
      expect(uploadBox.height).toBeGreaterThanOrEqual(44);
    }

    // Check search input
    const searchInput = page.locator('input[placeholder="Search library..."]');
    const searchBox = await searchInput.boundingBox();
    if (searchBox) {
      expect(searchBox.height).toBeGreaterThanOrEqual(44);
    }

    // Check sort dropdown
    const sortTrigger = page.locator('button:has-text("Date Added")');
    const sortBox = await sortTrigger.boundingBox();
    if (sortBox) {
      expect(sortBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("shows collections button on mobile instead of sidebar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Mobile should show Collections button
    await expect(page.locator('button:has-text("Collections")')).toBeVisible();
  });

  test("hides grid/list view toggle on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // View toggle should be hidden on mobile
    const listViewButton = page.locator('button[aria-label="List view"]');
    await expect(listViewButton).toBeHidden();
  });
});

/* ── Accessibility ── */

test.describe("Library Page — Accessibility", () => {
  test("search input has proper placeholder", async ({ page }) => {
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(
      page.locator('input[placeholder="Search library..."]')
    ).toBeVisible();
  });

  test("page has correct heading hierarchy", async ({ page }) => {
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Should have exactly one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Should have at least one h2 (either "Collections" or empty state heading)
    const h2Count = await page.locator("h2").count();
    const h3Count = await page.locator("h3").count();

    // At least one subheading should exist (h2 or h3)
    expect(h2Count + h3Count).toBeGreaterThan(0);
  });

  test("view toggle buttons have aria-labels", async ({ page }) => {
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop viewport to see toggle
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(
      page.locator('button[aria-label="List view"]')
    ).toBeVisible();
    await expect(
      page.locator('button[aria-label="Grid view"]')
    ).toBeVisible();
  });
});

/* ── Collections Functionality ── */

test.describe("Library Page — Collections", () => {
  test("shows All Papers collection by default", async ({ page }) => {
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop viewport to see sidebar
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.locator("text=All Papers")).toBeVisible();
  });

  test("shows New Collection button", async ({ page }) => {
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop viewport to see sidebar
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.locator('button:has-text("New Collection")')).toBeVisible();
  });

  test("shows Collections label in sidebar", async ({ page }) => {
    await page.goto("/library");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop viewport to see sidebar
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.locator("text=Collections").first()).toBeVisible();
  });
});
