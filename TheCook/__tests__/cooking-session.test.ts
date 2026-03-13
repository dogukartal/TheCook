import { saveSession, getActiveSession, clearSession, CookingSession } from "../src/db/cooking-session";

// Mock db that tracks runAsync/getFirstAsync calls with in-memory state
function createMockDb() {
  let storedRow: Record<string, unknown> | null = null;

  const db = {
    runAsync: jest.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql.includes("INSERT OR REPLACE")) {
        storedRow = {
          id: 1,
          recipe_id: params![0],
          current_step: params![1],
          timer_remaining: params![2],
          timer_start_timestamp: params![3],
          ingredient_checks: params![4],
          session_started_at: params![5],
        };
      }
      if (sql.includes("DELETE FROM cooking_sessions")) {
        storedRow = null;
      }
    }),
    getFirstAsync: jest.fn().mockImplementation(async () => {
      return storedRow;
    }),
    _getStoredRow: () => storedRow,
    _setStoredRow: (row: Record<string, unknown> | null) => { storedRow = row; },
  };

  return db;
}

describe("cooking-session CRUD", () => {
  const sampleSession: CookingSession = {
    recipeId: "menemen-01",
    currentStep: 2,
    timerRemaining: 120,
    timerStartTimestamp: 1700000000000,
    ingredientChecks: [0, 2, 4],
    sessionStartedAt: "2026-03-13T10:00:00Z",
  };

  it("saveSession writes a row, getActiveSession reads it back with matching fields", async () => {
    const db = createMockDb();
    await saveSession(db as any, sampleSession);
    const result = await getActiveSession(db as any);

    expect(result).not.toBeNull();
    expect(result!.recipeId).toBe("menemen-01");
    expect(result!.currentStep).toBe(2);
    expect(result!.timerRemaining).toBe(120);
    expect(result!.timerStartTimestamp).toBe(1700000000000);
    expect(result!.sessionStartedAt).toBe("2026-03-13T10:00:00Z");
  });

  it("clearSession removes the row, getActiveSession returns null", async () => {
    const db = createMockDb();
    await saveSession(db as any, sampleSession);
    await clearSession(db as any);
    const result = await getActiveSession(db as any);

    expect(result).toBeNull();
  });

  it("saveSession with existing session overwrites (INSERT OR REPLACE on id=1)", async () => {
    const db = createMockDb();
    await saveSession(db as any, sampleSession);

    const updatedSession: CookingSession = {
      ...sampleSession,
      currentStep: 5,
      recipeId: "borek-02",
    };
    await saveSession(db as any, updatedSession);
    const result = await getActiveSession(db as any);

    expect(result).not.toBeNull();
    expect(result!.recipeId).toBe("borek-02");
    expect(result!.currentStep).toBe(5);
  });

  it("ingredientChecks round-trips as JSON array", async () => {
    const db = createMockDb();
    await saveSession(db as any, sampleSession);

    // The stored row should have ingredient_checks as a JSON string
    const storedRow = db._getStoredRow();
    expect(typeof storedRow!.ingredient_checks).toBe("string");
    expect(JSON.parse(storedRow!.ingredient_checks as string)).toEqual([0, 2, 4]);

    // getActiveSession should parse it back to an array
    const result = await getActiveSession(db as any);
    expect(Array.isArray(result!.ingredientChecks)).toBe(true);
    expect(result!.ingredientChecks).toEqual([0, 2, 4]);
  });

  it("getActiveSession returns null when no session exists", async () => {
    const db = createMockDb();
    const result = await getActiveSession(db as any);
    expect(result).toBeNull();
  });
});
