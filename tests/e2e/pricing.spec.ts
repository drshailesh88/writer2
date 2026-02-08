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
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  /* ── Page Structure ── */

  test("renders pricing page heading and description", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Simple, transparent pricing" })
    ).toBeVisible();
    await expect(
      page.locator("text=All research needs met under one single roof")
    ).toBeVisible();
  });

  test("renders all 3 pricing plan cards", async ({ page }) => {
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
    // Free: INR 0
    await expect(page.locator("text=0").first()).toBeVisible();

    // Basic: INR 1,000/month
    await expect(page.locator("text=1,000").first()).toBeVisible();
    await expect(page.locator("text=/month").first()).toBeVisible();

    // Pro: INR 2,000/month
    await expect(page.locator("text=2,000").first()).toBeVisible();
  });

  test("Basic plan is highlighted as Most Popular", async ({ page }) => {
    await expect(page.locator("text=Most Popular")).toBeVisible();
  });

  test("Pro plan shows Coming Soon badge", async ({ page }) => {
    await expect(page.locator("text=Coming Soon").first()).toBeVisible();
  });

  /* ── Feature Lists ── */

  test("shows feature comparison for all plans", async ({ page }) => {
    await expect(page.locator("text=Learn Mode").first()).toBeVisible();
    await expect(page.locator("text=Draft Mode (Guided + Hands-off)").first()).toBeVisible();
    await expect(page.locator("text=Plagiarism Checks").first()).toBeVisible();
    await expect(page.locator("text=AI Detection").first()).toBeVisible();
    await expect(page.locator("text=Deep Research").first()).toBeVisible();
    await expect(page.locator("text=Paper Search & Library").first()).toBeVisible();
    await expect(page.locator("text=Citations & Bibliography").first()).toBeVisible();
    await expect(page.locator("text=DOCX & PDF Export").first()).toBeVisible();
  });

  test("feature comparison shows different limits per tier", async ({ page }) => {
    await expect(page.locator("text=2/month").first()).toBeVisible();
    await expect(page.locator("text=5/month").first()).toBeVisible();
    await expect(page.locator("text=20/month").first()).toBeVisible();
  });

  /* ── CTA Buttons ── */

  test("Free plan shows Current Plan button when user is on free tier", async ({ page }) => {
    const currentPlanButton = page.locator("text=Current Plan").first();
    const isVisible = await currentPlanButton.isVisible();

    if (isVisible) {
      await expect(currentPlanButton).toBeDisabled();
    }
  });

  test("Basic plan Subscribe button exists", async ({ page }) => {
    const subscribeButton = page.locator("text=Subscribe to Basic").first();
    await expect(subscribeButton).toBeVisible();
  });

  test("Pro plan button shows Coming Soon and is disabled", async ({ page }) => {
    const proButton = page
      .locator("button", { hasText: "Coming Soon" })
      .last();
    await expect(proButton).toBeVisible();
    await expect(proButton).toBeDisabled();
  });

  /* ── Feature Comparison Table ── */

  test("desktop view shows feature comparison table", async ({ page }) => {
    const table = page.locator("table");
    await expect(table).toBeVisible();

    await expect(table.locator("th", { hasText: "Free" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Basic" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Pro" })).toBeVisible();
  });

  /* ── FAQ Section ── */

  test("renders FAQ section with questions", async ({ page }) => {
    await expect(
      page.locator("text=Frequently asked questions")
    ).toBeVisible();

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
    const firstQuestion = page.locator(
      "text=What payment methods do you accept?"
    );
    await firstQuestion.click();

    await expect(
      page.locator("text=We accept all major payment methods through Razorpay")
    ).toBeVisible();
  });

  test("FAQ items collapse when clicked again", async ({ page }) => {
    const firstQuestion = page.locator(
      "text=What payment methods do you accept?"
    );

    await firstQuestion.click();
    await expect(
      page.locator("text=We accept all major payment methods through Razorpay")
    ).toBeVisible();

    await firstQuestion.click();
    await expect(
      page.locator("text=We accept all major payment methods through Razorpay")
    ).not.toBeVisible();
  });

  /* ── Bottom CTA ── */

  test("renders bottom CTA section", async ({ page }) => {
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

    await expect(
      page.locator("h1", { hasText: "Simple, transparent pricing" })
    ).toBeVisible();

    await expect(page.locator("text=Free").first()).toBeVisible();
    await expect(page.locator("text=Basic").first()).toBeVisible();
    await expect(page.locator("text=Pro").first()).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("mobile shows feature comparison cards instead of table", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");

    const table = page.locator("table");
    await expect(table).not.toBeVisible();

    await expect(page.locator("text=Plagiarism Checks")).toBeVisible();
  });

  test("touch targets are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");

    const subscribeButton = page.locator("text=Subscribe to Basic").first();
    const box = await subscribeButton.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

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
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });

  test("FAQ buttons have proper aria attributes", async ({ page }) => {
    const firstFaqButton = page
      .locator("button", { hasText: "What payment methods do you accept?" })
      .first();

    await expect(firstFaqButton).toHaveAttribute("aria-expanded", "false");

    await firstFaqButton.click();
    await expect(firstFaqButton).toHaveAttribute("aria-expanded", "true");
  });

  test("Subscribe buttons have descriptive aria-labels", async ({ page }) => {
    const subscribeButton = page
      .locator("button", { hasText: "Subscribe to Basic" })
      .first();

    const ariaLabel = await subscribeButton.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain("Basic");
  });
});
