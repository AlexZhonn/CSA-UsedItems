import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "csa_auth_token";

export async function saveToken(jwt) {
  await SecureStore.setItemAsync(TOKEN_KEY, jwt);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Decode the JWT payload without verifying the signature.
 * Returns { userId, email, firstName, lastName, avatar } or null.
 */
export function getMe(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    // atob is available in React Native (Hermes) and on web
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}
