/**
 * In-memory cache for active Mastra workflow run objects.
 * Mastra run objects cannot be serialized — they must stay in-memory for resume().
 * Convex stores the authoritative workflow state; this cache holds the runtime references.
 * If the container restarts, the cache is lost and the user must restart the workflow.
 */

const WORKFLOW_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedRun {
  run: unknown;
  createdAt: number;
}

const runCache = new Map<string, CachedRun>();

export function cacheRun(documentId: string, run: unknown): void {
  runCache.set(documentId, { run, createdAt: Date.now() });
}

export function getCachedRun(documentId: string): unknown | null {
  const entry = runCache.get(documentId);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > WORKFLOW_TTL_MS) {
    runCache.delete(documentId);
    return null;
  }
  return entry.run;
}

export function removeCachedRun(documentId: string): void {
  runCache.delete(documentId);
}
