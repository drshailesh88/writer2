import { test as base } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

/**
 * Custom test fixture that handles Clerk authentication.
 *
 * Usage in test files:
 *   import { test, expect } from "../fixtures/auth";
 *
 * For authenticated tests:
 *   test("my test", async ({ page, clerk }) => {
 *     await clerk.signIn({ ... });
 *     // test logic
 *   });
 *
 * Requirements:
 *   - CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env.local
 *   - E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD in .env.local
 *   - A test user created in Clerk Dashboard with those credentials
 */

// Re-export expect for convenience
export { expect } from "@playwright/test";

// Extend the base test with Clerk auth helpers
export const test = base.extend<{
  /** Whether Clerk auth is available for this test run */
  clerkAvailable: boolean;
}>({
  clerkAvailable: [
    async ({}, use) => {
      const hasKey =
        !!process.env.CLERK_SECRET_KEY || !!process.env.CLERK_TESTING_TOKEN;
      await use(hasKey);
    },
    { scope: "test" },
  ],

  page: async ({ page }, use) => {
    // Set up Clerk testing token if available (bypasses bot detection)
    if (process.env.CLERK_SECRET_KEY || process.env.CLERK_TESTING_TOKEN) {
      await setupClerkTestingToken({ page });
    }
    await use(page);
  },
});

/**
 * Helper to sign in with a test user through the Clerk UI.
 * Call this after navigating to a page that shows the sign-in form.
 */
export async function signInTestUser(page: import("@playwright/test").Page) {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD must be set in environment"
    );
  }

  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Fill in the Clerk sign-in form
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  // Wait for password field and fill it
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();

  // Wait for redirect away from sign-in
  await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
    timeout: 15000,
  });
}
