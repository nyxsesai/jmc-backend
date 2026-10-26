import { hmacPhone } from "../../security/hmac.js";
import { ApiError } from "../../utils/apiError.js";
import { normalizePhone } from "../../utils/phone.js";
import * as repo from "./contacts.repository.js";

export const syncContacts = async (fastify, userId, phones) => {
  // normalize -> dedupe -> hash (raw numbers are never stored or logged)
  const hexes = new Set();
  for (const raw of phones) {
    const e164 = normalizePhone(raw);
    if (e164) hexes.add(hmacPhone(e164).toString("hex"));
  }
  const list = [...hexes];

  if (list.length === 0) {
    await repo.touchContactsSynced(fastify, userId);
    return { received: phones.length, matched: 0, users: [] };
  }

  await repo.upsertContacts(fastify, userId, list);
  await repo.linkMatches(fastify, userId);
  await repo.touchContactsSynced(fastify, userId);

  const users = await repo.findMatchesByHexes(fastify, userId, list);
  return { received: phones.length, matched: users.length, users };
};

export const getTrusted = async (fastify, userId) => {
  const users = await repo.findTrusted(fastify, userId);
  return { users };
};

export const hideContact = async (fastify, userId, contactUserId, hidden) => {
  const updated = await repo.setHidden(fastify, userId, contactUserId, hidden);
  if (!updated) throw ApiError.notFound("Contact not found");
  return { hidden };
};

export const deleteContacts = async (fastify, userId) => {
  await repo.deleteAllContacts(fastify, userId);
  return { deleted: true };
};
