import * as SecureStore from "expo-secure-store";

// Must import after mocking
let auth;
beforeEach(async () => {
  jest.resetModules();
  auth = await import("../../utils/auth.js");
});

describe("saveToken / getToken / removeToken", () => {
  it("saves and retrieves a token", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("my-jwt");
    await auth.saveToken("my-jwt");
    const token = await auth.getToken();
    expect(token).toBe("my-jwt");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("csa_auth_token", "my-jwt");
  });

  it("removes the token", async () => {
    await auth.removeToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("csa_auth_token");
  });
});

describe("getMe", () => {
  it("decodes JWT payload without verifying", () => {
    // Header.Payload.Signature — payload = base64({"userId":"abc","firstName":"Alex"})
    const payload = { userId: "abc", firstName: "Alex", lastName: "Zhong", email: "a@b.com", avatar: "" };
    const b64 = btoa(JSON.stringify(payload));
    const fakeJwt = `header.${b64}.signature`;
    const decoded = auth.getMe(fakeJwt);
    expect(decoded.userId).toBe("abc");
    expect(decoded.firstName).toBe("Alex");
  });

  it("returns null for invalid token", () => {
    const result = auth.getMe("bad-token");
    expect(result).toBeNull();
  });
});
