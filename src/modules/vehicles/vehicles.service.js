import { encrypt, decrypt } from "../../security/encryption.js";
import { ApiError } from "../../utils/apiError.js";
import * as repo from "./vehicles.repository.js";

const MAX_VEHICLES = 5;

const normalizePlate = (p) => p.toUpperCase().replace(/[\s-]/g, "");

// Owner-only responses: decrypt the plate, never return the raw ciphertext
const shape = (v) => {
  const { plate_encrypted, ...rest } = v;
  let plate = null;
  if (plate_encrypted) {
    try {
      plate = decrypt(plate_encrypted);
    } catch {
      plate = null;
    }
  }
  return { ...rest, plate };
};

export const createVehicle = async (fastify, userId, body) => {
  if ((await repo.countByUser(fastify, userId)) >= MAX_VEHICLES) {
    throw ApiError.badRequest(`You can add up to ${MAX_VEHICLES} vehicles`);
  }
  const vehicle = await repo.insert(fastify, userId, {
    label: body.label ?? null,
    make: body.make,
    model: body.model,
    color: body.color ?? null,
    plateEncrypted: body.plate ? encrypt(normalizePlate(body.plate)) : null,
    totalSeats: body.total_seats ?? 4,
  });
  return shape(vehicle);
};

export const listVehicles = async (fastify, userId) => {
  const vehicles = await repo.listByUser(fastify, userId);
  return { vehicles: vehicles.map(shape) };
};

export const updateVehicle = async (fastify, userId, id, body) => {
  const existing = await repo.findOwn(fastify, id, userId);
  if (!existing) throw ApiError.notFound("Vehicle not found");

  // Don't pull the car out from under a ride that is still open or running
  const touchesRides =
    body.is_active === false || body.total_seats !== undefined;
  if (touchesRides && (await repo.hasLiveRides(fastify, id))) {
    throw ApiError.badRequest(
      "This vehicle has a published or running ride. Cancel or finish it first.",
    );
  }

  const updated = await repo.update(fastify, id, userId, {
    label: body.label ?? null,
    make: body.make ?? null,
    model: body.model ?? null,
    color: body.color ?? null,
    plateEncrypted: body.plate ? encrypt(normalizePlate(body.plate)) : null,
    totalSeats: body.total_seats ?? null,
    isActive: body.is_active ?? null,
  });
  return shape(updated);
};

export const deleteVehicle = async (fastify, userId, id) => {
  const existing = await repo.findOwn(fastify, id, userId);
  if (!existing) throw ApiError.notFound("Vehicle not found");
  if (await repo.hasLiveRides(fastify, id)) {
    throw ApiError.badRequest(
      "This vehicle has a published or running ride. Cancel or finish it first.",
    );
  }
  await repo.remove(fastify, id, userId);
  return { deleted: true };
};
