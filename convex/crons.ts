import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Reset all users' monthly usage counters on the 1st of each month at 00:00 UTC
crons.monthly(
  "reset monthly usage counters",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.users.resetAllUsageCounters
);

// Clean up expired workflow runs every hour at minute 0
crons.hourly(
  "clean expired workflow runs",
  { minuteUTC: 0 },
  internal.workflowRuns.cleanExpiredRuns
);

// Clean up expired search cache entries every hour at minute 30
crons.hourly(
  "clean expired search cache",
  { minuteUTC: 30 },
  internal.searchCache.cleanExpiredCache
);

export default crons;
