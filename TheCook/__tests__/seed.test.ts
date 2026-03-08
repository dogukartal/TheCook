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
    const db = createMockDb("1.0.0");
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
      "1.0.0"
    );
  });
});
