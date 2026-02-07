/* eslint-disable */
/**
 * Generated server types. Run `npx convex dev` to regenerate.
 */

import type { GenericMutationCtx, GenericQueryCtx, DataModelFromSchemaDefinition } from "convex/server";
import type schema from "../schema.js";

type DataModel = DataModelFromSchemaDefinition<typeof schema>;
type MutationCtx = GenericMutationCtx<DataModel>;
type QueryCtx = GenericQueryCtx<DataModel>;

export declare const mutation: import("convex/server").MutationBuilder<DataModel, "public">;
export declare const query: import("convex/server").QueryBuilder<DataModel, "public">;
export declare const internalMutation: import("convex/server").MutationBuilder<DataModel, "internal">;
export declare const internalQuery: import("convex/server").QueryBuilder<DataModel, "internal">;
