// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const IV_LENGTH = 12;   // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag
const KEY_LENGTH = 32;  // 256-bit key
const PBKDF2_ITERATIONS = 100_000;

// ─────────────────────────────────────────────
//  Helpers: hex ↔ Uint8Array
// ─────────────────────────────────────────────
function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ─────────────────────────────────────────────
//  Key derivation  (PBKDF2 → 32-byte AES-GCM key)
// ─────────────────────────────────────────────
async function deriveKey(secret, salt) {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH * 8 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─────────────────────────────────────────────
//  Low-level: encrypt a UTF-8 string
//  Returns  "salt:iv:tag:ciphertext"  (all hex)
// ─────────────────────────────────────────────
async function encryptString(plain, secret) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(secret, salt);

  // AES-GCM appends the auth tag to the ciphertext automatically
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH * 8 },
    key,
    enc.encode(plain)
  );

  // Split ciphertext and tag (tag is last TAG_LENGTH bytes)
  const encryptedBytes = new Uint8Array(encryptedBuf);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - TAG_LENGTH);
  const tag = encryptedBytes.slice(encryptedBytes.length - TAG_LENGTH);

  return [toHex(salt), toHex(iv), toHex(tag), toHex(ciphertext)].join(":");
}

// ─────────────────────────────────────────────
//  Low-level: decrypt  "salt:iv:tag:ciphertext"
// ─────────────────────────────────────────────
async function decryptString(token, secret) {
  const parts = token.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted token format.");
  }

  const [saltHex, ivHex, tagHex, cipherHex] = parts;
  const salt = fromHex(saltHex);
  const iv = fromHex(ivHex);
  const tag = fromHex(tagHex);
  const ciphertext = fromHex(cipherHex);
  const key = await deriveKey(secret, salt);

  // Web Crypto expects ciphertext + tag concatenated
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH * 8 },
    key,
    combined
  );

  return new TextDecoder().decode(decryptedBuf);
}

/**
 * encrypt()
 *
 * Accepts:
 *   - a plain object   → encrypts the whole JSON
 *   - an array (any)   → encrypts the whole JSON
 *
 * Returns a single opaque `encrypted` string + original `type` hint.
 */
export async function encrypt(payload, secret) {
  if (!secret || secret.length < 8) {
    throw new Error("Secret key must be at least 8 characters.");
  }

  const type = Array.isArray(payload) ? "array" : "object";
  const json = JSON.stringify(payload);
  const encrypted = await encryptString(json, secret);

  return { encrypted, type };
}

/**
 * decrypt()
 *
 * Accepts the `encrypted` string produced by encrypt().
 * Returns the original payload + its type.
 */
export async function decrypt(encrypted, secret) {
  if (!secret || secret.length < 8) {
    throw new Error("Secret key must be at least 8 characters.");
  }

  const json = await decryptString(encrypted, secret);
  const parsed = JSON.parse(json);
  const type = Array.isArray(parsed) ? "array" : "object";

  return { decrypted: parsed, type };
}