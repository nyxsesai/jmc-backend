import { encrypt, decrypt } from "../../security/encryption.js";
import { ApiError } from "../../utils/apiError.js";
import * as repo from "./places.repository.js";

const MAX_PLACES = 20;

// Owner-only responses: decrypt the full address, never return the ciphertext
const shape = (p) => {
  const { address_encrypted, ...rest } = p;
  let address = null;
  if (address_encrypted) {
    try {
      address = decrypt(address_encrypted);
    } catch {
      address = null;
    }
  }
  return { ...rest, address };
};

export const createPlace = async (fastify, userId, body) => {
  if ((await repo.countByUser(fastify, userId)) >= MAX_PLACES) {
    throw ApiError.badRequest(`You can save up to ${MAX_PLACES} places`);
  }
  const id = await repo.insert(fastify, userId, {
    label: body.label,
    addressPreview: body.address_preview ?? null,
    addressEncrypted: body.address ? encrypt(body.address) : null,
    lat: body.lat,
    lng: body.lng,
  });
  return shape(await repo.findOwn(fastify, id, userId));
};

export const listPlaces = async (fastify, userId) => {
  const places = await repo.listByUser(fastify, userId);
  return { places: places.map(shape) };
};

export const updatePlace = async (fastify, userId, id, body) => {
  if ((body.lat === undefined) !== (body.lng === undefined)) {
    throw ApiError.badRequest("Send both lat and lng to move a place");
  }
  const ok = await repo.update(fastify, id, userId, {
    label: body.label ?? null,
    addressPreview: body.address_preview ?? null,
    addressEncrypted: body.address ? encrypt(body.address) : null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
  });
  if (!ok) throw ApiError.notFound("Place not found");
  return shape(await repo.findOwn(fastify, id, userId));
};

export const deletePlace = async (fastify, userId, id) => {
  const ok = await repo.remove(fastify, id, userId);
  if (!ok) throw ApiError.notFound("Place not found");
  return { deleted: true };
};

export const setHome = async (fastify, userId, id) => {
  const ok = await repo.setHome(fastify, userId, id);
  if (!ok) throw ApiError.notFound("Place not found");
  return { home_place_id: id };
};

export const clearHome = async (fastify, userId) => {
  await repo.clearHome(fastify, userId);
  return { home_place_id: null };
};
