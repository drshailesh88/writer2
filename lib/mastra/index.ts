import { Mastra } from "@mastra/core";
import { outlineAgent, paperFinderAgent, writerAgent } from "./agents";
import { draftGuidedWorkflow } from "./workflows/draft-guided";
import { draftHandsOffWorkflow } from "./workflows/draft-handsoff";

export const mastra = new Mastra({
  agents: {
    outlineAgent,
    paperFinderAgent,
    writerAgent,
  },
  workflows: {
    draftGuidedWorkflow,
    draftHandsOffWorkflow,
  },
});
