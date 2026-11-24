import { ApiError } from "../../utils/apiError.js";
import * as repo from "./location.repository.js";

const MAX_CLOCK_SKEW_MS = 2 * 60 * 1000;
const SAVE_MIN_INTERVAL_MS = 15000; // never save more often than this
const SAVE_HEARTBEAT_MS = 60000; // save at least this often, even when parked
const SAVE_MIN_MOVE_M = 25; // or when the car moved this far

const lastSavedPoint = new Map(); // rideId -> { lat, lng, at }
const latestByRide = new Map(); // rideId -> latest payload (for reconnecting passengers)

const bounded = (v, min, max) =>
  Number.isFinite(v) && v >= min && v <= max ? v : null;

const metresBetween = (a, b) => {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const shouldSave = (rideId, point, now) => {
  const prev = lastSavedPoint.get(rideId);
  if (!prev) return true; // first update is always saved (also verifies the driver)
  const elapsed = now - prev.at;
  if (elapsed >= SAVE_HEARTBEAT_MS) return true;
  return (
    elapsed >= SAVE_MIN_INTERVAL_MS &&
    metresBetween(prev, point) >= SAVE_MIN_MOVE_M
  );
};

// Call when a ride is completed or cancelled
export const forgetRide = (rideId) => {
  lastSavedPoint.delete(rideId);
  latestByRide.delete(rideId);
};

export const canSend = (fastify, rideId, userId) =>
  repo.isDriverOfDrivingRide(fastify, rideId, userId);

export const canWatch = (fastify, rideId, userId) =>
  repo.canWatchRide(fastify, rideId, userId);

export const getLatest = async (fastify, rideId) =>
  latestByRide.get(rideId) || repo.getLatest(fastify, rideId);

// Returns the payload to broadcast, or null when the ride is not in progress
export const recordLocation = async (fastify, rideId, userId, msg) => {
  const { lat, lng } = msg;
  const valid =
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180;
  if (!valid) throw ApiError.badRequest("Invalid coordinates");

  const now = Date.now();
  const ts =
    Number.isFinite(msg.ts) && Math.abs(msg.ts - now) < MAX_CLOCK_SKEW_MS
      ? msg.ts
      : now;

  const point = {
    lat,
    lng,
    heading: bounded(msg.heading, 0, 360),
    speed: bounded(msg.speed, 0, 1000),
    accuracy: bounded(msg.accuracy, 0, 99999),
    battery: Number.isInteger(msg.battery)
      ? bounded(msg.battery, 0, 100)
      : null,
    capturedAt: new Date(ts).toISOString(),
  };

  if (shouldSave(rideId, point, now)) {
    const saved = await repo.insertUpdate(fastify, rideId, userId, point);
    if (!saved) return null; // not the driver, or the ride is not 'driving'
    lastSavedPoint.set(rideId, { lat, lng, at: now });
  }

  const payload = {
    lat,
    lng,
    heading: point.heading,
    speed_mps: point.speed,
    accuracy_m: point.accuracy,
    recorded_at: point.capturedAt,
  };
  latestByRide.set(rideId, payload);
  return payload;
};

export const getRideLocation = async (fastify, userId, rideId) => {
  const allowed =
    (await repo.isDriverOfDrivingRide(fastify, rideId, userId)) ||
    (await repo.canWatchRide(fastify, rideId, userId));
  if (!allowed) throw ApiError.notFound("Ride not found");

  const location = await getLatest(fastify, rideId);
  if (!location) return { location: null, age_seconds: null };

  const age = Math.max(
    0,
    Math.round((Date.now() - new Date(location.recorded_at).getTime()) / 1000),
  );
  return { location, age_seconds: age };
};
