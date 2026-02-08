import { test, expect } from "@playwright/test";

test.describe("Export — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in when accessing editor", async ({
    page,
  }) => {
    await page.goto("/editor/some-document-id");
    await expect(page).toHaveURL(/sign-in/);
  });
});

/**
 * Authenticated export tests.
 *
 * These tests require:
 * 1. A Clerk testing token
 * 2. A valid document ID in Convex with content and citations
 *
 * To enable, remove .skip and set up test fixtures.
 */
test.describe("Export — Authenticated", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("export dropdown is visible in toolbar with Export label", async ({
    page,
  }) => {
    await page.goto("/editor/test-document-id");

    // Export dropdown trigger should be visible
    await expect(page.getByText("Export")).toBeVisible();
  });

  test("export dropdown contains DOCX and PDF options", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Open export dropdown
    await page.getByText("Export").click();

    // Both menu items should be visible
    await expect(page.getByText("Export as DOCX")).toBeVisible();
    await expect(page.getByText("Export as PDF")).toBeVisible();
  });

  test("export dropdown is keyboard-accessible", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Tab to Export button and activate with Enter
    const exportButton = page.getByRole("button", { name: /export/i });
    await exportButton.focus();
    await page.keyboard.press("Enter");

    // Dropdown should open
    await expect(page.getByText("Export as DOCX")).toBeVisible();

    // Navigate with arrow keys
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(page.getByText("Export as DOCX")).not.toBeVisible();
  });

  test("export button has minimum 44px touch target on mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/editor/test-document-id");

    const exportButton = page.getByRole("button", { name: /export/i });
    const box = await exportButton.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

/**
 * Export flow tests.
 *
 * Requires authenticated session with a document that has content.
 * To enable, remove .skip and set up test fixtures.
 */
test.describe("Export Flow — Authenticated", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("clicking Export as DOCX triggers a file download with .docx extension", async ({
    page,
  }) => {
    await page.goto("/editor/test-doc-with-content");

    // Start monitoring downloads
    const downloadPromise = page.waitForEvent("download");

    // Open dropdown and click DOCX
    await page.getByText("Export").click();
    await page.getByText("Export as DOCX").click();

    // Verify download triggered with .docx extension
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.docx$/);
  });

  test("clicking Export as PDF triggers a file download with .pdf extension", async ({
    page,
  }) => {
    await page.goto("/editor/test-doc-with-content");

    // Start monitoring downloads
    const downloadPromise = page.waitForEvent("download");

    // Open dropdown and click PDF
    await page.getByText("Export").click();
    await page.getByText("Export as PDF").click();

    // Verify download triggered with .pdf extension
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});

/**
 * Subscription gating tests.
 *
 * Requires authenticated session as a free-tier user.
 * To enable, remove .skip and set up test fixtures.
 */
test.describe("Export — Subscription Gating", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("free-tier user sees upgrade modal when clicking export", async ({
    page,
  }) => {
    await page.goto("/editor/test-document-id");

    // Open dropdown and try to export
    await page.getByText("Export").click();
    await page.getByText("Export as DOCX").click();

    // Upgrade modal should appear
    await expect(page.getByText("Upgrade Required")).toBeVisible();
  });

  test("upgrade modal shows Document Export as feature name", async ({
    page,
  }) => {
    await page.goto("/editor/test-document-id");

    // Trigger export
    await page.getByText("Export").click();
    await page.getByText("Export as DOCX").click();

    // Modal should mention "Document Export"
    await expect(
      page.getByText("Document Export is available on Basic and Pro plans")
    ).toBeVisible();
  });

  test("upgrade modal shows correct tier comparison", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Trigger export
    await page.getByText("Export").click();
    await page.getByText("Export as DOCX").click();

    // Modal should show plan columns
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Basic")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
    await expect(page.getByText("Upgrade to Basic")).toBeVisible();
  });

  test("upgrade modal can be dismissed with Maybe Later", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Trigger export
    await page.getByText("Export").click();
    await page.getByText("Export as DOCX").click();

    // Dismiss modal
    await page.getByText("Maybe Later").click();

    // Modal should close
    await expect(page.getByText("Upgrade Required")).not.toBeVisible();
  });
});
