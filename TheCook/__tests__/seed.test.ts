import { seedIfNeeded } from "../src/db/seed";

const createMockDb = (existingVersion: string | null) => ({
  getFirstAsync: jest.fn().mockResolvedValue(
    existingVersion ? { version: existingVersion } : null
  ),
  withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  runAsync: jest.fn().mockResolvedValue(undefined),
  execAsync: jest.fn().mockResolvedValue(undefined),
});

describe("seedIfNeeded", () => {
  it("seeds database on first launch", async () => {
    const db = createMockDb(null);
    await seedIfNeeded(db as any);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();
  });

  it("skips seed when version matches", async () => {
    const db = createMockDb("2.0.0");
    await seedIfNeeded(db as any);
    expect(db.withTransactionAsync).not.toHaveBeenCalled();
    expect(db.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO recipes"),
      expect.anything()
    );
  });

  it("seeds with transaction", async () => {
    const db = createMockDb(null);
    await seedIfNeeded(db as any);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  it("inserts seed_version after seeding", async () => {
    const db = createMockDb(null);
    await seedIfNeeded(db as any);
    expect(db.runAsync).toHaveBeenCalledWith(
      "INSERT INTO seed_version (id, version) VALUES (1, ?)",
      "2.0.0"
    );
  });

  it("seeds new version when SEED_VERSION bumped (version mismatch triggers re-seed)", async () => {
    // Pre-existing DB has old version "1.0.0"; SEED_VERSION is now "2.0.0"
    const db = createMockDb("1.0.0");
    await seedIfNeeded(db as any);
    // Should have triggered a re-seed transaction
    expect(db.withTransactionAsync).toHaveBeenCalled();
    // Should have cleared old recipes
    expect(db.runAsync).toHaveBeenCalledWith("DELETE FROM recipes");
    // Should have inserted new seed_version row with current SEED_VERSION
    expect(db.runAsync).toHaveBeenCalledWith(
      "INSERT INTO seed_version (id, version) VALUES (1, ?)",
      "2.0.0"
    );
  });
});
