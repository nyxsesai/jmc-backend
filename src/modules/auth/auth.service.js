import { encrypt } from "../../security/encryption.js";
import { hmacPhone } from "../../security/hmac.js";
import { ApiError } from "../../utils/apiError.js";
import { signToken } from "../../utils/jwt.js";
import * as repo from "./auth.repository.js";

const normalizePhone = (phone) => {
  return phone.trim();
};

export const register = async (fastify, userId, { full_name, email }) => {
  const user = await repo.findUserById(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");

  const updated = await repo.updateUserProfile(fastify, userId, {
    full_name,
    email,
  });

  return sanitize(updated);
};

export const getMe = async (fastify, userId) => {
  const user = await repo.findUserWithSettings(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");
  return sanitize(user);
};

export const switchRole = async (fastify, userId, role) => {
  const user = await repo.findUserById(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");

  const updated = await repo.updateUserRole(fastify, userId, role);
  return sanitize(updated);
};

export const logout = async (fastify, userId) => {
  fastify.log.info(`User logged out: ${userId}`);
  return { logged_out: true };
};

const sanitize = (user) => {
  if (!user) return null;
  const { phone_e164_encrypted, phone_lookup_hmac, deleted_at, ...safe } = user;
  return safe;
};

export const verifyOtp = async (fastify, { idToken }) => {
  if (fastify.firebase?.auth) {
    throw ApiError.internal("Firebase not configured on server");
  }
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

  const phoneHmac = hmacPhone(phone);

  let user = await repo.findUserByFirebaseUid(fastify, firebaseUid);
  if (!user) user = await repo.findUserByPhoneHmac(fastify, phoneHmac);

  if (!user) {
    user = await repo.createUser(fastify, {
      firebaseUid,
      phoneEncrypted: encrypt(phone),
      phoneHmac,
    });
    await repo.createDefaultSettings(fastify, user.id);
    fastify.log.info(`New user (Firebase): ${user.id}`);
  } else {
    fastify.log.info(`Existing user login (Firebase): ${user.id}`);
  }

  const token = signToken({ userId: user.id, firebaseUid: user.firebase_uid });

  return {
    token,
    is_new_user: !user.profile_completed_at,
    user: sanitize(user),
  };
};
