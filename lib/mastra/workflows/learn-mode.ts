import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { socraticCoachAgent } from "../agents";

// ─── Step 1: Understand Topic ───
// Coach asks clarifying questions about research topic/question
const understandStep = createStep({
  id: "understand",
  inputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  resumeSchema: z.object({
    stageComplete: z.boolean(),
    summary: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData?.stageComplete) {
      return {
        topic: inputData.topic,
        documentId: inputData.documentId,
      };
    }

    const { topic } = inputData;

    const result = await socraticCoachAgent.generate(
      `A student wants to write a research paper on: "${topic}". This is stage 1 (Understand Topic). Ask 2-3 clarifying questions to help them refine their research question. Focus on: What specific aspect? What is the hypothesis? Who is the target audience?`
    );

    await suspend({
      stage: "understand",
      coachMessage: result.text,
    });

    return {
      topic,
      documentId: inputData.documentId,
    };
  },
});

// ─── Step 2: Literature Review ───
// Coach guides on search keywords and paper relevance
const literatureStep = createStep({
  id: "literature",
  inputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  resumeSchema: z.object({
    stageComplete: z.boolean(),
    summary: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData?.stageComplete) {
      return {
        topic: inputData.topic,
        documentId: inputData.documentId,
      };
    }

    const { topic } = inputData;

    const result = await socraticCoachAgent.generate(
      `The student is now in stage 2 (Literature Review) for their paper on: "${topic}". Guide them on finding relevant literature. Suggest 2-3 search keyword strategies and ask them to use the paper search tool. Ask: "What databases have you searched? What keywords are you using? Have you found any landmark studies in this area?"`
    );

    await suspend({
      stage: "literature",
      coachMessage: result.text,
    });

    return {
      topic,
      documentId: inputData.documentId,
    };
  },
});

// ─── Step 3: Create Outline ───
// Coach suggests IMRAD structure and asks about each section
const outlineStep = createStep({
  id: "outline",
  inputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  resumeSchema: z.object({
    stageComplete: z.boolean(),
    summary: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData?.stageComplete) {
      return {
        topic: inputData.topic,
        documentId: inputData.documentId,
      };
    }

    const { topic } = inputData;

    const result = await socraticCoachAgent.generate(
      `The student is now in stage 3 (Create Outline) for their paper on: "${topic}". Suggest they use the IMRAD format (Introduction, Methods, Results, Discussion). Ask guiding questions: "What is the main finding you want to highlight in your Introduction? What methodology did you use? What are your key results?" Help them think through each section without writing it for them.`
    );

    await suspend({
      stage: "outline",
      coachMessage: result.text,
    });

    return {
      topic,
      documentId: inputData.documentId,
    };
  },
});

// ─── Step 4: Write Draft ───
// Coach provides sentence starters and guiding questions
const draftingStep = createStep({
  id: "drafting",
  inputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  resumeSchema: z.object({
    stageComplete: z.boolean(),
    summary: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData?.stageComplete) {
      return {
        topic: inputData.topic,
        documentId: inputData.documentId,
      };
    }

    const { topic } = inputData;

    const result = await socraticCoachAgent.generate(
      `The student is now in stage 4 (Write Draft) for their paper on: "${topic}". Encourage them to start writing in the editor. Remind them they can click "Ask for Help" to get sentence starters or examples from published papers. Ask: "Which section would you like to start with? The Introduction or Methods section is often a good starting point. What is the first point you want to make?"`
    );

    await suspend({
      stage: "drafting",
      coachMessage: result.text,
    });

    return {
      topic,
      documentId: inputData.documentId,
    };
  },
});

// ─── Step 5: Get Feedback ───
// FeedbackAgent analyzes draft one category at a time
const feedbackStep = createStep({
  id: "feedback",
  inputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  outputSchema: z.object({
    complete: z.boolean(),
  }),
  resumeSchema: z.object({
    stageComplete: z.boolean(),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData?.stageComplete) {
      return { complete: true };
    }

    await suspend({
      stage: "feedback",
      coachMessage:
        "Great work reaching the feedback stage! I'll now review your draft one category at a time. We'll go through: Thesis & Focus, Evidence & Reasoning, Methodology Rigor, Structure & Organization, and Language & Tone. Click 'Get Feedback' to start with the first category.",
    });

    return { complete: true };
  },
});

// ─── Learn Mode Workflow ───
export const learnModeWorkflow = createWorkflow({
  id: "learn-mode-workflow",
  inputSchema: z.object({
    topic: z.string(),
    documentId: z.string(),
  }),
  outputSchema: z.object({
    complete: z.boolean(),
  }),
})
  .then(understandStep)
  .then(literatureStep)
  .then(outlineStep)
  .then(draftingStep)
  .then(feedbackStep)
  .commit();
