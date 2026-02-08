import { Copyleaks } from "plagiarism-checker";

// Auth token cache — Copyleaks tokens are valid for 48 hours
let cachedToken: { token: string; expiresAt: number } | null = null;

const copyleaks = new Copyleaks();

export async function getAuthToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5-minute buffer)
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const email = process.env.COPYLEAKS_EMAIL;
  const apiKey = process.env.COPYLEAKS_API_KEY;

  if (!email || !apiKey) {
    throw new Error("COPYLEAKS_EMAIL and COPYLEAKS_API_KEY must be set");
  }

  const authResult = await copyleaks.loginAsync(email, apiKey);

  // Cache token for 47 hours (1 hour buffer before 48h expiry)
  cachedToken = {
    token: authResult.access_token,
    expiresAt: now + 47 * 60 * 60 * 1000,
  };

  return cachedToken.token;
}

export async function submitPlagiarismScan(
  text: string,
  scanId: string,
  webhookUrl: string
): Promise<void> {
  const token = await getAuthToken();
  const base64Text = Buffer.from(text).toString("base64");

  const submission = {
    base64: base64Text,
    filename: `scan-${scanId}.txt`,
    properties: {
      webhooks: {
        status: `${webhookUrl}/{STATUS}`,
      },
      sandbox: process.env.NODE_ENV !== "production",
    },
  };

  await copyleaks.submitFileAsync(
    { access_token: token } as never,
    scanId,
    submission as never
  );
}

export async function submitAiDetection(
  text: string,
  scanId: string
): Promise<{ summary: AiDetectionSummary; sections: AiDetectionSection[] }> {
  const token = await getAuthToken();

  const submission = {
    text,
    sandbox: process.env.NODE_ENV !== "production",
  };

  const result = await copyleaks.aiDetectionClient.submitNaturalTextAsync(
    { access_token: token } as never,
    scanId,
    submission as never
  );

  return parseAiDetectionResult(result);
}

// ─── Result Parsers ───

export interface PlagiarismSource {
  id: string;
  title: string;
  url: string;
  matchedWords: number;
  totalWords: number;
  similarity: number;
  matchedText: string;
}

export interface PlagiarismResult {
  overallSimilarity: number;
  sources: PlagiarismSource[];
}

export interface AiDetectionSummary {
  humanContent: number;
  aiContent: number;
}

export interface AiDetectionSection {
  text: string;
  startPosition: number;
  endPosition: number;
  classification: "human" | "ai";
  probability: number;
}

export interface AiDetectionResult {
  summary: AiDetectionSummary;
  sections: AiDetectionSection[];
}

export function parsePlagiarismResult(payload: Record<string, unknown>): PlagiarismResult {
  const results = payload.results as Record<string, unknown[]> | undefined;
  const scannedDoc = payload.scannedDocument as Record<string, unknown> | undefined;
  const totalWords = (scannedDoc?.totalWords as number) || 1;

  const internetResults = (results?.internet || []) as Record<string, unknown>[];
  const databaseResults = (results?.database || []) as Record<string, unknown>[];
  const allSources = [...internetResults, ...databaseResults];

  let totalMatchedWords = 0;
  const sources: PlagiarismSource[] = allSources.map((source) => {
    const matchedWords = (source.matchedWords as number) || 0;
    totalMatchedWords += matchedWords;
    return {
      id: (source.id as string) || "",
      title: (source.title as string) || "Unknown Source",
      url: (source.url as string) || "",
      matchedWords,
      totalWords,
      similarity: Math.round((matchedWords / totalWords) * 100 * 10) / 10,
      matchedText: (source.introduction as string) || "",
    };
  });

  const overallSimilarity =
    Math.round((totalMatchedWords / totalWords) * 100 * 10) / 10;

  return { overallSimilarity, sources };
}

export function parseAiDetectionResult(
  payload: Record<string, unknown>
): AiDetectionResult {
  const summary = payload.summary as Record<string, number> | undefined;
  const sections = (payload.sections || payload.results || []) as Record<string, unknown>[];

  return {
    summary: {
      humanContent: summary?.humanContent ?? summary?.human ?? 50,
      aiContent: summary?.aiContent ?? summary?.ai ?? 50,
    },
    sections: sections.map((section) => {
      const position = section.position as Record<string, number> | undefined;
      return {
        text: (section.text as string) || "",
        startPosition: position?.start ?? (section.startPosition as number) ?? 0,
        endPosition: position?.end ?? (section.endPosition as number) ?? 0,
        classification:
          (section.classification as "human" | "ai") ||
          ((section.probability as number) > 0.5 ? "ai" : "human"),
        probability: (section.probability as number) ?? 0,
      };
    }),
  };
}

export function getSimilarityColor(similarity: number): "green" | "yellow" | "red" {
  if (similarity < 10) return "green";
  if (similarity <= 25) return "yellow";
  return "red";
}

export function getAiScoreColor(score: number): "green" | "yellow" | "red" {
  if (score < 30) return "green";
  if (score <= 70) return "yellow";
  return "red";
}
