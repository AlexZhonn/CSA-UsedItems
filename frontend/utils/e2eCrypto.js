/**
 * E2E Encryption — X25519 ECDH key exchange + AES-256-GCM message encryption.
 *
 * Flow:
 *   Send:    fetch receiver's publicKey → ECDH shared secret → AES-GCM encrypt
 *            → store { iv, ciphertext, senderPublicKey } as JSON string in message.content
 *   Receive: load own private key → ECDH with senderPublicKey → AES-GCM decrypt
 *
 * Private key stored in expo-secure-store under "e2e_private_key".
 * Public  key stored in expo-secure-store under "e2e_public_key" (mirror copy).
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { x25519 } from "@noble/curves/ed25519";
import { gcm } from "@noble/ciphers/aes";

const PRIVATE_KEY_KEY = "e2e_private_key";
const PUBLIC_KEY_KEY = "e2e_public_key";

// ── Helpers ────────────────────────────────────────────────────────────────────

const toHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex) => {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
};

const randomBytes = async (n) => {
  const arr = new Uint8Array(n);
  // expo-crypto provides a Web Crypto–compatible getRandomValues
  Crypto.getRandomValues(arr);
  return arr;
};

// Derive a 32-byte AES key from the ECDH shared secret using SHA-256
const deriveKey = async (sharedSecret) => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    toHex(sharedSecret)
  );
  return fromHex(hash);
};

// ── Key management ─────────────────────────────────────────────────────────────

/**
 * Generate a new X25519 key pair and persist it in SecureStore.
 * Returns { privateKeyHex, publicKeyHex }.
 */
export async function generateKeyPair() {
  const privateKey = await randomBytes(32);
  const publicKey = x25519.getPublicKey(privateKey);

  const privHex = toHex(privateKey);
  const pubHex = toHex(publicKey);

  await SecureStore.setItemAsync(PRIVATE_KEY_KEY, privHex);
  await SecureStore.setItemAsync(PUBLIC_KEY_KEY, pubHex);

  return { privateKeyHex: privHex, publicKeyHex: pubHex };
}

/**
 * Load the persisted public key hex, or null if none.
 */
export async function loadPublicKey() {
  return SecureStore.getItemAsync(PUBLIC_KEY_KEY);
}

/**
 * Load the persisted private key hex, or null if none.
 */
export async function loadPrivateKey() {
  return SecureStore.getItemAsync(PRIVATE_KEY_KEY);
}

/**
 * Ensure a key pair exists — generate one only if missing.
 * Returns the public key hex string.
 */
export async function ensureKeyPair() {
  const existing = await loadPublicKey();
  if (existing) return existing;
  const { publicKeyHex } = await generateKeyPair();
  return publicKeyHex;
}

// ── Encryption / Decryption ────────────────────────────────────────────────────

/**
 * Encrypt plaintext for a recipient.
 * @param {string} plaintext
 * @param {string} recipientPublicKeyHex  — hex-encoded X25519 public key of the recipient
 * @returns {string}  JSON string: { iv, ciphertext, senderPublicKey }
 */
export async function encryptMessage(plaintext, recipientPublicKeyHex) {
  const privateKeyHex = await loadPrivateKey();
  if (!privateKeyHex) throw new Error("No local private key — call ensureKeyPair() first");

  const privateKey = fromHex(privateKeyHex);
  const recipientPublicKey = fromHex(recipientPublicKeyHex);
  const senderPublicKey = x25519.getPublicKey(privateKey);

  const sharedSecret = x25519.getSharedSecret(privateKey, recipientPublicKey);
  const aesKey = await deriveKey(sharedSecret);

  const iv = await randomBytes(12); // 96-bit nonce for GCM
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const cipher = gcm(aesKey, iv);
  const ciphertext = cipher.encrypt(plaintextBytes);

  return JSON.stringify({
    iv: toHex(iv),
    ciphertext: toHex(ciphertext),
    senderPublicKey: toHex(senderPublicKey),
  });
}

/**
 * Decrypt a message encrypted with encryptMessage.
 * @param {string} encryptedJson  — JSON string from encryptMessage
 * @returns {string}  plaintext, or null if decryption fails
 */
export async function decryptMessage(encryptedJson) {
  try {
    const { iv, ciphertext, senderPublicKey: senderPublicKeyHex } = JSON.parse(encryptedJson);

    const privateKeyHex = await loadPrivateKey();
    if (!privateKeyHex) return null;

    const privateKey = fromHex(privateKeyHex);
    const senderPublicKey = fromHex(senderPublicKeyHex);

    const sharedSecret = x25519.getSharedSecret(privateKey, senderPublicKey);
    const aesKey = await deriveKey(sharedSecret);

    const cipher = gcm(aesKey, fromHex(iv));
    const plaintext = cipher.decrypt(fromHex(ciphertext));

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch {
    return null; // graceful fallback for old plaintext or malformed messages
  }
}

/**
 * Returns true if the string looks like an encrypted payload (JSON with iv/ciphertext/senderPublicKey).
 */
export function isEncrypted(content) {
  if (typeof content !== "string") return false;
  try {
    const parsed = JSON.parse(content);
    return !!(parsed.iv && parsed.ciphertext && parsed.senderPublicKey);
  } catch {
    return false;
  }
}
