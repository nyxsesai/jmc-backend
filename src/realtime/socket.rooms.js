const rooms = new Map(); // rideId -> Set of passenger sockets

export const send = (socket, payload) => {
  if (socket.readyState === 1) socket.send(JSON.stringify(payload));
};

export const joinRoom = (rideId, socket) => {
  if (!rooms.has(rideId)) rooms.set(rideId, new Set());
  rooms.get(rideId).add(socket);
  socket.ctx.rideId = rideId;
  socket.ctx.role = "passenger";
};

export const leaveRoom = (socket) => {
  const { rideId } = socket.ctx;
  if (rideId && rooms.has(rideId)) {
    rooms.get(rideId).delete(socket);
    if (rooms.get(rideId).size === 0) rooms.delete(rideId);
  }
  socket.ctx.rideId = null;
  socket.ctx.role = null;
};

export const broadcastToRide = (rideId, payload) => {
  const room = rooms.get(rideId);
  if (!room) return;

  console.log(
    `[WebSocket] Broadcasting to ${room.size} passengers in ride ${rideId}`,
  );

  for (const s of room) {
    console.log("[WebSocket] Passenger socket state:", s.readyState);
    send(s, payload);
  }
};
