// HMAC-SHA256 hashing for lookup fields (e.g., phone lookups)
import crypto from "node:crypto";
import { env } from "../config/env.js";

// ─── Validate key at startup ───
if (env.PHONE_HMAC_SECRET?.length !== 64) {
  throw new Error("PHONE_HMAC_SECRET must be 64 hex chars (32 bytes)");
}

const HMAC_KEY = Buffer.from(env.PHONE_HMAC_SECRET, "hex");

// ─── Deterministic HMAC for lookups ───
export const hmacPhone = (phone) => {
  if (!phone) return null;
  return crypto.createHmac("sha256", HMAC_KEY).update(phone).digest();
};
