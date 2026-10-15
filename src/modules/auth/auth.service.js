// Business logic for auth
import crypto from "crypto";
import { ApiError } from "../../utils/apiError.js";
import { signToken } from "../../utils/jwt.js";
import * as repo from "./auth.repository.js";

// ─── Helpers ───
const hashPhone = (phone) => {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET || "dev-secret")
    .update(phone)
    .digest();
};

const encryptPhone = (phone) => {
  // For now, store as buffer. Later use pgcrypto or app-level AES.
  return Buffer.from(phone, "utf8");
};

const normalizePhone = (phone) => {
  // Basic normalization — expect E.164 input like +919876543210
  return phone.trim();
};

// ─── Verify OTP (stub) ───
// export const verifyOtp = async (fastify, { phone, otp }) => {
//   const normalized = normalizePhone(phone);
//   const record = otpStore.get(normalized);

//   if (!record) throw ApiError.badRequest("No OTP request found for this phone");
//   if (Date.now() > record.expiresAt) {
//     otpStore.delete(normalized);
//     throw ApiError.badRequest("OTP expired");
//   }
//   if (record.otp !== otp) throw ApiError.badRequest("Invalid OTP");

//   otpStore.delete(normalized); // one-time use

//   // Find or create user
//   const phoneHmac = hashPhone(normalized);
//   let user = await repo.findUserByPhoneHmac(fastify, phoneHmac);

//   if (!user) {
//     // Generate a fake firebase UID for dev
//     // (In production, Firebase will give us the real UID)
//     const firebaseUid = `dev_${phoneHmac.toString("hex").slice(0, 16)}`;

//     user = await repo.createUser(fastify, {
//       firebaseUid,
//       phoneEncrypted: encryptPhone(normalized),
//       phoneHmac,
//     });

//     await repo.createDefaultSettings(fastify, user.id);
//     fastify.log.info(`New user created: ${user.id}`);
//   } else {
//     fastify.log.info(`Existing user login: ${user.id}`);
//   }

//   const token = signToken({ userId: user.id, firebaseUid: user.firebase_uid });

//   return {
//     token,
//     is_new_user: !user.profile_completed_at,
//     user: sanitize(user),
//   };
// };

// ─── Register (complete profile) ───
export const register = async (fastify, userId, { full_name, email }) => {
  const user = await repo.findUserById(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");

  const updated = await repo.updateUserProfile(fastify, userId, {
    full_name,
    email,
  });

  return sanitize(updated);
};

// ─── Me ───
export const getMe = async (fastify, userId) => {
  const user = await repo.findUserWithSettings(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");
  return sanitize(user);
};

// ─── Switch role ───
export const switchRole = async (fastify, userId, role) => {
  const user = await repo.findUserById(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");

  const updated = await repo.updateUserRole(fastify, userId, role);
  return sanitize(updated);
};

// ─── Logout (no-op for now) ───
export const logout = async (fastify, userId) => {
  // In production: revoke device FCM token, blacklist JWT, etc.
  fastify.log.info(`User logged out: ${userId}`);
  return { logged_out: true };
};

// ─── Sanitize user for API response ───
const sanitize = (user) => {
  if (!user) return null;
  const { phone_e164_encrypted, phone_lookup_hmac, deleted_at, ...safe } = user;
  return safe;
};

// ─── Verify OTP via Firebase ───
export const verifyOtp = async (fastify, { idToken }) => {
  if (!fastify.firebase || !fastify.firebase.auth) {
    throw ApiError.internal("Firebase not configured on server");
  }

  // 1. Verify idToken with Firebase
  let decoded;
  try {
    decoded = await fastify.firebase.auth.verifyIdToken(idToken);
  } catch (err) {
    fastify.log.error({ err }, "Firebase token verify failed");
    throw ApiError.unauthorized("Invalid Firebase token");
  }

  const phone = decoded.phone_number;
  const firebaseUid = decoded.uid;

  if (!phone) throw ApiError.badRequest("No phone number in Firebase token");

  // 2. Find or create user
  const phoneHmac = hashPhone(phone);

  let user = await repo.findUserByFirebaseUid(fastify, firebaseUid);
  if (!user) user = await repo.findUserByPhoneHmac(fastify, phoneHmac);

  if (!user) {
    user = await repo.createUser(fastify, {
      firebaseUid,
      phoneEncrypted: encryptPhone(phone),
      phoneHmac,
    });
    await repo.createDefaultSettings(fastify, user.id);
    fastify.log.info(`New user (Firebase): ${user.id}`);
  } else {
    fastify.log.info(`Existing user login (Firebase): ${user.id}`);
  }

  // 3. Issue OUR JWT
  const token = signToken({ userId: user.id, firebaseUid: user.firebase_uid });

  return {
    token,
    is_new_user: !user.profile_completed_at,
    user: sanitize(user),
  };
};
