import { getCookedRecipesWithMeta, updateLatestRating } from '@/src/db/cooking-history';

// Mock expo-sqlite with in-memory tracking
const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockGetAllAsync = jest.fn().mockResolvedValue([]);

const mockDb = {
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
} as any;

describe('cooking-history-queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCookedRecipesWithMeta', () => {
    it('returns array of CookedRecipeMeta grouped by recipe_id, ordered by most recent cook', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { recipe_id: 'recipe-2', cook_count: 3, latest_rating: 5, last_cooked_at: '2026-03-19T10:00:00Z' },
        { recipe_id: 'recipe-1', cook_count: 1, latest_rating: 4, last_cooked_at: '2026-03-18T10:00:00Z' },
      ]);

      const result = await getCookedRecipesWithMeta(mockDb);

      expect(result).toEqual([
        { recipeId: 'recipe-2', cookCount: 3, latestRating: 5, lastCookedAt: '2026-03-19T10:00:00Z' },
        { recipeId: 'recipe-1', cookCount: 1, latestRating: 4, lastCookedAt: '2026-03-18T10:00:00Z' },
      ]);
    });

    it('returns empty array when no cooking history exists', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await getCookedRecipesWithMeta(mockDb);

      expect(result).toEqual([]);
    });

    it('correctly counts multiple cooks of same recipe', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { recipe_id: 'recipe-1', cook_count: 5, latest_rating: 3, last_cooked_at: '2026-03-19T12:00:00Z' },
      ]);

      const result = await getCookedRecipesWithMeta(mockDb);

      expect(result).toHaveLength(1);
      expect(result[0].cookCount).toBe(5);
    });

    it('returns null latestRating when no rating was given', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { recipe_id: 'recipe-1', cook_count: 2, latest_rating: null, last_cooked_at: '2026-03-19T08:00:00Z' },
      ]);

      const result = await getCookedRecipesWithMeta(mockDb);

      expect(result[0].latestRating).toBeNull();
    });
  });

  describe('updateLatestRating', () => {
    it('updates only the most recent cooking_history row for a given recipe_id', async () => {
      await updateLatestRating(mockDb, 'recipe-1', 4);

      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      const [sql] = mockRunAsync.mock.calls[0];
      // SQL should target only the most recent row via subquery
      expect(sql).toContain('UPDATE cooking_history SET rating');
      expect(sql).toContain('ORDER BY cooked_at DESC LIMIT 1');
    });

    it('calls runAsync with correct SQL and params', async () => {
      await updateLatestRating(mockDb, 'recipe-42', 5);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cooking_history SET rating = ?'),
        [5, 'recipe-42']
      );
    });
  });
});
