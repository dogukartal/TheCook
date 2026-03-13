import { SQLiteDatabase } from "expo-sqlite";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CookingSession {
  recipeId: string;
  currentStep: number;
  timerRemaining: number | null;
  timerStartTimestamp: number | null;
  ingredientChecks: number[];
  sessionStartedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Internal row shape
// ---------------------------------------------------------------------------

interface CookingSessionRow {
  id: number;
  recipe_id: string;
  current_step: number;
  timer_remaining: number | null;
  timer_start_timestamp: number | null;
  ingredient_checks: string;
  session_started_at: string;
}

// ---------------------------------------------------------------------------
// CRUD — only one active session at a time (id=1)
// ---------------------------------------------------------------------------

/**
 * Save (upsert) the active cooking session. Uses INSERT OR REPLACE with id=1
 * so only one session exists at any time.
 */
export async function saveSession(
  db: SQLiteDatabase,
  session: CookingSession
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO cooking_sessions
      (id, recipe_id, current_step, timer_remaining, timer_start_timestamp, ingredient_checks, session_started_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [
      session.recipeId,
      session.currentStep,
      session.timerRemaining,
      session.timerStartTimestamp,
      JSON.stringify(session.ingredientChecks),
      session.sessionStartedAt,
    ]
  );
}

/**
 * Get the active cooking session, or null if none exists.
 */
export async function getActiveSession(
  db: SQLiteDatabase
): Promise<CookingSession | null> {
  const row = await db.getFirstAsync<CookingSessionRow>(
    "SELECT * FROM cooking_sessions WHERE id = 1"
  );
  if (!row) return null;

  return {
    recipeId: row.recipe_id,
    currentStep: row.current_step,
    timerRemaining: row.timer_remaining,
    timerStartTimestamp: row.timer_start_timestamp,
    ingredientChecks: JSON.parse(row.ingredient_checks),
    sessionStartedAt: row.session_started_at,
  };
}

/**
 * Clear (delete) the active cooking session.
 */
export async function clearSession(db: SQLiteDatabase): Promise<void> {
  await db.runAsync("DELETE FROM cooking_sessions");
}
