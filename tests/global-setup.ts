import { clerkSetup } from "@clerk/testing/playwright";

export default async function globalSetup() {
  if (process.env.CLERK_SECRET_KEY || process.env.CLERK_TESTING_TOKEN) {
    await clerkSetup();
  }
}
