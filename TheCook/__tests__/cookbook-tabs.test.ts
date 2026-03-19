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
const mockDb = {
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue(undefined),
};
jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

// Capture useFocusEffect callbacks to call them inside act()
let mockFocusCallbacks: Array<() => (() => void) | void> = [];
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn((cb: () => (() => void) | void) => {
    mockFocusCallbacks.push(cb);
  }),
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

// Test fixture data
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
  makeRecipe({ id: 'r1' }),
  makeRecipe({ id: 'r2' }),
  makeRecipe({ id: 'r3' }),
];

const testProfile: Profile = {
  allergens: [],
  skillLevel: 'intermediate',
  equipment: ['tava'],
  onboardingCompleted: true,
  accountNudgeShown: true,
  cuisinePreferences: 'Turk',
  appGoals: null,
};

const testBookmarks = [
  { id: 'b1', recipeId: 'r1', userId: null, createdAt: '2026-01-01T00:00:00Z' },
];

// Mock DB modules
const mockGetBookmarkedRecipes = jest.fn(() => Promise.resolve([testRecipes[0]]));
const mockGetProfile = jest.fn(() => Promise.resolve(testProfile));
const mockGetBookmarks = jest.fn(() => Promise.resolve(testBookmarks));
const mockAddBookmark = jest.fn(() => Promise.resolve());
const mockRemoveBookmark = jest.fn(() => Promise.resolve());

jest.mock('@/src/db/recipes', () => ({
  getBookmarkedRecipes: jest.fn(),
  getRecipesByIds: jest.fn().mockResolvedValue([]),
  useRecipesDb: () => ({
    getBookmarkedRecipes: mockGetBookmarkedRecipes,
  }),
}));

const mockGetCookedRecipesWithMeta = jest.fn<any, any[]>(() => Promise.resolve([]));
const mockUpdateLatestRating = jest.fn<any, any[]>(() => Promise.resolve());

jest.mock('@/src/db/cooking-history', () => ({
  getCookedRecipesWithMeta: (...args: any[]) => mockGetCookedRecipesWithMeta(args[0]),
  updateLatestRating: (...args: any[]) => mockUpdateLatestRating(args[0], args[1], args[2]),
  getCookedRecipeIds: jest.fn(() => Promise.resolve(new Set<string>())),
}));

jest.mock('@/src/db/profile', () => ({
  useProfileDb: () => ({
    getProfile: mockGetProfile,
    getBookmarks: mockGetBookmarks,
    addBookmark: mockAddBookmark,
    removeBookmark: mockRemoveBookmark,
  }),
}));

jest.mock('@/src/auth/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'user-1' } },
    isLoading: false,
    signOut: jest.fn(),
  }),
}));

import { useCookbookScreen } from '@/src/hooks/useCookbookScreen';
import { getRecipesByIds } from '@/src/db/recipes';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCookbookScreen - tabs and cooked data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallbacks = [];
    mockGetProfile.mockResolvedValue(testProfile);
    mockGetBookmarks.mockResolvedValue(testBookmarks);
    mockGetBookmarkedRecipes.mockResolvedValue([testRecipes[0]]);
    mockGetCookedRecipesWithMeta.mockResolvedValue([]);
    mockUpdateLatestRating.mockResolvedValue(undefined);
    (getRecipesByIds as jest.Mock).mockResolvedValue([]);
  });

  test('initial state has activeTab="saved"', () => {
    const { result } = renderHook(() => useCookbookScreen());

    expect(result.current.activeTab).toBe('saved');
  });

  test('setActiveTab("cooked") changes activeTab', () => {
    const { result } = renderHook(() => useCookbookScreen());

    act(() => {
      result.current.setActiveTab('cooked');
    });

    expect(result.current.activeTab).toBe('cooked');
  });

  test('after focus, savedRecipes and cookedRecipes are populated', async () => {
    const cookedMeta = [
      { recipeId: 'r2', cookCount: 3, latestRating: 4, lastCookedAt: '2026-03-19T10:00:00Z' },
    ];
    mockGetCookedRecipesWithMeta.mockResolvedValue(cookedMeta);
    (getRecipesByIds as jest.Mock).mockResolvedValue([testRecipes[1]]);

    const { result } = renderHook(() => useCookbookScreen());

    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Saved recipes populated
    expect(result.current.savedRecipes).toHaveLength(1);
    expect(result.current.savedRecipes[0].id).toBe('r1');

    // Cooked recipes populated
    expect(result.current.cookedRecipes).toHaveLength(1);
    expect(result.current.cookedRecipes[0].id).toBe('r2');
  });

  test('cookedRecipes include cookCount and latestRating fields', async () => {
    const cookedMeta = [
      { recipeId: 'r2', cookCount: 3, latestRating: 4, lastCookedAt: '2026-03-19T10:00:00Z' },
    ];
    mockGetCookedRecipesWithMeta.mockResolvedValue(cookedMeta);
    (getRecipesByIds as jest.Mock).mockResolvedValue([testRecipes[1]]);

    const { result } = renderHook(() => useCookbookScreen());

    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.cookedRecipes).toHaveLength(1);
    });

    expect(result.current.cookedRecipes[0].cookCount).toBe(3);
    expect(result.current.cookedRecipes[0].latestRating).toBe(4);
  });

  test('handleReRate updates cookedRecipes optimistically', async () => {
    const cookedMeta = [
      { recipeId: 'r2', cookCount: 2, latestRating: 3, lastCookedAt: '2026-03-19T10:00:00Z' },
    ];
    mockGetCookedRecipesWithMeta.mockResolvedValue(cookedMeta);
    (getRecipesByIds as jest.Mock).mockResolvedValue([testRecipes[1]]);

    const { result } = renderHook(() => useCookbookScreen());

    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.cookedRecipes).toHaveLength(1);
    });

    // Re-rate from 3 to 5
    await act(async () => {
      await result.current.handleReRate('r2', 5);
    });

    // Optimistic update: latestRating should be 5 immediately
    expect(result.current.cookedRecipes[0].latestRating).toBe(5);
    // DB call should have been made
    expect(mockUpdateLatestRating).toHaveBeenCalledWith(mockDb, 'r2', 5);
  });

  test('cookedLoading is initially true and becomes false after data loads', async () => {
    const { result } = renderHook(() => useCookbookScreen());

    expect(result.current.cookedLoading).toBe(true);

    await act(async () => {
      for (const cb of mockFocusCallbacks) cb();
    });

    await waitFor(() => {
      expect(result.current.cookedLoading).toBe(false);
    });
  });
});
