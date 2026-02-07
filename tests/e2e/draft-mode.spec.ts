import { test, expect } from "@playwright/test";

test.describe("Draft Mode — Unauthenticated", () => {
  test("redirects unauthenticated users to sign-in when accessing editor", async ({
    page,
  }) => {
    await page.goto("/editor/test-draft-document-id");
    await expect(page).toHaveURL(/sign-in/);
  });
});

/**
 * Authenticated Draft Mode tests.
 *
 * These tests require:
 * 1. A Clerk testing token (set CLERK_TESTING_TOKEN in .env.test)
 * 2. A valid document ID in Convex
 *
 * To enable, ensure CLERK_TESTING_TOKEN is configured.
 */
test.describe("Draft Mode — Authenticated", () => {
  test.skip(
    !process.env.CLERK_TESTING_TOKEN,
    "Requires CLERK_TESTING_TOKEN to test authenticated draft mode"
  );

  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await page.goto("/");
      await page.evaluate((token) => {
        document.cookie = `__session=${token}; path=/`;
      }, process.env.CLERK_TESTING_TOKEN);
    }
  });

  /* ── Dashboard Quick Actions ── */

  test("dashboard shows 'New Draft (Guided)' quick action", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=New Draft (Guided)")).toBeVisible();
  });

  test("dashboard shows 'New Draft (Hands-off)' quick action", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=New Draft (Hands-off)")).toBeVisible();
  });

  /* ── Subscription Gating ── */

  test.describe("Free Tier Restrictions", () => {
    test("free tier users see lock icon on draft cards", async ({ page }) => {
      // Mock subscription API to return free tier
      await page.route("**/api/subscription/status", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tier: "free",
            active: true,
          }),
        });
      });

      await page.goto("/dashboard");

      // Draft cards should show lock icon
      const guidedCard = page.locator("text=New Draft (Guided)").locator("..");
      await expect(guidedCard.locator("svg").first()).toBeVisible();
    });
  });

  /* ── Guided Draft Mode ── */

  test.describe("Guided Draft Workflow", () => {
    test("can create a Guided Draft document from dashboard", async ({
      page,
    }) => {
      // Mock document creation
      await page.route("**/api/documents/create", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            documentId: "test-guided-draft-id",
          }),
        });
      });

      await page.goto("/dashboard");
      await page.locator("text=New Draft (Guided)").click();

      // Should navigate to editor with the new document
      await expect(page).toHaveURL(/\/editor\/test-guided-draft-id/);
    });

    test("editor loads with Draft Mode panel for guided mode", async ({
      page,
    }) => {
      // Mock document query
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.goto("/editor/test-guided-draft-id");

      // Draft Mode panel should be visible
      await expect(page.locator("text=Guided Draft")).toBeVisible();
      await expect(
        page.locator("text=AI assists at each step with your approval")
      ).toBeVisible();
    });

    test("can enter topic and start guided workflow", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      // Mock workflow start
      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [
                  {
                    title: "Introduction",
                    subsections: ["Background", "Research Question"],
                  },
                  {
                    title: "Methods",
                    subsections: ["Study Design", "Data Collection"],
                  },
                  {
                    title: "Results",
                    subsections: ["Primary Outcomes", "Secondary Outcomes"],
                  },
                ],
              },
            },
          }),
        });
      });

      await page.goto("/editor/test-guided-draft-id");

      // Enter topic
      const topicInput = page.locator('input[placeholder*="Laparoscopic"]');
      await expect(topicInput).toBeVisible();
      await topicInput.fill("Efficacy of laparoscopic vs open appendectomy");

      // Start workflow
      const startButton = page.locator(
        "text=Start Guided Workflow"
      );
      await startButton.click();

      // Should show loading state
      await expect(page.locator("text=Processing...")).toBeVisible({
        timeout: 5000,
      });
    });

    test("outline approval step shows generated outline", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [
                  {
                    title: "Introduction",
                    subsections: ["Background", "Objectives"],
                  },
                  {
                    title: "Methods",
                    subsections: ["Study Design"],
                  },
                ],
              },
            },
          }),
        });
      });

      await page.goto("/editor/test-guided-draft-id");

      const topicInput = page.locator('input[placeholder*="Laparoscopic"]');
      await topicInput.fill("Test topic");
      await page.locator("text=Start Guided Workflow").click();

      // Outline should be visible
      await expect(page.locator("text=Generated Outline:")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator("text=Introduction")).toBeVisible();
      await expect(page.locator("text=Methods")).toBeVisible();

      // Approve/Regenerate buttons should be visible
      await expect(page.locator("text=Approve Outline")).toBeVisible();
      await expect(page.locator("text=Regenerate")).toBeVisible();
    });

    test("paper approval step shows found papers by section", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [{ title: "Introduction", subsections: [] }],
              },
            },
          }),
        });
      });

      await page.route("**/api/draft/resume", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "find-papers",
            suspendPayload: {
              papersBySection: {
                Introduction: [
                  {
                    title: "A Comparative Study of Surgical Approaches",
                    authors: "Smith et al.",
                    year: 2023,
                    externalId: "pubmed-123",
                  },
                  {
                    title: "Outcomes in Modern Surgery",
                    authors: "Jones et al.",
                    year: 2022,
                    externalId: "pubmed-456",
                  },
                ],
              },
            },
          }),
        });
      });

      await page.goto("/editor/test-guided-draft-id");

      // Start and approve outline
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();
      await page.locator("text=Approve Outline").click({ timeout: 10000 });

      // Papers should be visible
      await expect(page.locator("text=Found Papers:")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator("text=A Comparative Study of Surgical Approaches")
      ).toBeVisible();
      await expect(page.locator("text=Approve Papers")).toBeVisible();
      await expect(page.locator("text=Search Again")).toBeVisible();
    });

    test("draft review step shows generated sections", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [{ title: "Introduction", subsections: [] }],
              },
            },
          }),
        });
      });

      let resumeCallCount = 0;
      await page.route("**/api/draft/resume", async (route) => {
        resumeCallCount++;
        if (resumeCallCount === 1) {
          // First resume: approve outline → find papers
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "suspended",
              suspendedStep: "find-papers",
              suspendPayload: {
                papersBySection: {
                  Introduction: [],
                },
              },
            }),
          });
        } else if (resumeCallCount === 2) {
          // Second resume: approve papers → write sections
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "suspended",
              suspendedStep: "write-sections",
              suspendPayload: {
                sectionDrafts: [
                  {
                    sectionTitle: "Introduction",
                    content:
                      "This study examines the comparative efficacy of laparoscopic versus open appendectomy procedures in adult patients...",
                  },
                  {
                    sectionTitle: "Methods",
                    content:
                      "A retrospective cohort study was conducted analyzing patient outcomes from 2020-2023...",
                  },
                ],
              },
            }),
          });
        }
      });

      await page.goto("/editor/test-guided-draft-id");

      // Start workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();

      // Approve outline
      await page.locator("text=Approve Outline").click({ timeout: 10000 });

      // Approve papers
      await page.locator("text=Approve Papers").click({ timeout: 10000 });

      // Draft sections should be visible
      await expect(page.locator("text=Draft Sections:")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator("text=This study examines the comparative efficacy")
      ).toBeVisible();
      await expect(page.locator("text=Insert into Editor")).toBeVisible();
      await expect(page.locator("text=Rewrite")).toBeVisible();
    });

    test("can approve at each step and complete workflow", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [{ title: "Introduction", subsections: [] }],
              },
            },
          }),
        });
      });

      let resumeCallCount = 0;
      await page.route("**/api/draft/resume", async (route) => {
        resumeCallCount++;
        if (resumeCallCount === 1) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "suspended",
              suspendedStep: "find-papers",
              suspendPayload: { papersBySection: { Introduction: [] } },
            }),
          });
        } else if (resumeCallCount === 2) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "suspended",
              suspendedStep: "write-sections",
              suspendPayload: {
                sectionDrafts: [
                  { sectionTitle: "Introduction", content: "Draft text..." },
                ],
              },
            }),
          });
        } else if (resumeCallCount === 3) {
          // Final approval → completed
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "completed",
              completeDraft:
                "# Introduction\n\nThis is the complete draft text...",
            }),
          });
        }
      });

      await page.goto("/editor/test-guided-draft-id");

      // Start workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();

      // Approve outline
      await page.locator("text=Approve Outline").click({ timeout: 10000 });

      // Approve papers
      await page.locator("text=Approve Papers").click({ timeout: 10000 });

      // Approve draft
      await page.locator("text=Insert into Editor").click({ timeout: 10000 });

      // Should show completion state
      await expect(page.locator("text=Draft Complete")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator(
          "text=Your draft has been inserted into the editor. Review and edit as needed."
        )
      ).toBeVisible();
    });

    test("final draft gets inserted into editor", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-guided-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [{ title: "Introduction", subsections: [] }],
              },
            },
          }),
        });
      });

      let resumeCallCount = 0;
      await page.route("**/api/draft/resume", async (route) => {
        resumeCallCount++;
        if (resumeCallCount === 3) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "completed",
              completeDraft:
                "# Introduction\n\nFinal draft content inserted into editor",
            }),
          });
        } else if (resumeCallCount === 2) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "suspended",
              suspendedStep: "write-sections",
              suspendPayload: {
                sectionDrafts: [
                  { sectionTitle: "Introduction", content: "Draft..." },
                ],
              },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "suspended",
              suspendedStep: "find-papers",
              suspendPayload: { papersBySection: {} },
            }),
          });
        }
      });

      await page.goto("/editor/test-guided-draft-id");

      // Complete workflow quickly
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();
      await page.locator("text=Approve Outline").click({ timeout: 10000 });
      await page.locator("text=Approve Papers").click({ timeout: 10000 });
      await page.locator("text=Insert into Editor").click({ timeout: 10000 });

      // Verify draft was inserted
      await expect(page.locator("text=Draft Complete")).toBeVisible({
        timeout: 10000,
      });

      // Start New Draft button should be visible
      await expect(page.locator("text=Start New Draft")).toBeVisible();
    });
  });

  /* ── Hands-off Draft Mode ── */

  test.describe("Hands-off Draft Workflow", () => {
    test("can create a Hands-off Draft document from dashboard", async ({
      page,
    }) => {
      await page.route("**/api/documents/create", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            documentId: "test-handsoff-draft-id",
          }),
        });
      });

      await page.goto("/dashboard");
      await page.locator("text=New Draft (Hands-off)").click();

      // Should navigate to editor
      await expect(page).toHaveURL(/\/editor\/test-handsoff-draft-id/);
    });

    test("disclaimer modal appears before starting hands-off workflow", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-handsoff-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_handsoff",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.goto("/editor/test-handsoff-draft-id");

      // Panel should show hands-off mode
      await expect(page.locator("text=Hands-off Draft")).toBeVisible();
      await expect(
        page.locator("text=AI generates your draft autonomously")
      ).toBeVisible();

      // Warning banner should be visible
      await expect(
        page.locator(
          "text=This draft is AI-generated and MUST be reviewed before submission"
        )
      ).toBeVisible();

      // Enter topic
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");

      // Click start
      await page.locator("text=Start Autonomous Draft").click();

      // Disclaimer modal should appear
      await expect(page.locator("text=AI-Generated Content")).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator("text=I understand and accept responsibility")
      ).toBeVisible();
    });

    test("acknowledging disclaimer starts the workflow", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-handsoff-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_handsoff",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        const requestBody = await route.request().postDataJSON();

        // Hands-off mode should complete directly
        if (requestBody.mode === "draft_handsoff") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "completed",
              completeDraft:
                "# Introduction\n\nComplete autonomous draft generated...",
            }),
          });
        }
      });

      await page.goto("/editor/test-handsoff-draft-id");

      // Enter topic and start
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Autonomous Draft").click();

      // Accept disclaimer
      await page
        .locator("text=I understand and accept responsibility")
        .click({ timeout: 5000 });

      // Should show processing state
      await expect(page.locator("text=Processing...")).toBeVisible({
        timeout: 5000,
      });
    });

    test("hands-off workflow completes without user approval steps", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-handsoff-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_handsoff",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        // Hands-off mode returns completed immediately (no suspension)
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "completed",
            completeDraft:
              "# Introduction\n\nAutonomous draft content here...\n\n# Methods\n\nStudy methodology...",
          }),
        });
      });

      await page.goto("/editor/test-handsoff-draft-id");

      // Start workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Autonomous Draft").click();

      // Accept disclaimer
      await page
        .locator("text=I understand and accept responsibility")
        .click({ timeout: 5000 });

      // Should NOT show approval steps (outline, papers, sections)
      // Should go directly to completion
      await expect(page.locator("text=Draft Complete")).toBeVisible({
        timeout: 15000,
      });

      // No approval buttons should have appeared
      await expect(page.locator("text=Approve Outline")).not.toBeVisible();
      await expect(page.locator("text=Approve Papers")).not.toBeVisible();
    });

    test("final draft gets inserted into editor for hands-off mode", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-handsoff-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_handsoff",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "completed",
            completeDraft:
              "# Introduction\n\nFinal hands-off draft inserted",
          }),
        });
      });

      await page.goto("/editor/test-handsoff-draft-id");

      // Complete workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Autonomous Draft").click();
      await page
        .locator("text=I understand and accept responsibility")
        .click({ timeout: 5000 });

      // Verify completion
      await expect(page.locator("text=Draft Complete")).toBeVisible({
        timeout: 15000,
      });
      await expect(
        page.locator(
          "text=Your draft has been inserted into the editor. Review and edit as needed."
        )
      ).toBeVisible();
    });
  });

  /* ── Mobile Viewport Tests ── */

  test.describe("Mobile Viewport", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test("draft mode panel opens as sheet on mobile", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.goto("/editor/test-draft-id");

      // Panel should not be visible initially on mobile
      await expect(page.locator("text=Guided Draft")).not.toBeVisible();

      // Click toggle to open sheet
      const toggleButton = page.locator('button[aria-label="Toggle AI panel"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await expect(page.locator("text=Guided Draft")).toBeVisible();
      }
    });

    test("start workflow button has minimum 44px touch target", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.goto("/editor/test-draft-id");

      // Open panel if on mobile
      const toggleButton = page.locator('button[aria-label="Toggle AI panel"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
      }

      // Fill topic to enable button
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");

      const startButton = page.locator("text=Start Guided Workflow");
      const box = await startButton.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });

    test("approval buttons have minimum 44px touch target on mobile", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [{ title: "Introduction", subsections: [] }],
              },
            },
          }),
        });
      });

      await page.goto("/editor/test-draft-id");

      // Open panel
      const toggleButton = page.locator('button[aria-label="Toggle AI panel"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
      }

      // Start workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();

      // Check approve button size
      const approveButton = page.locator("text=Approve Outline");
      await expect(approveButton).toBeVisible({ timeout: 10000 });

      const box = await approveButton.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(32); // Smaller buttons in panel
    });

    test("no horizontal scroll on mobile during workflow", async ({
      page,
    }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "suspended",
            suspendedStep: "generate-outline",
            suspendPayload: {
              outline: {
                sections: [
                  {
                    title: "Introduction with a very long title to test overflow",
                    subsections: [
                      "Background and context",
                      "Research objectives",
                    ],
                  },
                ],
              },
            },
          }),
        });
      });

      await page.goto("/editor/test-draft-id");

      // Open panel
      const toggleButton = page.locator('button[aria-label="Toggle AI panel"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
      }

      // Start workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();

      // Wait for outline to appear
      await expect(page.locator("text=Generated Outline:")).toBeVisible({
        timeout: 10000,
      });

      // Check for horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
    });
  });

  /* ── Error Handling ── */

  test.describe("Error States", () => {
    test("shows error message when workflow fails", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Failed to start workflow: AI service unavailable",
          }),
        });
      });

      await page.goto("/editor/test-draft-id");

      // Start workflow
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();

      // Error should be displayed
      await expect(
        page.locator("text=Failed to start workflow: AI service unavailable")
      ).toBeVisible({ timeout: 10000 });

      // Start Over button should be visible
      await expect(page.locator("text=Start Over")).toBeVisible();
    });

    test("can reset workflow after error", async ({ page }) => {
      await page.route("**/api/documents/get*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "test-draft-id",
            title: "Untitled Research Paper",
            mode: "draft_guided",
            content: {},
            wordCount: 0,
          }),
        });
      });

      await page.route("**/api/draft/start", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Test error",
          }),
        });
      });

      await page.goto("/editor/test-draft-id");

      // Trigger error
      await page.locator('input[placeholder*="Laparoscopic"]').fill("Test");
      await page.locator("text=Start Guided Workflow").click();
      await expect(page.locator("text=Test error")).toBeVisible({
        timeout: 10000,
      });

      // Click Start Over
      await page.locator("text=Start Over").click();

      // Error should be cleared
      await expect(page.locator("text=Test error")).not.toBeVisible();

      // Topic input should be visible again
      await expect(
        page.locator('input[placeholder*="Laparoscopic"]')
      ).toBeVisible();
    });
  });
});
