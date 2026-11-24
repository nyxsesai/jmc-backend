import { ApiError } from "../utils/apiError.js";
import { EVENTS } from "./events.js";
import { verifySocketToken } from "./socket.auth.js";
import { send } from "./socket.rooms.js";
import { handleJoin, handleLeave } from "./handlers/ride.handler.js";
import { handleLocation } from "./handlers/location.handler.js";

export default async function socketServer(fastify) {
  // Every 30 s, drop sockets that stopped answering pings
  const heartbeat = setInterval(() => {
    for (const c of fastify.websocketServer.clients) {
      if (c.isAlive === false) {
        c.terminate();
        continue;
      }
      c.isAlive = false;
      c.ping();
    }
  }, 30000);
  fastify.addHook("onClose", async () => clearInterval(heartbeat));

  // ws://host:3500/ws
  fastify.get("/ws", { websocket: true }, (conn) => {
    const socket = conn.socket ?? conn; // works on old and new @fastify/websocket
    socket.ctx = { userId: null, rideId: null, role: null, lastLocationAt: 0 };
    socket.isAlive = true;
    socket.on("pong", () => (socket.isAlive = true));

    // Must authenticate within 10 seconds
    const authTimer = setTimeout(
      () => socket.close(4401, "auth timeout"),
      10000,
    );

    const handleMessage = async (raw) => {
      if (socket.ctx.closed) return; // socket closed while this message waited

      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return send(socket, { type: EVENTS.ERROR, message: "Invalid JSON" });
      }

      try {
        if (msg.type === EVENTS.AUTH) {
          if (socket.ctx.userId) {
            return send(socket, {
              type: EVENTS.ERROR,
              message: "Already authenticated",
            });
          }

          socket.ctx.userId = verifySocketToken(msg.token);
          clearTimeout(authTimer);

          return send(socket, { type: EVENTS.AUTH_OK });
        }

        if (!socket.ctx.userId) return socket.close(4401, "unauthenticated");

        switch (msg.type) {
          case EVENTS.JOIN:
            return await handleJoin(fastify, socket, msg);
          case EVENTS.LEAVE:
            return handleLeave(socket);
          case EVENTS.LOCATION:
            return await handleLocation(fastify, socket, msg);
          default:
            return send(socket, {
              type: EVENTS.ERROR,
              message: "Unknown message type",
            });
        }
      } catch (err) {
        if (
          err.name === "JsonWebTokenError" ||
          err.name === "TokenExpiredError"
        ) {
          return socket.close(4401, "invalid token");
        }
        if (!(err instanceof ApiError))
          fastify.log.warn({ err }, "socket error");
        send(socket, {
          type: EVENTS.ERROR,
          message: err instanceof ApiError ? err.message : "Request failed",
        });
      }
    };

    // Process messages one at a time, in arrival order
    let queue = Promise.resolve();
    socket.on("message", (raw) => {
      queue = queue
        .then(() => handleMessage(raw))
        .catch((err) => fastify.log.warn({ err }, "socket message failed"));
    });
    socket.on("close", () => {
      socket.ctx.closed = true;
      clearTimeout(authTimer);
      handleLeave(socket);
    });
  });
}
