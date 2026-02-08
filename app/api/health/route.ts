import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    // Lightweight Convex connectivity check — action wrapper, returns null for unknown IDs
    await convex.action(api.users.getByClerkId, { clerkId: "__health_check__" });

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      convex: "connected",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 503 }
    );
  }
}
