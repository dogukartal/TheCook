// AUTH-02: cloud-wins upsert on sign-in
// AUTH-03: sign-out preserves local SQLite data
//
// Tests for initAuthListener (sync.ts) and pullCloudProfile (sync.ts)
// Mocking Supabase so tests don't require a live connection.

import { pullCloudProfile, initAuthListener } from "../src/auth/sync";
import { saveProfileToDb, saveBookmarksToDb } from "../src/db/profile";

// Mock the supabase client
jest.mock("../src/auth/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock db functions so we can observe calls without real SQLite
jest.mock("../src/db/profile", () => ({
  saveProfileToDb: jest.fn(),
  saveBookmarksToDb: jest.fn(),
}));

import { supabase } from "../src/auth/supabase";

const mockSaveProfileToDb = saveProfileToDb as jest.MockedFunction<typeof saveProfileToDb>;
const mockSaveBookmarksToDb = saveBookmarksToDb as jest.MockedFunction<typeof saveBookmarksToDb>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

function makeMockDb() {
  return {} as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// pullCloudProfile tests
// ---------------------------------------------------------------------------

describe("pullCloudProfile()", () => {
  it("fetches cloud profile and saves to local SQLite — cloud allergens overwrite local", async () => {
    const mockDb = makeMockDb();
    const userId = "user-123";

    // Mock profiles query
    const mockProfileSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          allergens: ["gluten", "dairy"],
          skill_level: "intermediate",
          equipment: ["fırın", "blender"],
        },
        error: null,
      }),
    };

    // Mock bookmarks query
    const mockBookmarksSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (mockSupabase.from as jest.Mock)
      .mockReturnValueOnce(mockProfileSelect)
      .mockReturnValueOnce(mockBookmarksSelect);

    await pullCloudProfile(mockDb, userId);

    expect(mockSaveProfileToDb).toHaveBeenCalledWith(mockDb, {
      allergens: ["gluten", "dairy"],
      skillLevel: "intermediate",
      equipment: ["fırın", "blender"],
    });
  });

  it("cloud has empty allergens — local allergens become [] (cloud wins)", async () => {
    const mockDb = makeMockDb();
    const userId = "user-456";

    const mockProfileSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          allergens: [],
          skill_level: null,
          equipment: ["tava"],
        },
        error: null,
      }),
    };

    const mockBookmarksSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (mockSupabase.from as jest.Mock)
      .mockReturnValueOnce(mockProfileSelect)
      .mockReturnValueOnce(mockBookmarksSelect);

    await pullCloudProfile(mockDb, userId);

    // Cloud wins — empty cloud allergens must replace any local allergens
    expect(mockSaveProfileToDb).toHaveBeenCalledWith(mockDb, {
      allergens: [],
      skillLevel: null,
      equipment: ["tava"],
    });
  });

  it("pullCloudProfile with null userId does nothing and does not throw", async () => {
    const mockDb = makeMockDb();

    // Should not throw — exit early
    await expect(pullCloudProfile(mockDb, null as any)).resolves.toBeUndefined();
    expect(mockSaveProfileToDb).not.toHaveBeenCalled();
    expect(mockSaveBookmarksToDb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// initAuthListener tests (onAuthStateChange integration)
// ---------------------------------------------------------------------------

describe("initAuthListener()", () => {
  it("SIGNED_IN event triggers pullCloudProfile — cloud data saved to SQLite", async () => {
    const mockDb = makeMockDb();
    const userId = "user-789";

    const mockProfileSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          allergens: ["nuts"],
          skill_level: "beginner",
          equipment: ["fırın"],
        },
        error: null,
      }),
    };

    const mockBookmarksSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    (mockSupabase.from as jest.Mock)
      .mockReturnValueOnce(mockProfileSelect)
      .mockReturnValueOnce(mockBookmarksSelect);

    let authCallback: (event: string, session: any) => Promise<void>;
    const mockUnsubscribe = jest.fn();
    (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const unsubscribe = initAuthListener(mockDb);

    // Simulate SIGNED_IN event
    await authCallback!("SIGNED_IN", { user: { id: userId } });

    expect(mockSaveProfileToDb).toHaveBeenCalledWith(mockDb, {
      allergens: ["nuts"],
      skillLevel: "beginner",
      equipment: ["fırın"],
    });

    // Cleanup unsubscribes correctly
    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("SIGNED_OUT event does NOT modify local profile — local data preserved", async () => {
    const mockDb = makeMockDb();

    let authCallback: (event: string, session: any) => Promise<void>;
    const mockUnsubscribe = jest.fn();
    (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    initAuthListener(mockDb);

    // Simulate SIGNED_OUT event
    await authCallback!("SIGNED_OUT", null);

    // Neither profile nor bookmarks should be touched
    expect(mockSaveProfileToDb).not.toHaveBeenCalled();
    expect(mockSaveBookmarksToDb).not.toHaveBeenCalled();
  });
});
