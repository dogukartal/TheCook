import { StepSchema } from "../../types/recipe";
import type { SefimQA } from "../../types/recipe";

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
// Hook behavior test stubs (filled in Task 2)
// ---------------------------------------------------------------------------

describe("useSefim hook", () => {
  test.todo("handleChipTap adds user message + assistant message to messages array (no network call)");
  test.todo("handleOpenQuestion calls supabase.functions.invoke with correct body");
  test.todo("buildSefimContext produces correct SefimContext object");
  test.todo("getLingerThreshold returns 1.5x timerSeconds for timed steps");
  test.todo("getLingerThreshold returns 120s for untimed steps");
  test.todo("linger detection sets lingerActive=true after threshold");
  test.todo("linger resets to false on step index change");
});
