// AES-256-GCM encryption for sensitive fields (e.g., phone numbers)
import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// ─── Validate key at startup ───
if (env.PHONE_ENCRYPTION_KEY?.length !== 64) {
  throw new Error("PHONE_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
}

const ENCRYPTION_KEY = Buffer.from(env.PHONE_ENCRYPTION_KEY, "hex");

// ─── Encrypt a string → Buffer ───
export const encrypt = (plaintext) => {
  if (!plaintext) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Storage format: IV || AuthTag || Ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
};

// ─── Decrypt Buffer → string ───
export const decrypt = (buffer) => {
  if (!buffer) return null;

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
