import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  /* ── Navigation ── */

  test("renders sticky navigation with logo and CTAs", async ({ page }) => {
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Logo
    await expect(header.locator("text=V1")).toBeVisible();
    await expect(header.locator("text=Drafts")).toBeVisible();

    // Nav CTAs
    await expect(header.locator("text=Sign In")).toBeVisible();
    await expect(header.locator("text=Get Started")).toBeVisible();
  });

  test("navigation Get Started links to sign-up", async ({ page }) => {
    await page.locator("header").locator("text=Get Started").click();
    await expect(page).toHaveURL(/sign-up/);
  });

  test("navigation Sign In links to sign-in", async ({ page }) => {
    await page.locator("header").locator("text=Sign In").click();
    await expect(page).toHaveURL(/sign-in/);
  });

  /* ── Hero Section ── */

  test("renders hero with headline, subtitle, and CTAs", async ({ page }) => {
    // Headline
    await expect(
      page.locator("h1", { hasText: "Your research thesis" })
    ).toBeVisible();
    await expect(
      page.locator("h1", { hasText: "from blank page to submission" })
    ).toBeVisible();

    // Badge
    await expect(
      page.locator("text=Built for Medical Students")
    ).toBeVisible();

    // Subtitle
    await expect(
      page.locator("text=Learn the craft of academic writing")
    ).toBeVisible();

    // CTAs
    await expect(
      page.locator("text=Start Writing for Free")
    ).toBeVisible();
    await expect(page.locator("main >> text=Sign In").or(page.locator("section >> text=Sign In").first())).toBeVisible();

    // Sub-text
    await expect(
      page.locator("text=No credit card required")
    ).toBeVisible();
  });

  test("hero Start Writing for Free links to sign-up", async ({ page }) => {
    await page.locator("text=Start Writing for Free").click();
    await expect(page).toHaveURL(/sign-up/);
  });

  /* ── Two Modes Section ── */

  test("renders Learn Mode and Draft Mode cards", async ({ page }) => {
    // Section heading
    await expect(page.locator("text=Choose your path")).toBeVisible();
    await expect(page.locator("text=Two Ways to Write")).toBeVisible();

    // Learn Mode card
    const learnCard = page.locator("text=Learn Mode").first();
    await expect(learnCard).toBeVisible();
    await expect(
      page.locator("text=Interactive coaching by AI mentor")
    ).toBeVisible();
    await expect(
      page.locator("text=Stage-by-stage guidance")
    ).toBeVisible();

    // Draft Mode card
    const draftCard = page.locator("text=Draft Mode").first();
    await expect(draftCard).toBeVisible();
    await expect(
      page.locator("text=AI-powered section drafting")
    ).toBeVisible();
    await expect(
      page.locator("text=One-click bibliography generation")
    ).toBeVisible();
  });

  /* ── Features Grid ── */

  test("renders all 6 features", async ({ page }) => {
    await expect(
      page.locator("text=One platform, every research tool")
    ).toBeVisible();

    const features = [
      "Paper Search",
      "Smart Citations",
      "Plagiarism Check",
      "AI Detection",
      "Deep Research",
      "Bibliography",
    ];

    for (const feature of features) {
      await expect(
        page.locator(`h3:has-text("${feature}")`)
      ).toBeVisible();
    }
  });

  test("features have descriptions", async ({ page }) => {
    await expect(
      page.locator("text=Search PubMed, Semantic Scholar")
    ).toBeVisible();
    await expect(
      page.locator("text=Auto-generate and insert citations")
    ).toBeVisible();
    await expect(
      page.locator("text=Scan your drafts for AI-generated")
    ).toBeVisible();
  });

  /* ── How It Works ── */

  test("renders 3-step how-it-works section", async ({ page }) => {
    await expect(
      page.locator("text=Three steps to your manuscript")
    ).toBeVisible();

    // Step numbers (use exact match to avoid matching "© 2026")
    await expect(page.getByText("01", { exact: true })).toBeVisible();
    await expect(page.getByText("02", { exact: true })).toBeVisible();
    await expect(page.getByText("03", { exact: true })).toBeVisible();

    // Step titles
    await expect(
      page.locator("h3:has-text('Choose your mode')")
    ).toBeVisible();
    await expect(
      page.locator("h3:has-text('Research & write')")
    ).toBeVisible();
    await expect(
      page.locator("h3:has-text('Check & submit')")
    ).toBeVisible();
  });

  /* ── Pricing Section ── */

  test("renders 3 pricing tiers with correct prices", async ({ page }) => {
    await expect(
      page.locator("text=Start free, upgrade when ready")
    ).toBeVisible();

    // Free tier
    await expect(page.locator("text=₹0")).toBeVisible();
    await expect(
      page.locator("text=Learn Mode — unlimited access")
    ).toBeVisible();
    await expect(
      page.locator("text=2 plagiarism checks per month")
    ).toBeVisible();

    // Basic tier
    await expect(page.locator("text=₹299")).toBeVisible();
    await expect(
      page.locator("text=Draft Mode — AI-assisted writing")
    ).toBeVisible();
    await expect(
      page.locator("text=10 AI detection checks per month")
    ).toBeVisible();

    // Pro tier
    await expect(page.locator("text=₹599")).toBeVisible();
    await expect(
      page.locator("text=Unlimited plagiarism checks")
    ).toBeVisible();
    await expect(
      page.locator("text=Priority support")
    ).toBeVisible();
  });

  test("Basic plan is highlighted as Most Popular", async ({ page }) => {
    await expect(page.locator("text=Most Popular")).toBeVisible();
  });

  test("pricing CTAs link to sign-up", async ({ page }) => {
    const startBasicBtn = page.locator("text=Start Basic");
    await expect(startBasicBtn).toBeVisible();
    // All pricing CTAs should link to /sign-up
    const pricingLinks = page.locator('section:has-text("Simple Pricing") a[href="/sign-up"]');
    const count = await pricingLinks.count();
    expect(count).toBe(3);
  });

  /* ── CTA Banner ── */

  test("renders CTA banner section", async ({ page }) => {
    await expect(
      page.locator("text=Ready to start your research thesis?")
    ).toBeVisible();
    await expect(
      page.locator("text=Join medical students across India")
    ).toBeVisible();
    const ctaBtn = page.locator("text=Get Started");
    await expect(ctaBtn.last()).toBeVisible();
  });

  /* ── Footer ── */

  test("renders footer with copyright and links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(
      footer.locator("text=All research needs met under one single roof")
    ).toBeVisible();
    await expect(footer.locator("text=Sign In")).toBeVisible();
    await expect(footer.locator("text=Sign Up")).toBeVisible();
  });

  /* ── Mobile Responsiveness ── */

  test("landing page stacks sections vertically on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // All major sections should be visible
    await expect(
      page.locator("h1", { hasText: "Your research thesis" })
    ).toBeVisible();
    await expect(page.locator("text=Choose your path")).toBeVisible();
    await expect(
      page.locator("text=One platform, every research tool")
    ).toBeVisible();
    await expect(
      page.locator("text=Three steps to your manuscript")
    ).toBeVisible();
    await expect(
      page.locator("text=Start free, upgrade when ready")
    ).toBeVisible();
  });

  test("no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("44px minimum touch targets on mobile for CTA buttons", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Check all visible buttons with text content for 44px minimum
    // Excludes system buttons (Next.js dev tools) that have no user-facing text
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const text = (await btn.textContent())?.trim() ?? "";
        if (text.length === 0) continue; // skip system/icon-only buttons
        const box = await btn.boundingBox();
        if (box) {
          expect(
            box.height,
            `Button "${text}" has height ${box.height}px`
          ).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  /* ── Tablet Viewport ── */

  test("renders correctly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(
      page.locator("h1", { hasText: "Your research thesis" })
    ).toBeVisible();
    await expect(page.locator("text=Choose your path")).toBeVisible();
    await expect(
      page.locator("text=Start free, upgrade when ready")
    ).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  /* ── Accessibility ── */

  test("headings follow correct hierarchy", async ({ page }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    const h2s = page.locator("h2");
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(4); // modes, features, how-it-works, pricing, CTA
  });

  test("images and decorative elements have proper aria attributes", async ({
    page,
  }) => {
    // Decorative elements should have aria-hidden
    const decorative = page.locator("[aria-hidden='true']");
    const count = await decorative.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
