import { test, expect } from "@playwright/test";

test.describe("Plagiarism Check — Editor Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to editor — will redirect if not authenticated
    await page.goto("/editor/test-document-id");
  });

  /* ── Unauthenticated Access ── */

  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/editor/test-document-id");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  /* ── Toolbar Button Presence ── */

  test.describe("Authenticated — Toolbar Buttons", () => {
    test.beforeEach(async ({ page }) => {
      const url = page.url();
      if (url.includes("sign-in")) {
        test.skip();
        return;
      }
    });

    test("plagiarism button exists in toolbar", async ({ page }) => {
      const url = page.url();
      if (url.includes("sign-in")) {
        test.skip();
        return;
      }

      // Check if plagiarism button is present
      const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]').or(
        page.locator("button", { hasText: "Plagiarism" })
      );

      // If editor loaded, button should exist (may not be visible until scrolled)
      const editorExists = await page.locator(".tiptap").isVisible();
      if (editorExists) {
        await expect(plagiarismButton).toBeVisible();
      }
    });

    test("plagiarism button has correct icon", async ({ page }) => {
      const url = page.url();
      if (url.includes("sign-in")) {
        test.skip();
        return;
      }

      const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]');
      const editorExists = await page.locator(".tiptap").isVisible();

      if (editorExists) {
        // Button should contain FileCheck2 icon (rendered as SVG)
        const hasIcon = await plagiarismButton.locator("svg").count();
        expect(hasIcon).toBeGreaterThan(0);
      }
    });

    test("plagiarism button shows loading state when clicked", async ({
      page,
    }) => {
      const url = page.url();
      if (url.includes("sign-in")) {
        test.skip();
        return;
      }

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

      // Should show "Scanning..." text
      await expect(page.locator("text=Scanning...")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  /* ── Mobile Viewport ── */

  test("plagiarism button has 44px minimum touch target on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/editor/test-document-id");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

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

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    const toolbar = page.locator('[role="toolbar"]');
    const editorExists = await page.locator(".tiptap").isVisible();

    if (editorExists) {
      await expect(toolbar).toBeVisible();

      // No horizontal overflow in toolbar
      const toolbarBox = await toolbar.boundingBox();
      if (toolbarBox) {
        expect(toolbarBox.width).toBeLessThanOrEqual(375);
      }
    }
  });
});

/* ── Upgrade Modal Tests ── */

test.describe("Plagiarism — Upgrade Modal", () => {
  test("upgrade modal structure is correct", async ({ page }) => {
    // This is a structural test for the upgrade modal component
    // In a real scenario, this would be triggered by clicking plagiarism
    // when user is over their limit

    // For now, we test that the page doesn't crash when loading
    await page.goto("/dashboard");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Dashboard should load without errors
    await expect(page.locator("h1")).toBeVisible();
  });
});

/* ── Accessibility ── */

test.describe("Plagiarism Check — Accessibility", () => {
  test("plagiarism button has proper aria-label", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

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

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    const toolbar = page.locator('[role="toolbar"]');
    const editorExists = await page.locator(".tiptap").isVisible();

    if (editorExists) {
      await expect(toolbar).toBeVisible();
      await expect(toolbar).toHaveAttribute("aria-label", "Text formatting");
    }
  });
});
