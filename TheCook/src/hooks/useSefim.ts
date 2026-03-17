import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../auth/supabase";
import type { Recipe, RecipeStep, SefimQA } from "../types/recipe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SefimMessage {
  role: "user" | "assistant";
  text: string;
  isChip?: boolean; // true for pre-loaded Q&A responses
}

export interface SefimContext {
  recipeName: string;
  totalSteps: number;
  currentStepIndex: number;
  currentStepInstruction: string;
  currentStepWhy: string;
  currentStepCommonMistake: string;
  currentStepRecovery: string;
  userSkillLevel: string;
  ingredientSwaps: Record<string, string>;
  servingMultiplier: number;
  checkpoint: string | null;
  warning: string | null;
}

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Assembles minimal context for the AI call from recipe, step, and user state.
 */
export function buildSefimContext(
  recipe: Recipe,
  stepIndex: number,
  skillLevel: string,
  swaps: Record<string, string>,
  currentServings: number
): SefimContext {
  const step = recipe.steps[stepIndex];
  return {
    recipeName: recipe.title,
    totalSteps: recipe.steps.length,
    currentStepIndex: stepIndex,
    currentStepInstruction: step.instruction,
    currentStepWhy: step.why,
    currentStepCommonMistake: step.commonMistake,
    currentStepRecovery: step.recovery,
    userSkillLevel: skillLevel,
    ingredientSwaps: swaps,
    servingMultiplier: currentServings / recipe.servings,
    checkpoint: step.checkpoint,
    warning: step.warning,
  };
}

/**
 * Returns linger threshold in milliseconds.
 * Timed steps: 1.5x the timer duration.
 * Untimed steps: 120 seconds default.
 */
export function getLingerThreshold(step: RecipeStep): number {
  return step.timerSeconds ? step.timerSeconds * 1.5 * 1000 : 120_000;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSefim(
  recipe: Recipe,
  currentStepIndex: number,
  skillLevel: string,
  swaps: Record<string, string>,
  currentServings: number
) {
  const [messages, setMessages] = useState<SefimMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lingerActive, setLingerActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Linger detection
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Reset on step change
    setLingerActive(false);

    const step = recipe.steps[currentStepIndex];
    if (!step) return;

    const threshold = getLingerThreshold(step);
    timerRef.current = setTimeout(() => {
      setLingerActive(true);
    }, threshold);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentStepIndex, recipe.steps]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const clearMessages = useCallback(() => setMessages([]), []);

  /**
   * Handle pre-loaded chip tap — adds question + answer instantly, no network.
   */
  const handleChipTap = useCallback((qa: SefimQA) => {
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, text: qa.question, isChip: true },
      { role: "assistant" as const, text: qa.answer, isChip: true },
    ]);
  }, []);

  /**
   * Handle open-ended question — calls Supabase Edge Function.
   */
  const handleOpenQuestion = useCallback(
    async (text: string) => {
      setMessages((prev) => [
        ...prev,
        { role: "user" as const, text },
      ]);
      setIsLoading(true);

      try {
        const context = buildSefimContext(
          recipe,
          currentStepIndex,
          skillLevel,
          swaps,
          currentServings
        );

        const { data, error } = await supabase.functions.invoke("sefim-ask", {
          body: { question: text, context },
        });

        if (error || !data?.answer) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant" as const, text: "Baglanti sorunu, tekrar dene" },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant" as const, text: data.answer },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant" as const, text: "Baglanti sorunu, tekrar dene" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [recipe, currentStepIndex, skillLevel, swaps, currentServings]
  );

  return {
    messages,
    isLoading,
    lingerActive,
    isOpen,
    open,
    close,
    clearMessages,
    handleChipTap,
    handleOpenQuestion,
  };
}
