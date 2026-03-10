// Plan 02-03 — ProfileSchema and BookmarkSchema tests
import { ProfileSchema, BookmarkSchema } from "../src/types/profile";

describe("ProfileSchema", () => {
  it("parses empty object with correct defaults", () => {
    const result = ProfileSchema.parse({});
    expect(result.allergens).toEqual([]);
    expect(result.skillLevel).toBeNull();
    expect(result.equipment).toEqual(["fırın", "tava"]);
    expect(result.onboardingCompleted).toBe(false);
    expect(result.accountNudgeShown).toBe(false);
  });

  it("rejects invalid allergen", () => {
    expect(() => ProfileSchema.parse({ allergens: ["pollen"] })).toThrow();
  });

  it("allergens default is [] — opt-in, not opt-out (safety-critical)", () => {
    const result = ProfileSchema.parse({});
    expect(result.allergens).toEqual([]);
    expect(result.allergens.length).toBe(0);
  });

  it("equipment defaults to ['fırın','tava']", () => {
    const result = ProfileSchema.parse({});
    expect(result.equipment).toEqual(["fırın", "tava"]);
  });

  it("skillLevel defaults to null", () => {
    const result = ProfileSchema.parse({});
    expect(result.skillLevel).toBeNull();
  });

  it("accepts valid allergens", () => {
    const result = ProfileSchema.parse({ allergens: ["gluten", "dairy"] });
    expect(result.allergens).toEqual(["gluten", "dairy"]);
  });

  it("accepts valid skillLevel", () => {
    const result = ProfileSchema.parse({ skillLevel: "beginner" });
    expect(result.skillLevel).toBe("beginner");
  });

  it("rejects invalid skillLevel", () => {
    expect(() => ProfileSchema.parse({ skillLevel: "expert" })).toThrow();
  });

  it("accepts valid equipment", () => {
    const result = ProfileSchema.parse({ equipment: ["fırın", "blender"] });
    expect(result.equipment).toEqual(["fırın", "blender"]);
  });

  it("rejects invalid equipment", () => {
    expect(() => ProfileSchema.parse({ equipment: ["microwave"] })).toThrow();
  });
});

describe("BookmarkSchema", () => {
  it("rejects non-UUID id", () => {
    expect(() =>
      BookmarkSchema.parse({
        id: "not-uuid",
        recipeId: "r1",
        createdAt: new Date().toISOString(),
      })
    ).toThrow();
  });

  it("parses valid bookmark with userId defaulting to null", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const result = BookmarkSchema.parse({
      id,
      recipeId: "r1",
      createdAt: "2026-03-10T15:00:00.000Z",
    });
    expect(result.id).toBe(id);
    expect(result.recipeId).toBe("r1");
    expect(result.userId).toBeNull();
  });

  it("accepts explicit userId", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const result = BookmarkSchema.parse({
      id,
      recipeId: "r1",
      userId: "user-123",
      createdAt: "2026-03-10T15:00:00.000Z",
    });
    expect(result.userId).toBe("user-123");
  });

  it("rejects missing recipeId", () => {
    expect(() =>
      BookmarkSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        createdAt: "2026-03-10T15:00:00.000Z",
      })
    ).toThrow();
  });
});
