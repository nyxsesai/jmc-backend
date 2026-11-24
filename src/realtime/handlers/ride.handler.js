import { EVENTS } from "../events.js";
import { send, joinRoom, leaveRoom } from "../socket.rooms.js";
import * as service from "../../modules/location/location.service.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (socket, message) => send(socket, { type: EVENTS.ERROR, message });

export const handleLeave = (socket) => leaveRoom(socket);

export const handleJoin = async (fastify, socket, msg) => {
  const { userId } = socket.ctx;
  if (!UUID_RE.test(msg.ride_id || "")) return fail(socket, "Invalid ride_id");

  leaveRoom(socket); // one ride per socket

  if (msg.as === "driver") {
    const ok = await service.canSend(fastify, msg.ride_id, userId);
    if (socket.ctx.closed) return; // socket closed during the lookup
    if (!ok) return fail(socket, "Not allowed");
    socket.ctx.role = "driver";
    socket.ctx.rideId = msg.ride_id;
    return send(socket, { type: EVENTS.JOINED, as: "driver" });
  }

  if (msg.as === "passenger") {
    const ok = await service.canWatch(fastify, msg.ride_id, userId);
    if (socket.ctx.closed) return; // socket closed during the lookup
    if (!ok) return fail(socket, "Not allowed");
    joinRoom(msg.ride_id, socket);
    send(socket, { type: EVENTS.JOINED, as: "passenger" });

    // Send the last known position straight away
    const last = await service.getLatest(fastify, msg.ride_id);
    if (socket.ctx.closed) return leaveRoom(socket); // closed while loading
    if (last) send(socket, { type: EVENTS.LOCATION, ...last });
    return;
  }

  return fail(socket, "as must be 'driver' or 'passenger'");
};
