import { logCookingCompletion, getCookedRecipeIds } from '@/src/db/cooking-history';

// Mock expo-sqlite with in-memory tracking
const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockGetAllAsync = jest.fn().mockResolvedValue([]);

const mockDb = {
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
} as any;

describe('cooking-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logCookingCompletion', () => {
    it('inserts a row with recipe_id and rating', async () => {
      await logCookingCompletion(mockDb, 'recipe-1', 4);

      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO cooking_history (recipe_id, rating) VALUES (?, ?)',
        ['recipe-1', 4]
      );
    });

    it('inserts with NULL rating when rating is undefined', async () => {
      await logCookingCompletion(mockDb, 'recipe-1');

      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO cooking_history (recipe_id, rating) VALUES (?, ?)',
        ['recipe-1', null]
      );
    });
  });

  describe('getCookedRecipeIds', () => {
    it('returns set of distinct recipe IDs from cooking_history', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { recipe_id: 'recipe-1' },
        { recipe_id: 'recipe-2' },
        { recipe_id: 'recipe-3' },
      ]);

      const result = await getCookedRecipeIds(mockDb);

      expect(result).toEqual(new Set(['recipe-1', 'recipe-2', 'recipe-3']));
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT DISTINCT recipe_id FROM cooking_history'
      );
    });
  });
});
