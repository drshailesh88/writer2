import { test, expect } from "@playwright/test";

test.describe("Free Plagiarism Check Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/plagiarism-free");
  });

  /* ── Page Structure ── */

  test("page loads with header, title, and description", async ({ page }) => {
    // Header navigation
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header").locator("text=V1")).toBeVisible();
    await expect(page.locator("header").locator("text=Drafts")).toBeVisible();
    await expect(page.locator("header >> text=Sign In")).toBeVisible();
    await expect(page.locator("header >> text=Get Started")).toBeVisible();

    // Page heading
    await expect(
      page.locator("h1", { hasText: "Free Plagiarism Checker" })
    ).toBeVisible();

    // Description
    await expect(
      page.locator("text=Check your text for plagiarism")
    ).toBeVisible();
  });

  test("renders textarea with correct placeholder", async ({ page }) => {
    const textarea = page.locator("#plagiarism-input");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute(
      "placeholder",
      /Paste or type your text here/
    );
  });

  test("renders Check for Plagiarism button", async ({ page }) => {
    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await expect(button).toBeVisible();
  });

  /* ── Word Counter ── */

  test("displays 0 words when textarea is empty", async ({ page }) => {
    await expect(page.locator("text=0 / 1,000 words")).toBeVisible();
  });

  test("updates word count when text is pasted", async ({ page }) => {
    const textarea = page.locator("#plagiarism-input");
    const sampleText = "This is a test sentence with ten words in total.";
    await textarea.fill(sampleText);

    // Should show 10 words
    await expect(page.locator("text=/10.*1,000 words/")).toBeVisible();
  });

  test("shows 800 words when 800-word text is pasted", async ({ page }) => {
    const textarea = page.locator("#plagiarism-input");
    // Generate 800 words
    const words = Array(800).fill("word").join(" ");
    await textarea.fill(words);

    await expect(page.locator("text=/800.*1,000 words/")).toBeVisible();
  });

  /* ── Word Limit Validation ── */

  test("shows error when word limit is exceeded (1200 words)", async ({
    page,
  }) => {
    const textarea = page.locator("#plagiarism-input");
    // Generate 1200 words
    const words = Array(1200).fill("word").join(" ");
    await textarea.fill(words);

    // Should show error message
    await expect(
      page.locator("text=Free checks are limited to 1,000 words")
    ).toBeVisible();

    // Word count should be styled as error (red text)
    const wordCount = page.locator("text=/1,200.*1,000 words/");
    await expect(wordCount).toBeVisible();
  });

  test("button is disabled when textarea is empty", async ({ page }) => {
    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await expect(button).toBeDisabled();
  });

  test("button is disabled when over word limit", async ({ page }) => {
    const textarea = page.locator("#plagiarism-input");
    const words = Array(1200).fill("word").join(" ");
    await textarea.fill(words);

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await expect(button).toBeDisabled();
  });

  test("button is enabled with valid word count", async ({ page }) => {
    const textarea = page.locator("#plagiarism-input");
    await textarea.fill("This is a valid test with less than 1000 words.");

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await expect(button).toBeEnabled();
  });

  /* ── API Mock & Results ── */

  test("shows loading state when check is submitted", async ({ page }) => {
    // Mock the API to delay response
    await page.route("**/api/plagiarism/check", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkId: "test-check-id-123" }),
      });
    });

    // Mock status endpoint to stay pending
    await page.route("**/api/plagiarism/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "pending" }),
      });
    });

    const textarea = page.locator("#plagiarism-input");
    await textarea.fill("This is test content for plagiarism check.");

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await button.click();

    // Should show loading state
    await expect(page.locator("text=Scanning...")).toBeVisible();
    await expect(
      page.locator("text=Scanning your text for plagiarism")
    ).toBeVisible();
  });

  test("shows results after successful plagiarism check", async ({ page }) => {
    // Mock the check endpoint
    await page.route("**/api/plagiarism/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkId: "test-check-id-123" }),
      });
    });

    // Mock status endpoint to return completed result
    await page.route("**/api/plagiarism/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "completed",
          result: {
            overallSimilarity: 15,
            sources: [
              {
                id: "source-1",
                title: "Sample Academic Paper",
                url: "https://example.com/paper",
                matchedWords: 50,
                totalWords: 500,
                similarity: 10,
                matchedText: "This is a sample matched text from the source.",
              },
            ],
          },
        }),
      });
    });

    const textarea = page.locator("#plagiarism-input");
    await textarea.fill("This is test content for plagiarism check.");

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await button.click();

    // Wait for results to appear
    await expect(
      page.locator("text=Plagiarism Check Complete")
    ).toBeVisible({ timeout: 10000 });

    // Should show similarity percentage
    await expect(page.locator("text=15%")).toBeVisible();

    // Should show similarity badge
    await expect(page.getByText("Moderate Similarity", { exact: true })).toBeVisible();

    // Should show matched sources
    await expect(page.locator("text=Matching Sources (1)")).toBeVisible();
    await expect(page.locator("text=Sample Academic Paper")).toBeVisible();
  });

  test("shows no plagiarism celebration for 0% similarity", async ({
    page,
  }) => {
    await page.route("**/api/plagiarism/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkId: "test-check-id-123" }),
      });
    });

    await page.route("**/api/plagiarism/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "completed",
          result: {
            overallSimilarity: 0,
            sources: [],
          },
        }),
      });
    });

    const textarea = page.locator("#plagiarism-input");
    await textarea.fill("This is completely original content.");

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await button.click();

    // Should show celebration message
    await expect(page.locator("h3", { hasText: "No plagiarism detected" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=0%")).toBeVisible();
  });

  /* ── Sign-Up CTA After Results ── */

  test("shows sign-up CTA after results are displayed", async ({ page }) => {
    await page.route("**/api/plagiarism/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkId: "test-check-id-123" }),
      });
    });

    await page.route("**/api/plagiarism/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "completed",
          result: {
            overallSimilarity: 5,
            sources: [],
          },
        }),
      });
    });

    const textarea = page.locator("#plagiarism-input");
    await textarea.fill("Test content.");

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    await button.click();

    // Wait for results
    await expect(
      page.locator("text=Plagiarism Check Complete")
    ).toBeVisible({ timeout: 10000 });

    // Should show sign-up CTA
    await expect(page.locator("text=Want more? Sign up for free")).toBeVisible();
    await expect(
      page.locator("text=2 plagiarism checks/month")
    ).toBeVisible();
    await expect(page.locator("text=AI detection")).toBeVisible();
    await expect(
      page.locator("text=Paper search across 200M+ papers")
    ).toBeVisible();
    await expect(
      page.locator("text=Draft Mode with AI writing assistance")
    ).toBeVisible();

    // Sign up button in CTA
    const signUpButton = page
      .locator("text=Want more?")
      .locator("..")
      .locator("..")
      .locator('a[href="/sign-up"]');
    await expect(signUpButton).toBeVisible();
  });

  /* ── Mobile Responsiveness ── */

  test("renders correctly on mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/plagiarism-free");

    // Header should be visible
    await expect(page.locator("header")).toBeVisible();

    // Title should be visible and wrapped correctly
    await expect(
      page.locator("h1", { hasText: "Free Plagiarism Checker" })
    ).toBeVisible();

    // Textarea should be visible
    await expect(page.locator("#plagiarism-input")).toBeVisible();

    // Button should have minimum 44px height
    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    const box = await button.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("touch targets are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/plagiarism-free");

    const textarea = page.locator("#plagiarism-input");
    await textarea.fill("Test");

    const button = page.locator("button", {
      hasText: "Check for Plagiarism",
    });
    const box = await button.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Header buttons
    const signInBtn = page.locator("header >> text=Sign In");
    const signInBox = await signInBtn.boundingBox();
    expect(signInBox).toBeTruthy();
    expect(signInBox!.height).toBeGreaterThanOrEqual(44);
  });

  /* ── Cookie Gate ── */

  test("shows already-used message when cookie is set", async ({ page }) => {
    // Set cookie to simulate already used free check
    await page.context().addCookies([
      {
        name: "v1d_free_check_used",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/plagiarism-free");

    await expect(
      page.locator("text=You've already used your free check")
    ).toBeVisible();
    await expect(
      page.locator("text=Sign up for a free account to get 2 plagiarism checks per month")
    ).toBeVisible();

    // Textarea should not be visible
    await expect(page.locator("#plagiarism-input")).not.toBeVisible();
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
});
