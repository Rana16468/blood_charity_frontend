const IV_LENGTH = 12;

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveKey(secret, salt) {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

export async function encrypt(payload, secret) {
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(payload));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(secret, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // IMPORTANT:
  // WebCrypto returns ciphertext + authTag together
  const encryptedArray = new Uint8Array(encryptedBuffer);

  // Split last 16 bytes as TAG
  const tag = encryptedArray.slice(encryptedArray.length - 16);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);

  return {
    encrypted: [
      bufferToHex(salt),
      bufferToHex(iv),
      bufferToHex(tag),
      bufferToHex(ciphertext),
    ].join(":"),
  };
}