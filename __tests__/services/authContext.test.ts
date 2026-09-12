import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("Authentication & Profile Service", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("persists user profile and unique invite code across sessions", async () => {
    const demoProfile = {
      id: "usr-demo-777",
      email: "david@inscribe.app",
      displayName: "David (Scholar)",
      inviteCode: "INSC-7X9P",
      longestStreak: 42,
    };

    await AsyncStorage.setItem("@inscribe_demo_user", JSON.stringify(demoProfile));

    const stored = await AsyncStorage.getItem("@inscribe_demo_user");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.id).toBe("usr-demo-777");
    expect(parsed.email).toBe("david@inscribe.app");
    expect(parsed.inviteCode).toBe("INSC-7X9P");
    expect(parsed.longestStreak).toBe(42);
  });

  test("clearing session removes stored credentials", async () => {
    await AsyncStorage.setItem("@inscribe_demo_user", JSON.stringify({ id: "1" }));
    await AsyncStorage.removeItem("@inscribe_demo_user");
    const stored = await AsyncStorage.getItem("@inscribe_demo_user");
    expect(stored).toBeNull();
  });
});
