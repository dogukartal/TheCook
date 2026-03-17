import { StepSchema } from "../../types/recipe";
import type { SefimQA, RecipeStep } from "../../types/recipe";
import { buildSefimContext, getLingerThreshold } from "../useSefim";
import type { SefimContext } from "../useSefim";
import { renderHook, act } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Mock supabase before importing useSefim hook
// ---------------------------------------------------------------------------

const mockInvoke = jest.fn();
jest.mock("../../auth/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// Must import useSefim AFTER mock setup
const { useSefim } = require("../useSefim");

// ---------------------------------------------------------------------------
// Schema tests — sefimQA field on StepSchema
// ---------------------------------------------------------------------------

const baseStep = {
  title: "Soganlari kavurun",
  instruction: "Zeytinyagini tavada kizdirin.",
  why: "Soganlarin karamelize olmasi tatlilik katar.",
  looksLikeWhenDone: "Soganlar seffaf ve hafif altin rengi.",
  commonMistake: "Soganlari cok yuksek ateste yakmak.",
  recovery: "Ocagi kisin ve yarim cay bardagi su ekleyin.",
  stepImage: null,
  timerSeconds: null,
};

describe("StepSchema — sefimQA field", () => {
  it("parses step with sefimQA array of {question, answer} objects", () => {
    const qa: SefimQA[] = [
      { question: "Neden zeytinyagi?", answer: "Zeytinyagi daha saglikli." },
      { question: "Kac dakika kavurmali?", answer: "3-4 dakika yeterli." },
    ];
    const result = StepSchema.safeParse({ ...baseStep, sefimQA: qa });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sefimQA).toHaveLength(2);
      expect(result.data.sefimQA[0].question).toBe("Neden zeytinyagi?");
      expect(result.data.sefimQA[0].answer).toBe("Zeytinyagi daha saglikli.");
    }
  });

  it("parses step without sefimQA field — defaults to []", () => {
    const result = StepSchema.safeParse(baseStep);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sefimQA).toEqual([]);
    }
  });

  it("rejects sefimQA with empty question", () => {
    const result = StepSchema.safeParse({
      ...baseStep,
      sefimQA: [{ question: "", answer: "Some answer" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects sefimQA with empty answer", () => {
    const result = StepSchema.safeParse({
      ...baseStep,
      sefimQA: [{ question: "Some question", answer: "" }],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleStep: RecipeStep = StepSchema.parse({
  ...baseStep,
  timerSeconds: 300,
  checkpoint: "Kopurmeli",
  warning: "Dikkat et!",
  sefimQA: [
    { question: "Neden zeytinyagi?", answer: "Zeytinyagi daha saglikli." },
  ],
});

const untimedStep: RecipeStep = StepSchema.parse(baseStep);

const sampleRecipe = {
  id: "menemen-001",
  title: "Menemen",
  cuisine: "Turk",
  category: "kahvalti" as const,
  mealType: "breakfast" as const,
  skillLevel: "beginner" as const,
  prepTime: 5,
  cookTime: 10,
  servings: 2,
  coverImage: null,
  allergens: [],
  equipment: ["tava"],
  ingredientGroups: [
    {
      label: null,
      items: [
        { name: "Yumurta", amount: 3, unit: "adet" as const, optional: false, alternatives: [], scalable: true },
      ],
    },
  ],
  steps: [sampleStep, untimedStep],
};

// ---------------------------------------------------------------------------
// Pure function tests
// ---------------------------------------------------------------------------

describe("buildSefimContext", () => {
  it("produces correct SefimContext object", () => {
    const swaps = { Yumurta: "Tofu" };
    const ctx: SefimContext = buildSefimContext(
      sampleRecipe,
      0,
      "beginner",
      swaps,
      4
    );
    expect(ctx.recipeName).toBe("Menemen");
    expect(ctx.totalSteps).toBe(2);
    expect(ctx.currentStepIndex).toBe(0);
    expect(ctx.currentStepInstruction).toBe("Zeytinyagini tavada kizdirin.");
    expect(ctx.currentStepWhy).toBe("Soganlarin karamelize olmasi tatlilik katar.");
    expect(ctx.currentStepCommonMistake).toBe("Soganlari cok yuksek ateste yakmak.");
    expect(ctx.currentStepRecovery).toBe("Ocagi kisin ve yarim cay bardagi su ekleyin.");
    expect(ctx.userSkillLevel).toBe("beginner");
    expect(ctx.ingredientSwaps).toEqual({ Yumurta: "Tofu" });
    expect(ctx.servingMultiplier).toBe(2); // 4 / 2 original servings
    expect(ctx.checkpoint).toBe("Kopurmeli");
    expect(ctx.warning).toBe("Dikkat et!");
  });
});

describe("getLingerThreshold", () => {
  it("returns 1.5x timerSeconds in ms for timed steps", () => {
    expect(getLingerThreshold(sampleStep)).toBe(300 * 1.5 * 1000);
  });

  it("returns 120000ms for untimed steps", () => {
    expect(getLingerThreshold(untimedStep)).toBe(120_000);
  });
});

// ---------------------------------------------------------------------------
// Hook tests
// ---------------------------------------------------------------------------

describe("useSefim hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("handleChipTap adds user message + assistant message (no network call)", () => {
    const { result } = renderHook(() =>
      useSefim(sampleRecipe, 0, "beginner", {}, 2)
    );

    act(() => {
      result.current.handleChipTap({
        question: "Neden zeytinyagi?",
        answer: "Zeytinyagi daha saglikli.",
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({
      role: "user",
      text: "Neden zeytinyagi?",
      isChip: true,
    });
    expect(result.current.messages[1]).toEqual({
      role: "assistant",
      text: "Zeytinyagi daha saglikli.",
      isChip: true,
    });
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("handleOpenQuestion calls supabase.functions.invoke with correct body", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { answer: "Orta ateste pisirin." },
      error: null,
    });

    const { result } = renderHook(() =>
      useSefim(sampleRecipe, 0, "beginner", {}, 2)
    );

    await act(async () => {
      await result.current.handleOpenQuestion("Ne sicaklikta pisirmeli?");
    });

    expect(mockInvoke).toHaveBeenCalledWith("sefim-ask", {
      body: {
        question: "Ne sicaklikta pisirmeli?",
        context: expect.objectContaining({
          recipeName: "Menemen",
          currentStepIndex: 0,
        }),
      },
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].text).toBe("Orta ateste pisirin.");
    expect(result.current.isLoading).toBe(false);
  });

  it("handleOpenQuestion shows fallback on error", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error("Network error"),
    });

    const { result } = renderHook(() =>
      useSefim(sampleRecipe, 0, "beginner", {}, 2)
    );

    await act(async () => {
      await result.current.handleOpenQuestion("Test?");
    });

    expect(result.current.messages[1].text).toBe(
      "Baglanti sorunu, tekrar dene"
    );
  });

  it("linger detection sets lingerActive=true after threshold", () => {
    const { result } = renderHook(() =>
      useSefim(sampleRecipe, 0, "beginner", {}, 2)
    );

    expect(result.current.lingerActive).toBe(false);

    act(() => {
      jest.advanceTimersByTime(300 * 1.5 * 1000);
    });

    expect(result.current.lingerActive).toBe(true);
  });

  it("linger resets to false on step index change", () => {
    const { result, rerender } = renderHook(
      ({ stepIndex }) => useSefim(sampleRecipe, stepIndex, "beginner", {}, 2),
      { initialProps: { stepIndex: 0 } }
    );

    // Trigger linger
    act(() => {
      jest.advanceTimersByTime(300 * 1.5 * 1000);
    });
    expect(result.current.lingerActive).toBe(true);

    // Change step
    rerender({ stepIndex: 1 });
    expect(result.current.lingerActive).toBe(false);
  });
});
