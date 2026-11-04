import { encrypt, decrypt } from "../../security/encryption.js";
import { ApiError } from "../../utils/apiError.js";
import * as authRepo from "../auth/auth.repository.js";
import * as repo from "./rides.repository.js";

const CORRIDOR_METERS = 500; // how far from the route a passenger can be picked up
const OVERLAP_MINUTES = 60; // a driver can't publish two rides within this window
const PAST_GRACE_MS = 5 * 60 * 1000;

const parseFuture = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime()))
    throw ApiError.badRequest("departure_at is not a valid date");
  if (d.getTime() < Date.now() - PAST_GRACE_MS)
    throw ApiError.badRequest("departure_at must be in the future");
  return d.toISOString();
};

const withNotes = (ride) => {
  const { notes_ciphertext, ...rest } = ride;
  let notes = null;
  if (notes_ciphertext) {
    try {
      notes = decrypt(notes_ciphertext);
    } catch {
      notes = null;
    }
  }
  return { ...rest, notes };
};

export const createRide = async (fastify, userId, body) => {
  const user = await authRepo.findUserById(fastify, userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.active_role !== "driver") {
    throw ApiError.badRequest("Switch to the driver role to publish a ride");
  }

  const { origin, destination } = body;
  if (origin.lat === destination.lat && origin.lng === destination.lng) {
    throw ApiError.badRequest("Origin and destination must be different");
  }

  const departureAt = parseFuture(body.departure_at);

  const vehicle = await repo.findDriverVehicle(
    fastify,
    userId,
    body.vehicle_id,
  );
  if (!vehicle)
    throw ApiError.badRequest("Add an active vehicle before publishing a ride");

  // Saved places must be the driver's own
  const placeIds = [
    ...new Set(
      [body.origin_place_id, body.destination_place_id].filter(Boolean),
    ),
  ];
  if (
    placeIds.length &&
    (await repo.countOwnPlaces(fastify, userId, placeIds)) !== placeIds.length
  ) {
    throw ApiError.badRequest("Place not found");
  }

  // Seats default to the vehicle's seats and can't exceed them
  const totalSeats = body.total_seats ?? vehicle.total_seats;
  if (totalSeats > vehicle.total_seats) {
    throw ApiError.badRequest(
      `Your vehicle has only ${vehicle.total_seats} seats`,
    );
  }

  if (await repo.hasOverlap(fastify, userId, departureAt, OVERLAP_MINUTES)) {
    throw ApiError.badRequest("You already have a ride around this time");
  }

  // Use the maps route if the app sent one, otherwise a straight line
  const route =
    body.route && body.route.length >= 2
      ? body.route
      : [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ];

  const ride = await repo.insertRide(fastify, {
    driverId: userId,
    vehicleId: vehicle.id,
    originPlaceId: body.origin_place_id || null,
    destinationPlaceId: body.destination_place_id || null,
    origin,
    destination,
    route,
    corridorMeters: CORRIDOR_METERS,
    departureAt,
    totalSeats,
    preferences: body.preferences ?? {},
    notesCiphertext: body.notes ? encrypt(body.notes) : null,
  });
  return ride;
};

export const listMine = async (fastify, userId, scope = "upcoming") => {
  const rides = await repo.listMine(fastify, userId, scope);
  return { rides: rides.map(withNotes) };
};

export const updateRide = async (fastify, userId, rideId, body) => {
  const existing = await repo.findOwnRide(fastify, rideId, userId);
  if (!existing) throw ApiError.notFound("Ride not found");

  if (body.total_seats !== undefined) {
    const vehicleSeats = await repo.getVehicleSeats(
      fastify,
      existing.vehicle_id,
    );
    if (vehicleSeats !== null && body.total_seats > vehicleSeats) {
      throw ApiError.badRequest(`Your vehicle has only ${vehicleSeats} seats`);
    }
  }

  let departureAt = null;
  if (body.departure_at) {
    departureAt = parseFuture(body.departure_at);
    if (
      await repo.hasOverlap(
        fastify,
        userId,
        departureAt,
        OVERLAP_MINUTES,
        rideId,
      )
    ) {
      throw ApiError.badRequest("You already have a ride around this time");
    }
  }

  const updated = await repo.updateRide(fastify, rideId, userId, {
    departureAt,
    totalSeats: body.total_seats ?? null,
    preferences: body.preferences ?? null,
    notesCiphertext: body.notes ? encrypt(body.notes) : null,
  });
  if (!updated) {
    throw ApiError.badRequest(
      "This ride can't be edited (already booked, started, or cancelled)",
    );
  }
  return updated;
};

export const cancelRide = async (fastify, userId, rideId) => {
  const existing = await repo.findOwnRide(fastify, rideId, userId);
  if (!existing) throw ApiError.notFound("Ride not found");

  const cancelled = await repo.cancelRide(fastify, rideId, userId);
  if (!cancelled) {
    throw ApiError.badRequest(
      "Only a draft or published ride can be cancelled",
    );
  }
  return cancelled;
};

export const startRide = async (fastify, userId, rideId) => {
  const existing = await repo.findOwnRide(fastify, rideId, userId);
  if (!existing) throw ApiError.notFound("Ride not found");

  const started = await repo.startRide(fastify, rideId, userId);
  if (!started) {
    throw ApiError.badRequest("Only a published ride can be started");
  }
  return started;
};

export const completeRide = async (fastify, userId, rideId) => {
  const existing = await repo.findOwnRide(fastify, rideId, userId);
  if (!existing) throw ApiError.notFound("Ride not found");

  const completed = await repo.completeRide(fastify, rideId, userId);
  if (!completed) {
    throw ApiError.badRequest("Only a driving ride can be completed");
  }
  return completed;
};

export const searchRides = async (fastify, userId, query) => {
  const pickup = { lat: query.pickup_lat, lng: query.pickup_lng };
  const dropoff = { lat: query.dropoff_lat, lng: query.dropoff_lng };
  const radius = query.radius_meters || 1000;

  const rides = await repo.findAvailableRides(
    fastify,
    userId,
    pickup,
    dropoff,
    radius,
  );
  return { rides };
};
