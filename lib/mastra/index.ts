import { Mastra } from "@mastra/core";
import {
  outlineAgent,
  paperFinderAgent,
  writerAgent,
  socraticCoachAgent,
  feedbackAgent,
  deepResearchAgent,
} from "./agents";
import { draftGuidedWorkflow } from "./workflows/draft-guided";
import { draftHandsOffWorkflow } from "./workflows/draft-handsoff";
import { learnModeWorkflow } from "./workflows/learn-mode";
import { deepResearchWorkflow } from "./workflows/deep-research";

export const mastra: Mastra = new Mastra({
  agents: {
    outlineAgent,
    paperFinderAgent,
    writerAgent,
    socraticCoachAgent,
    feedbackAgent,
    deepResearchAgent,
  },
  workflows: {
    draftGuidedWorkflow,
    draftHandsOffWorkflow,
    learnModeWorkflow,
    deepResearchWorkflow,
  },
});
