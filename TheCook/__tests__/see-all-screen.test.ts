// Mock AsyncStorage (required by ThemeContext import chain)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-sqlite
const mockDb = {};
jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

// Capture useFocusEffect callbacks to call them inside act()
let mockFocusCallbacks: Array<() => (() => void) | void> = [];
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn((cb: () => (() => void) | void) => {
    mockFocusCallbacks.push(cb);
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  router: { push: jest.fn(), back: jest.fn() },
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

// Mock image registry
jest.mock('@/app/assets/image-registry', () => ({
  getRecipeImages: () => ({ cover: null, coverBlurhash: null, steps: {} }),
}));

// Test fixture recipes
import type { RecipeListItem } from '@/src/types/discovery';
import type { Profile } from '@/src/types/profile';

function makeRecipe(overrides: Partial<RecipeListItem> & { id: string }): RecipeListItem {
  return {
    title: `Recipe ${overrides.id}`,
    cuisine: 'Turk',
    category: 'ana yemek',
    skillLevel: 'beginner',
    prepTime: 10,
    cookTime: 20,
    coverImage: null,
    allergens: [],
    equipment: [],
    ...overrides,
  };
}

const testRecipes: RecipeListItem[] = [
  makeRecipe({ id: 'r1', cuisine: 'Turk', skillLevel: 'beginner', prepTime: 5, cookTime: 10 }),
  makeRecipe({ id: 'r2', cuisine: 'Italyan', skillLevel: 'intermediate', prepTime: 10, cookTime: 25 }),
  makeRecipe({ id: 'r3', cuisine: 'Meksika', skillLevel: 'advanced', prepTime: 20, cookTime: 30 }),
  makeRecipe({ id: 'r4', cuisine: 'Turk', skillLevel: 'intermediate', prepTime: 5, cookTime: 5 }),
];

const testProfile: Profile = {
  allergens: [],
  skillLevel: 'intermediate',
  equipment: ['fırın', 'tava'],
  onboardingCompleted: true,
  accountNudgeShown: true,
  cuisinePreferences: 'Turk, Italyan',
  appGoals: null,
};

const testBookmarks = [
  { id: 'b1', recipeId: 'r1', userId: null, createdAt: '2026-01-01T00:00:00Z' },
];

// Mock DB modules
const mockGetAllRecipesForFeed = jest.fn(() => Promise.resolve(testRecipes));
const mockGetCookedRecipeIds = jest.fn(() => Promise.resolve(new Set<string>()));
const mockGetProfile = jest.fn(() => Promise.resolve(testProfile));
const mockGetBookmarks = jest.fn(() => Promise.resolve(testBookmarks));
const mockAddBookmark = jest.fn(() => Promise.resolve());
const mockRemoveBookmark = jest.fn(() => Promise.resolve());

jest.mock('@/src/db/recipes', () => ({
  getAllRecipesForFeed: (...args: unknown[]) => mockGetAllRecipesForFeed(...args),
}));

jest.mock('@/src/db/cooking-history', () => ({
  getCookedRecipeIds: (...args: unknown[]) => mockGetCookedRecipeIds(...args),
}));

jest.mock('@/src/db/profile', () => ({
  useProfileDb: () => ({
    getProfile: mockGetProfile,
    getBookmarks: mockGetBookmarks,
    addBookmark: mockAddBookmark,
    removeBookmark: mockRemoveBookmark,
  }),
}));

// We do NOT mock buildFeedSections -- it is a pure function
import { buildFeedSections } from '@/src/hooks/useFeedScreen';
import { useSeeAllScreen } from '@/src/hooks/useSeeAllScreen';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSeeAllScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallbacks = [];
    mockGetAllRecipesForFeed.mockResolvedValue(testRecipes);
    mockGetCookedRecipeIds.mockResolvedValue(new Set<string>());
    mockGetProfile.mockResolvedValue(testProfile);
    mockGetBookmarks.mockResolvedValue(testBookmarks);
  });

  test('useSeeAllScreen("trending") returns all recipes matching trending section from buildFeedSections', async () => {
    const { result } = renderHook(() => useSeeAllScreen('trending'));

    // Fire focus effect inside act
    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.title).toBe('Su an trend');

    // Compare against what buildFeedSections produces for trending
    const { sections } = buildFeedSections(testRecipes, new Set(), testProfile);
    const trending = sections.find((s) => s.key === 'trending');
    expect(result.current.recipes.map((r) => r.id)).toEqual(trending!.data.map((r) => r.id));
  });

  test('useSeeAllScreen("quick") returns only recipes with totalTime <= 30', async () => {
    const { result } = renderHook(() => useSeeAllScreen('quick'));

    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.title).toBe('30 dakikada bitir');

    // r1: 5+10=15 (yes), r2: 10+25=35 (no), r3: 20+30=50 (no), r4: 5+5=10 (yes)
    expect(result.current.recipes.map((r) => r.id)).toEqual(['r1', 'r4']);
  });

  test('useSeeAllScreen("invalid_key") returns isValid=false and empty recipes', async () => {
    const { result } = renderHook(() => useSeeAllScreen('invalid_key'));

    // Should return immediately with invalid state, no loading
    expect(result.current.isValid).toBe(false);
    expect(result.current.recipes).toEqual([]);
    expect(result.current.title).toBe('');
    expect(result.current.loading).toBe(false);
  });

  test('bookmark toggle adds/removes from bookmarkedIds set', async () => {
    const { result } = renderHook(() => useSeeAllScreen('trending'));

    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // r1 should be bookmarked (from testBookmarks fixture)
    expect(result.current.bookmarkedIds.has('r1')).toBe(true);

    // Toggle r1 off (remove bookmark)
    await act(async () => {
      await result.current.toggleBookmark('r1');
    });
    expect(result.current.bookmarkedIds.has('r1')).toBe(false);
    expect(mockRemoveBookmark).toHaveBeenCalledWith('r1');

    // Toggle r2 on (add bookmark)
    await act(async () => {
      await result.current.toggleBookmark('r2');
    });
    expect(result.current.bookmarkedIds.has('r2')).toBe(true);
    expect(mockAddBookmark).toHaveBeenCalledWith('r2', null);
  });
});
