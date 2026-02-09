import { test, expect } from "@playwright/test";

test.describe("Session Limit Enforcement", () => {
  test.skip(!process.env.CLERK_TESTING_TOKEN, "Requires CLERK_TESTING_TOKEN");

  test("third concurrent session is blocked", async ({ browser }) => {
    const token = process.env.CLERK_TESTING_TOKEN!;

    const openAuthedDashboard = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("/");
      await page.evaluate((value) => {
        document.cookie = `__session=${value}; path=/`;
      }, token);
      await page.goto("/dashboard");
      return { context, page };
    };

    const s1 = await openAuthedDashboard();
    await expect(s1.page.getByText("Quick Actions")).toBeVisible({
      timeout: 15000,
    });

    const s2 = await openAuthedDashboard();
    await expect(s2.page.getByText("Quick Actions")).toBeVisible({
      timeout: 15000,
    });

    // Give heartbeats a moment to register
    await s1.page.waitForTimeout(1500);
    await s2.page.waitForTimeout(1500);

    const s3 = await openAuthedDashboard();
    await expect(s3.page.getByText("Session limit reached")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      s3.page.getByRole("button", { name: "Sign out" })
    ).toBeVisible();

    await s1.context.close();
    await s2.context.close();
    await s3.context.close();
  });
});
