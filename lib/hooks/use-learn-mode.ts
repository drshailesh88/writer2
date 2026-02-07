"use client";

import { useState, useCallback } from "react";
import type {
  LearnModeStage,
  ConversationMessage,
  FeedbackItem,
  FeedbackCategory,
} from "../mastra/types";
import { FEEDBACK_CATEGORIES } from "../mastra/types";

export type LearnModeStatus =
  | "idle"
  | "starting"
  | "active"
  | "sending"
  | "advancing"
  | "loading-feedback"
  | "completed"
  | "error";

interface LearnModeState {
  status: LearnModeStatus;
  currentStage: LearnModeStage;
  conversationHistory: ConversationMessage[];
  feedbackItems: FeedbackItem[];
  currentFeedbackIndex: number;
  error: string | null;
}

export function useLearnMode(documentId: string, topic: string) {
  const [state, setState] = useState<LearnModeState>({
    status: "idle",
    currentStage: "understand",
    conversationHistory: [],
    feedbackItems: [],
    currentFeedbackIndex: 0,
    error: null,
  });

  // Start a new learn mode session
  const startSession = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "starting", error: null }));

    try {
      const res = await fetch("/api/learn/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, documentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start session");
      }

      const data = await res.json();

      if (data.status === "suspended" && data.coachMessage) {
        const coachMsg: ConversationMessage = {
          role: "coach",
          content: data.coachMessage,
          stage: data.stage || "understand",
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          status: "active",
          currentStage: data.stage || "understand",
          conversationHistory: [coachMsg],
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to start session",
      }));
    }
  }, [documentId, topic]);

  // Send a message to the coach within the current stage
  const sendMessage = useCallback(
    async (message: string) => {
      const studentMsg: ConversationMessage = {
        role: "student",
        content: message,
        stage: state.currentStage,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        status: "sending",
        conversationHistory: [...prev.conversationHistory, studentMsg],
        error: null,
      }));

      try {
        const res = await fetch("/api/learn/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            stage: state.currentStage,
            conversationHistory: [...state.conversationHistory, studentMsg],
            topic,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to send message");
        }

        const data = await res.json();

        const coachMsg: ConversationMessage = {
          role: "coach",
          content: data.coachMessage,
          stage: state.currentStage,
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          status: "active",
          conversationHistory: [...prev.conversationHistory, coachMsg],
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "active",
          error:
            err instanceof Error ? err.message : "Failed to send message",
        }));
      }
    },
    [state.currentStage, state.conversationHistory, topic]
  );

  // Advance to the next stage
  const advanceStage = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "advancing", error: null }));

    try {
      const res = await fetch("/api/learn/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          currentStage: state.currentStage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to advance stage");
      }

      const data = await res.json();

      if (data.status === "suspended" && data.coachMessage) {
        const coachMsg: ConversationMessage = {
          role: "coach",
          content: data.coachMessage,
          stage: data.stage,
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          status: "active",
          currentStage: data.stage,
          conversationHistory: [...prev.conversationHistory, coachMsg],
        }));
      } else if (data.status === "completed") {
        setState((prev) => ({
          ...prev,
          status: "completed",
          currentStage: "feedback",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "active",
        error:
          err instanceof Error ? err.message : "Failed to advance stage",
      }));
    }
  }, [documentId, state.currentStage]);

  // Request feedback for a specific category
  const requestFeedback = useCallback(
    async (draftText: string) => {
      const categoryIndex = state.currentFeedbackIndex;
      if (categoryIndex >= FEEDBACK_CATEGORIES.length) {
        setState((prev) => ({ ...prev, status: "completed" }));
        return;
      }

      const categoryObj = FEEDBACK_CATEGORIES[categoryIndex];
      if (!categoryObj) return;
      const category = categoryObj.id;
      setState((prev) => ({
        ...prev,
        status: "loading-feedback",
        error: null,
      }));

      try {
        const res = await fetch("/api/learn/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            draftText,
            topic,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get feedback");
        }

        const data = await res.json();

        setState((prev) => ({
          ...prev,
          status: "active",
          feedbackItems: [...prev.feedbackItems, data.feedback],
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "active",
          error:
            err instanceof Error ? err.message : "Failed to get feedback",
        }));
      }
    },
    [state.currentFeedbackIndex, topic]
  );

  // Mark current feedback as addressed and move to next
  const addressFeedback = useCallback(() => {
    setState((prev) => {
      if (prev.currentFeedbackIndex >= prev.feedbackItems.length) {
        return prev; // No feedback to address at this index
      }

      const updated = [...prev.feedbackItems];
      updated[prev.currentFeedbackIndex] = {
        ...updated[prev.currentFeedbackIndex],
        addressed: true,
      };

      const nextIndex = prev.currentFeedbackIndex + 1;
      const isComplete = nextIndex >= FEEDBACK_CATEGORIES.length;

      return {
        ...prev,
        feedbackItems: updated,
        currentFeedbackIndex: nextIndex,
        status: isComplete ? "completed" : "active",
      };
    });
  }, []);

  // Restore session from Convex data
  const restoreSession = useCallback(
    (sessionData: {
      currentStage: LearnModeStage;
      conversationHistory?: ConversationMessage[];
      feedbackGiven?: FeedbackItem[];
    }) => {
      setState({
        status: "active",
        currentStage: sessionData.currentStage,
        conversationHistory: sessionData.conversationHistory || [],
        feedbackItems: sessionData.feedbackGiven || [],
        currentFeedbackIndex: sessionData.feedbackGiven?.length || 0,
        error: null,
      });
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      currentStage: "understand",
      conversationHistory: [],
      feedbackItems: [],
      currentFeedbackIndex: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    startSession,
    sendMessage,
    advanceStage,
    requestFeedback,
    addressFeedback,
    restoreSession,
    reset,
    isLoading:
      state.status === "starting" ||
      state.status === "sending" ||
      state.status === "advancing" ||
      state.status === "loading-feedback",
    canAdvance:
      state.status === "active" && state.currentStage !== "feedback",
    isFeedbackStage: state.currentStage === "feedback",
    feedbackProgress: {
      current: state.currentFeedbackIndex,
      total: FEEDBACK_CATEGORIES.length,
      currentCategory:
        FEEDBACK_CATEGORIES[state.currentFeedbackIndex] ?? null,
    },
  };
}
