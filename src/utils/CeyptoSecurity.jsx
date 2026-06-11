
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;


function bufToHex(buffer) {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex) {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const view = new Uint8Array(hex.length / 2);

  for (let i = 0; i < view.length; i++) {
    view[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }

  return view;
}


async function deriveKey(secret, salt) {
  const enc = new TextEncoder();
  const secretBuffer = enc.encode(secret);

  const baseKey = await globalThis.crypto.subtle.importKey(
    "raw",
    secretBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}


async function encryptString(plain, secret) {
  const salt = globalThis.crypto.getRandomValues(
    new Uint8Array(SALT_LENGTH)
  );
  const iv = globalThis.crypto.getRandomValues(
    new Uint8Array(IV_LENGTH)
  );

  const key = await deriveKey(secret, salt);

  const encodedPlain = new TextEncoder().encode(plain);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv.buffer,
    },
    key,
    encodedPlain.buffer
  );

  return [
    bufToHex(salt),
    bufToHex(iv),
    bufToHex(new Uint8Array(encryptedBuffer)),
  ].join(":");
}


async function decryptString(token, secret) {
  const parts = token.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format.");
  }

  const [saltHex, ivHex, cipherHex] = parts;

  const salt = hexToBuf(saltHex);
  const iv = hexToBuf(ivHex);
  const ciphertextWithTag = hexToBuf(cipherHex);

  if (iv.length !== IV_LENGTH) {
    throw new Error(
      `Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`
    );
  }

  const key = await deriveKey(secret, salt);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv.buffer,
    },
    key,
    ciphertextWithTag.buffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}


export async function encrypt(payload, secret) {
  if (!secret || secret.length < 8) {
    throw new Error(
      "Secret key must be at least 8 characters."
     
    );
  }

  const type = Array.isArray(payload) ? "array" : "object";
  const json = JSON.stringify(payload);

  const encrypted = await encryptString(json, secret);

  return {
    encrypted,
    type,
  };
}

export async function decrypt(encrypted, secret) {
  if (!secret || secret.length < 8) {
    throw new Error(
      "Secret key must be at least 8 characters."
   
    );
  }

  const json = await decryptString(encrypted, secret);
  const parsed = JSON.parse(json);

  return {
    decrypted: parsed,
    type: Array.isArray(parsed) ? "array" : "object",
  };
}