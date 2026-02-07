/* eslint-disable */
/**
 * Generated API stub for type checking.
 * Run `npx convex dev` to generate the real API types from your schema.
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  users: typeof users;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
