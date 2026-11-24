import { EVENTS } from "../events.js";
import { send, broadcastToRide } from "../socket.rooms.js";
import * as service from "../../modules/location/location.service.js";

const MIN_INTERVAL_MS = 2000; // ignore anything faster than one update per 2 s

export const handleLocation = async (fastify, socket, msg) => {
  const { userId, rideId, role } = socket.ctx;
  if (role !== "driver" || !rideId) {
    return send(socket, {
      type: EVENTS.ERROR,
      message: "Join as driver first",
    });
  }

  const now = Date.now();
  if (now - (socket.ctx.lastLocationAt || 0) < MIN_INTERVAL_MS) return;
  socket.ctx.lastLocationAt = now;

  const update = await service.recordLocation(fastify, rideId, userId, msg);

  if (!update) {
    // Ride is no longer 'driving' (completed or cancelled)
    return send(socket, {
      type: EVENTS.ERROR,
      message: "Ride is not in progress",
    });
  }

  fastify.log.info(
    ` GPS Update received for Ride ${rideId} from Driver ${userId}. Lat: ${update.lat}, Lng: ${update.lng}`,
  );
  broadcastToRide(rideId, { type: EVENTS.LOCATION, ...update });
};
