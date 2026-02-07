import { test, expect } from "@playwright/test";

test.describe("Editor — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/editor/some-document-id");
    await expect(page).toHaveURL(/sign-in/);
  });
});

/**
 * Authenticated editor tests.
 *
 * These tests require:
 * 1. A Clerk testing token
 * 2. A valid document ID in Convex
 *
 * To enable, remove .skip and set up test fixtures.
 */
test.describe.skip("Editor — Authenticated", () => {
  test("loads editor with IMRAD template for new document", async ({
    page,
  }) => {
    // Navigate to editor with a document ID
    await page.goto("/editor/test-document-id");

    // Editor should render with IMRAD sections
    await expect(page.locator("text=Introduction")).toBeVisible();
    await expect(page.locator("text=Methods")).toBeVisible();
    await expect(page.locator("text=Results")).toBeVisible();
    await expect(page.locator("text=Discussion")).toBeVisible();
    await expect(page.locator("text=Conclusion")).toBeVisible();
  });

  test("toolbar buttons are visible and accessible", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Toolbar should have formatting buttons
    await expect(page.getByLabel("Bold (Ctrl+B)")).toBeVisible();
    await expect(page.getByLabel("Italic (Ctrl+I)")).toBeVisible();
    await expect(page.getByLabel("Underline (Ctrl+U)")).toBeVisible();
    await expect(page.getByLabel("Heading 1")).toBeVisible();
    await expect(page.getByLabel("Heading 2")).toBeVisible();
    await expect(page.getByLabel("Heading 3")).toBeVisible();
    await expect(page.getByLabel("Bullet List")).toBeVisible();
    await expect(page.getByLabel("Numbered List")).toBeVisible();
    await expect(page.getByLabel("Blockquote")).toBeVisible();
  });

  test("shows word count in status bar", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Word count should be visible
    await expect(page.locator("text=words")).toBeVisible();
  });

  test("insert citation button opens modal", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Click insert citation button
    await page.getByText("Insert Citation").click();

    // Modal should open
    await expect(
      page.getByText("Select a paper from your library to cite")
    ).toBeVisible();
  });

  test("save status indicator shows state", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Initially idle (no save status shown)
    // Type something to trigger auto-save
    await page.locator(".tiptap").click();
    await page.keyboard.type("Test content");

    // Should show "Saving..." then "Saved"
    await expect(page.locator("text=Saving")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Saved")).toBeVisible({ timeout: 5000 });
  });

  test("fullscreen toggle works", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Click fullscreen toggle
    await page.getByLabel("Enter fullscreen").click();

    // Editor should be fullscreen (fixed positioning)
    await expect(page.getByLabel("Exit fullscreen")).toBeVisible();
  });

  test("inline title editing works", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Click on document title
    await page.getByText("Untitled Document").click();

    // Should show input field
    const input = page.locator('input[maxlength="120"]');
    await expect(input).toBeVisible();

    // Type new title
    await input.fill("My Research Paper");
    await input.blur();
  });

  test("draft selector dropdown shows documents", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    // Click draft selector
    await page.getByText("My Drafts").click();

    // Should show dropdown with "New Draft" option
    await expect(page.getByText("New Draft")).toBeVisible();
  });

  test("learn mode shows coaching panel on desktop", async ({ page }) => {
    // Assuming the document is in learn mode
    await page.goto("/editor/test-learn-doc-id");

    // Should show writing coach sidebar
    await expect(page.getByText("Writing Coach")).toBeVisible();
    await expect(page.getByText("Progress")).toBeVisible();
    await expect(page.getByText("Understand Topic")).toBeVisible();
  });

  test("draft mode shows workflow steps", async ({ page }) => {
    // Assuming the document is in draft_guided mode
    await page.goto("/editor/test-draft-doc-id");

    // Should show workflow steps
    await expect(page.getByText("Guided Draft")).toBeVisible();
    await expect(page.getByText("Define Research Scope")).toBeVisible();
    await expect(page.getByText("Find Relevant Papers")).toBeVisible();
  });

  test("mobile viewport: sidebar opens as sheet", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/editor/test-document-id");

    // Sidebar should not be visible initially on mobile
    await expect(page.getByText("Writing Coach")).not.toBeVisible();

    // Click sidebar toggle
    await page.getByLabel("Toggle AI panel").click();

    // Sheet should open
    await expect(page.getByText("Writing Coach")).toBeVisible();
  });

  test("mobile: touch targets are at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/editor/test-document-id");

    // Check toolbar buttons have minimum touch targets
    const boldButton = page.getByLabel("Bold (Ctrl+B)");
    const box = await boldButton.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
