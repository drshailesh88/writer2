import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  /* ── Unauthenticated Access ── */

  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

/* ── Authenticated Pricing Page Tests ── */

test.describe("Pricing Page — Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");

    // Skip if redirected to sign-in
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }
  });

  /* ── Page Structure ── */

  test("renders pricing page heading and description", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(
      page.locator("h1", { hasText: "Simple, transparent pricing" })
    ).toBeVisible();
    await expect(
      page.locator("text=All research needs met under one single roof")
    ).toBeVisible();
  });

  test("renders all 3 pricing plan cards", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Free plan
    await expect(page.locator("text=Free").first()).toBeVisible();
    await expect(
      page.locator("text=Get started with essential research tools")
    ).toBeVisible();

    // Basic plan
    await expect(page.locator("text=Basic").first()).toBeVisible();
    await expect(
      page.locator("text=Everything you need to write your thesis")
    ).toBeVisible();

    // Pro plan
    await expect(page.locator("text=Pro").first()).toBeVisible();
    await expect(
      page.locator("text=For power users and research teams")
    ).toBeVisible();
  });

  test("displays correct pricing for all tiers", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Free: INR 0
    await expect(page.locator("text=0").first()).toBeVisible();

    // Basic: INR 1,000/month
    await expect(page.locator("text=1,000").first()).toBeVisible();
    await expect(page.locator("text=/month").first()).toBeVisible();

    // Pro: INR 2,000/month
    await expect(page.locator("text=2,000").first()).toBeVisible();
  });

  test("Basic plan is highlighted as Most Popular", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(page.locator("text=Most Popular")).toBeVisible();
  });

  test("Pro plan shows Coming Soon badge", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Pro plan should have Coming Soon badge
    await expect(page.locator("text=Coming Soon").first()).toBeVisible();
  });

  /* ── Feature Lists ── */

  test("shows feature comparison for all plans", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Check key features are listed
    await expect(page.locator("text=Plagiarism Checks")).toBeVisible();
    await expect(page.locator("text=AI Detection")).toBeVisible();
    await expect(page.locator("text=Paper Search")).toBeVisible();
    await expect(page.locator("text=Citations & Bibliography")).toBeVisible();
    await expect(page.locator("text=Deep Research")).toBeVisible();
    await expect(page.locator("text=Learn Mode")).toBeVisible();
    await expect(page.locator("text=Draft Mode")).toBeVisible();
  });

  test("feature comparison shows different limits per tier", async ({
    page,
  }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Plagiarism checks: 2/month (free), 5/month (basic), 20/month (pro)
    await expect(page.locator("text=2/month").first()).toBeVisible();
    await expect(page.locator("text=5/month").first()).toBeVisible();
    await expect(page.locator("text=20/month").first()).toBeVisible();
  });

  /* ── CTA Buttons ── */

  test("Free plan shows Current Plan button when user is on free tier", async ({
    page,
  }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // For users on free tier, should see "Current Plan" button
    const currentPlanButton = page.locator("text=Current Plan").first();
    const isVisible = await currentPlanButton.isVisible();

    if (isVisible) {
      await expect(currentPlanButton).toBeDisabled();
    }
  });

  test("Basic plan Subscribe button exists", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Subscribe to Basic button should exist
    const subscribeButton = page.locator("text=Subscribe to Basic").first();
    await expect(subscribeButton).toBeVisible();
  });

  test("Pro plan button shows Coming Soon and is disabled", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Pro plan button should be disabled with Coming Soon text
    const proButton = page
      .locator("button", { hasText: "Coming Soon" })
      .last();
    await expect(proButton).toBeVisible();
    await expect(proButton).toBeDisabled();
  });

  /* ── Feature Comparison Table ── */

  test("desktop view shows feature comparison table", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop table should be visible on larger viewports
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Table should have header row with plan names
    await expect(table.locator("th", { hasText: "Free" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Basic" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Pro" })).toBeVisible();
  });

  /* ── FAQ Section ── */

  test("renders FAQ section with questions", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(
      page.locator("text=Frequently asked questions")
    ).toBeVisible();

    // Check some FAQ questions
    await expect(
      page.locator("text=What payment methods do you accept?")
    ).toBeVisible();
    await expect(
      page.locator("text=Can I cancel my subscription anytime?")
    ).toBeVisible();
    await expect(
      page.locator("text=What happens when I hit my monthly limit?")
    ).toBeVisible();
  });

  test("FAQ items are expandable", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    const firstQuestion = page.locator(
      "text=What payment methods do you accept?"
    );
    await firstQuestion.click();

    // Answer should appear
    await expect(
      page.locator("text=We accept all major payment methods through Razorpay")
    ).toBeVisible();
  });

  test("FAQ items collapse when clicked again", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    const firstQuestion = page.locator(
      "text=What payment methods do you accept?"
    );

    // Expand
    await firstQuestion.click();
    await expect(
      page.locator("text=We accept all major payment methods through Razorpay")
    ).toBeVisible();

    // Collapse
    await firstQuestion.click();
    await expect(
      page.locator("text=We accept all major payment methods through Razorpay")
    ).not.toBeVisible();
  });

  /* ── Bottom CTA ── */

  test("renders bottom CTA section", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    await expect(
      page.locator("text=Ready to accelerate your research?")
    ).toBeVisible();
    await expect(
      page.locator("text=Join thousands of medical students writing better papers, faster")
    ).toBeVisible();
  });

  /* ── Mobile Responsiveness ── */

  test("renders correctly on mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Heading should be visible
    await expect(
      page.locator("h1", { hasText: "Simple, transparent pricing" })
    ).toBeVisible();

    // All 3 plan cards should be visible (stacked vertically)
    await expect(page.locator("text=Free").first()).toBeVisible();
    await expect(page.locator("text=Basic").first()).toBeVisible();
    await expect(page.locator("text=Pro").first()).toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("mobile shows feature comparison cards instead of table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Desktop table should be hidden
    const table = page.locator("table");
    await expect(table).not.toBeVisible();

    // Mobile cards should be visible
    await expect(page.locator("text=Plagiarism Checks")).toBeVisible();
  });

  test("touch targets are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");

    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Check Subscribe button
    const subscribeButton = page.locator("text=Subscribe to Basic").first();
    const box = await subscribeButton.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // Check FAQ toggle buttons
    const faqButton = page
      .locator("button", { hasText: "What payment methods do you accept?" })
      .first();
    const faqBox = await faqButton.boundingBox();

    if (faqBox) {
      expect(faqBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  /* ── Accessibility ── */

  test("page has correct heading hierarchy", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Should have exactly one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Should have h2s for sections
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });

  test("FAQ buttons have proper aria attributes", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    const firstFaqButton = page
      .locator("button", { hasText: "What payment methods do you accept?" })
      .first();

    // Should have aria-expanded attribute
    await expect(firstFaqButton).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    await firstFaqButton.click();
    await expect(firstFaqButton).toHaveAttribute("aria-expanded", "true");
  });

  test("Subscribe buttons have descriptive aria-labels", async ({ page }) => {
    const url = page.url();
    if (url.includes("sign-in")) {
      test.skip();
      return;
    }

    // Basic plan button should have aria-label
    const subscribeButton = page
      .locator("button", { hasText: "Subscribe to Basic" })
      .first();

    const ariaLabel = await subscribeButton.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain("Basic");
  });
});
