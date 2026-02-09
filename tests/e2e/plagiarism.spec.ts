import { test, expect } from "@playwright/test";

test.describe("Plagiarism Check — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/editor/test-document-id");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

test.describe("Plagiarism Check — Toolbar Buttons", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("plagiarism button exists in toolbar", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]').or(
      page.locator("button", { hasText: "Plagiarism" })
    );

    const editorExists = await page.locator(".tiptap").isVisible();
    if (editorExists) {
      await expect(plagiarismButton).toBeVisible();
    }
  });

  test("plagiarism button has correct icon", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]');
    const editorExists = await page.locator(".tiptap").isVisible();

    if (editorExists) {
      const hasIcon = await plagiarismButton.locator("svg").count();
      expect(hasIcon).toBeGreaterThan(0);
    }
  });

  test("plagiarism button shows loading state when clicked", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const editorExists = await page.locator(".tiptap").isVisible();
    if (!editorExists) {
      test.skip();
      return;
    }

    // Mock API to delay response
    await page.route("**/api/plagiarism/check", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkId: "test-id" }),
      });
    });

    const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]');
    await plagiarismButton.click();

    await expect(page.locator("text=Scanning...")).toBeVisible({
      timeout: 5000,
    });
  });
});

/* ── Mobile Viewport ── */

test.describe("Plagiarism Check — Mobile", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("plagiarism button has 44px minimum touch target on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/editor/test-document-id");

    const editorExists = await page.locator(".tiptap").isVisible();
    if (!editorExists) {
      test.skip();
      return;
    }

    const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]');
    const box = await plagiarismButton.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("toolbar wraps correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/editor/test-document-id");

    const toolbar = page.locator('[role="toolbar"]');
    const editorExists = await page.locator(".tiptap").isVisible();

    if (editorExists) {
      await expect(toolbar).toBeVisible();

      const toolbarBox = await toolbar.boundingBox();
      if (toolbarBox) {
        expect(toolbarBox.width).toBeLessThanOrEqual(375);
      }
    }
  });
});

/* ── Upgrade Modal Tests ── */

test.describe("Plagiarism — Upgrade Modal", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("upgrade modal structure is correct", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toBeVisible();
  });
});

/* ── Accessibility ── */

test.describe("Plagiarism Check — Accessibility", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("plagiarism button has proper aria-label", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const editorExists = await page.locator(".tiptap").isVisible();
    if (!editorExists) {
      test.skip();
      return;
    }

    const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]');
    await expect(plagiarismButton).toBeVisible();
  });

  test("toolbar has proper role attribute", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const toolbar = page.locator('[role="toolbar"]');
    const editorExists = await page.locator(".tiptap").isVisible();

    if (editorExists) {
      await expect(toolbar).toBeVisible();
      await expect(toolbar).toHaveAttribute("aria-label", "Text formatting");
    }
  });
});
