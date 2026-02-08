/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiDetectionChecks from "../aiDetectionChecks.js";
import type * as citations from "../citations.js";
import type * as collections from "../collections.js";
import type * as crons from "../crons.js";
import type * as deepResearchReports from "../deepResearchReports.js";
import type * as documents from "../documents.js";
import type * as files from "../files.js";
import type * as learnModeSessions from "../learnModeSessions.js";
import type * as lib_subscriptionLimits from "../lib/subscriptionLimits.js";
import type * as papers from "../papers.js";
import type * as plagiarismChecks from "../plagiarismChecks.js";
import type * as searchCache from "../searchCache.js";
import type * as sessionPresence from "../sessionPresence.js";
import type * as subscriptions from "../subscriptions.js";
import type * as usageTokens from "../usageTokens.js";
import type * as users from "../users.js";
import type * as workflowRuns from "../workflowRuns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiDetectionChecks: typeof aiDetectionChecks;
  citations: typeof citations;
  collections: typeof collections;
  crons: typeof crons;
  deepResearchReports: typeof deepResearchReports;
  documents: typeof documents;
  files: typeof files;
  learnModeSessions: typeof learnModeSessions;
  "lib/subscriptionLimits": typeof lib_subscriptionLimits;
  papers: typeof papers;
  plagiarismChecks: typeof plagiarismChecks;
  searchCache: typeof searchCache;
  sessionPresence: typeof sessionPresence;
  subscriptions: typeof subscriptions;
  usageTokens: typeof usageTokens;
  users: typeof users;
  workflowRuns: typeof workflowRuns;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
