import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildDocxBuffer } from "@/lib/export/docx-server";
import { tiptapToBlocks } from "@/lib/export/tiptap-to-blocks";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { TOKEN_COSTS } from "@/convex/usageTokens";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function sanitizeFileName(name: string, ext: string): string {
  const cleaned = name.replace(/[^a-z0-9 _-]+/gi, "").trim().replace(/\s+/g, " ");
  const base = cleaned.length > 0 ? cleaned : "document";
  return `${base}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!userId || !token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rateLimitResponse = await enforceRateLimit(req, "export", userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const {
      documentId,
      content,
      bibliography = [],
      citationStyle,
      title,
    } = body as {
      documentId?: string;
      content?: Record<string, unknown>;
      bibliography?: string[];
      citationStyle?: "vancouver" | "apa" | "ama" | "chicago";
      title?: string;
    };

    if (!documentId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, content" },
        { status: 400 }
      );
    }

    if (!Array.isArray(bibliography)) {
      return NextResponse.json(
        { error: "bibliography must be an array" },
        { status: 400 }
      );
    }

    convex.setAuth(token);

    const user = await convex.query(api.users.getCurrent, {});
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.subscriptionTier === "free" || user.subscriptionTier === "none") {
      return NextResponse.json(
        { error: "Export requires a Basic or Pro subscription.", upgradeRequired: true },
        { status: 403 }
      );
    }

    const doc = await convex.query(api.documents.get, {
      documentId: documentId as Id<"documents">,
    });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    try {
      await convex.mutation(api.usageTokens.deductTokens, {
        cost: TOKEN_COSTS.EXPORT,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Insufficient tokens";
      return NextResponse.json(
        { error: message, upgradeRequired: true },
        { status: 402 }
      );
    }

    const exportTitle =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : doc.title || "Untitled";
    const allowedStyles = new Set(["vancouver", "apa", "ama", "chicago"]);
    const exportStyle = allowedStyles.has(citationStyle ?? "")
      ? (citationStyle as "vancouver" | "apa" | "ama" | "chicago")
      : (doc.citationStyle as "vancouver" | "apa" | "ama" | "chicago") || "vancouver";

    const blocks = tiptapToBlocks(content);
    const buffer = await buildDocxBuffer({
      title: exportTitle,
      blocks,
      bibliography,
      citationStyle: exportStyle,
    });

    const filename = sanitizeFileName(exportTitle, "docx");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("DOCX export API error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
