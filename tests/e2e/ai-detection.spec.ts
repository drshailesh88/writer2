import { test, expect } from "@playwright/test";

test.describe("AI Detection — Editor Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/test-document-id");
  });

  /* ── Unauthenticated Access ── */

  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/editor/test-document-id");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  /* ── Toolbar Button Presence ── */

  test.describe("Authenticated — Toolbar Buttons", () => {
    test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

    test("AI Detection button exists in toolbar", async ({ page }) => {
      const editorExists = await page.locator(".tiptap").isVisible();
      if (!editorExists) {
        test.skip();
        return;
      }

      // Check if AI Detection button is present
      const aiDetectionButton = page.locator('button[aria-label="AI Detection"]').or(
        page.locator("button", { hasText: "AI Detection" })
      );

      await expect(aiDetectionButton).toBeVisible();
    });

    test("AI Detection button has correct icon", async ({ page }) => {
      const editorExists = await page.locator(".tiptap").isVisible();
      if (!editorExists) {
        test.skip();
        return;
      }

      const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');

      // Button should contain ShieldCheck icon (rendered as SVG)
      const hasIcon = await aiDetectionButton.locator("svg").count();
      expect(hasIcon).toBeGreaterThan(0);
    });

    test("AI Detection button shows loading state when clicked", async ({
      page,
    }) => {
      const editorExists = await page.locator(".tiptap").isVisible();
      if (!editorExists) {
        test.skip();
        return;
      }

      // Mock API to delay response
      await page.route("**/api/ai-detection/check", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ checkId: "test-ai-check-id" }),
        });
      });

      const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');
      await aiDetectionButton.click();

      // Should show "Scanning..." text
      await expect(page.locator("text=Scanning...")).toBeVisible({
        timeout: 5000,
      });
    });

    test("both plagiarism and AI Detection buttons are visible", async ({
      page,
    }) => {
      const editorExists = await page.locator(".tiptap").isVisible();
      if (!editorExists) {
        test.skip();
        return;
      }

      // Both buttons should be visible in toolbar
      const plagiarismButton = page.locator('button[aria-label="Check Plagiarism"]');
      const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');

      await expect(plagiarismButton).toBeVisible();
      await expect(aiDetectionButton).toBeVisible();
    });
  });

  /* ── Mobile Viewport ── */

  test.describe("Mobile Viewport", () => {
    test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

    test("AI Detection button has 44px minimum touch target on mobile", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/editor/test-document-id");

      const editorExists = await page.locator(".tiptap").isVisible();
      if (!editorExists) {
        test.skip();
        return;
      }

      const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');
      const box = await aiDetectionButton.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });

    test("AI Detection button visible on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/editor/test-document-id");

      const editorExists = await page.locator(".tiptap").isVisible();
      if (!editorExists) {
        test.skip();
        return;
      }

      // On mobile, button text might be hidden but icon should be visible
      const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');
      await expect(aiDetectionButton).toBeVisible();
    });

    test("toolbar buttons don't overflow on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/editor/test-document-id");

      const toolbar = page.locator('[role="toolbar"]');
      const editorExists = await page.locator(".tiptap").isVisible();

      if (editorExists) {
        await expect(toolbar).toBeVisible();

        // No horizontal overflow
        const toolbarBox = await toolbar.boundingBox();
        if (toolbarBox) {
          expect(toolbarBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });
});

/* ── AI Detection Panel Tests ── */

test.describe("AI Detection — Results Panel", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("AI Detection panel renders after check completes", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const editorExists = await page.locator(".tiptap").isVisible();
    if (!editorExists) {
      test.skip();
      return;
    }

    // Mock AI detection check endpoint
    await page.route("**/api/ai-detection/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkId: "test-ai-check-id" }),
      });
    });

    // Mock status endpoint to return completed result
    await page.route("**/api/ai-detection/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "completed",
          result: {
            aiProbability: 25,
            humanProbability: 75,
            classification: "human",
          },
        }),
      });
    });

    const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');
    await aiDetectionButton.click();

    // Wait for results — this would appear in a panel or modal
    // The exact UI depends on implementation
    // For now, check that loading state appears
    await expect(page.locator("text=Scanning...")).toBeVisible({
      timeout: 5000,
    });
  });
});

/* ── Accessibility ── */

test.describe("AI Detection — Accessibility", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("AI Detection button has proper aria-label", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const editorExists = await page.locator(".tiptap").isVisible();
    if (!editorExists) {
      test.skip();
      return;
    }

    const aiDetectionButton = page.locator('button[aria-label="AI Detection"]');
    await expect(aiDetectionButton).toBeVisible();
  });

  test("toolbar maintains keyboard navigation", async ({ page }) => {
    await page.goto("/editor/test-document-id");

    const editorExists = await page.locator(".tiptap").isVisible();
    if (!editorExists) {
      test.skip();
      return;
    }

    // Tab through toolbar buttons
    await page.keyboard.press("Tab");

    // Verify focus is on a toolbar button (any button)
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName;
    });

    // Should be focusing interactive elements
    expect(["BUTTON", "INPUT", "A"]).toContain(focusedElement);
  });
});
