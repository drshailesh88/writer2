import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { mastra } from "@/lib/mastra";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length < 5) {
      return NextResponse.json(
        { error: "Topic must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Authenticate
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    convex.setAuth(token);

    // Create report in Convex (also checks subscription limits)
    let reportId: string;
    try {
      reportId = await convex.mutation(api.deepResearchReports.create, {
        topic: topic.trim(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create report";
      if (message.includes("limit") || message.includes("not available")) {
        return NextResponse.json(
          { error: message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Fire workflow asynchronously — don't await
    runWorkflowAsync(reportId, topic.trim(), token);

    return NextResponse.json({ reportId });
  } catch (error) {
    console.error("Deep research start error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start research",
      },
      { status: 500 }
    );
  }
}

async function runWorkflowAsync(
  reportId: string,
  topic: string,
  token: string
) {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  client.setAuth(token);

  try {
    // Mark as in progress
    await client.mutation(api.deepResearchReports.updateResult, {
      reportId: reportId as never,
      status: "in_progress",
    });

    // Run the workflow
    const workflow = mastra.getWorkflow("deepResearchWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({ inputData: { topic } });

    if (result.status === "success") {
      await client.mutation(api.deepResearchReports.updateResult, {
        reportId: reportId as never,
        report: result.result?.report ?? "Report generation completed but no content was produced.",
        citedPapers: result.result?.citedPapers ?? [],
        status: "completed",
      });
    } else {
      await client.mutation(api.deepResearchReports.updateResult, {
        reportId: reportId as never,
        status: "failed",
      });
    }
  } catch (error) {
    console.error("Deep research workflow error:", error);
    try {
      await client.mutation(api.deepResearchReports.updateResult, {
        reportId: reportId as never,
        status: "failed",
      });
    } catch {
      // Best effort — report already exists
    }
  }
}
