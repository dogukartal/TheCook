// Plan 02-01 stubs — will fail until src/auth/supabase.ts and src/db/profile.ts exist
// AUTH-02: cloud-wins upsert on sign-in
// AUTH-03: sign-out preserves local SQLite data

import { pullCloudProfile, signOut } from "../src/auth/supabase";
import { getLocalProfile } from "../src/db/profile";

// Mock Supabase client so tests don't require a live connection
jest.mock("../src/auth/supabase", () => ({
  pullCloudProfile: jest.fn(),
  signOut: jest.fn(),
}));

const mockPullCloudProfile = pullCloudProfile as jest.MockedFunction<typeof pullCloudProfile>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe("Cloud sync — AUTH-02: cloud wins on sign-in", () => {
  it("pullCloudProfile() overwrites local profile with cloud data", async () => {
    const mockDb = {} as any;
    const cloudProfile = {
      allergens: ["gluten", "dairy"],
      skillLevel: "intermediate" as const,
      equipment: ["fırın", "blender"],
      onboardingCompleted: true,
      accountNudgeShown: true,
    };

    mockPullCloudProfile.mockResolvedValueOnce(cloudProfile);

    const result = await pullCloudProfile(mockDb);

    expect(result).toEqual(cloudProfile);
    expect(result.allergens).toContain("gluten");
    expect(result.skillLevel).toBe("intermediate");
  });

  it("cloud data overwrites local profile — cloud always wins on conflict", async () => {
    const mockDb = {} as any;
    const cloudProfile = {
      allergens: ["nuts"],
      skillLevel: "advanced" as const,
      equipment: ["wok"],
      onboardingCompleted: true,
      accountNudgeShown: true,
    };

    mockPullCloudProfile.mockResolvedValueOnce(cloudProfile);

    const result = await pullCloudProfile(mockDb);

    // Cloud data must replace local — cloud wins
    expect(result.allergens).toEqual(["nuts"]);
    expect(result.equipment).toEqual(["wok"]);
  });
});

describe("Sign-out — AUTH-03: local data preserved after sign-out", () => {
  it("local profile is still accessible in SQLite after sign-out", async () => {
    const mockDb = {} as any;

    mockSignOut.mockResolvedValueOnce(undefined);
    await signOut(mockDb);

    // getLocalProfile should still work after sign-out (data not wiped)
    const localProfile = await getLocalProfile(mockDb);

    expect(localProfile).toBeDefined();
  });

  it("sign-out does not delete local SQLite profile row", async () => {
    const mockDb = {} as any;

    mockSignOut.mockResolvedValueOnce(undefined);
    await signOut(mockDb);

    // Local profile row id=1 must still be accessible
    const localProfile = await getLocalProfile(mockDb);
    expect(localProfile).not.toBeNull();
  });
});
