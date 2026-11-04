const FIELDS =
  "id, label, make, model, color, plate_encrypted, total_seats, is_active, created_at, updated_at";

export const countByUser = async (fastify, userId) => {
  const { rows } = await fastify.db.query(
    "SELECT count(*)::int AS n FROM vehicles WHERE user_id = $1",
    [userId],
  );
  return rows[0].n;
};

export const insert = async (fastify, userId, v) => {
  const { rows } = await fastify.db.query(
    `INSERT INTO vehicles (user_id, label, make, model, color, plate_encrypted, total_seats)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${FIELDS}`,
    [userId, v.label, v.make, v.model, v.color, v.plateEncrypted, v.totalSeats],
  );
  return rows[0];
};

export const listByUser = async (fastify, userId) => {
  const { rows } = await fastify.db.query(
    `SELECT ${FIELDS} FROM vehicles
      WHERE user_id = $1
      ORDER BY is_active DESC, created_at DESC`,
    [userId],
  );
  return rows;
};

export const findOwn = async (fastify, id, userId) => {
  const { rows } = await fastify.db.query(
    `SELECT ${FIELDS} FROM vehicles WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] || null;
};

export const update = async (fastify, id, userId, f) => {
  const { rows } = await fastify.db.query(
    `UPDATE vehicles
        SET label           = COALESCE($3, label),
            make            = COALESCE($4, make),
            model           = COALESCE($5, model),
            color           = COALESCE($6, color),
            plate_encrypted = COALESCE($7::bytea, plate_encrypted),
            total_seats     = COALESCE($8::int, total_seats),
            is_active       = COALESCE($9::boolean, is_active),
            updated_at      = now()
      WHERE id = $1 AND user_id = $2
      RETURNING ${FIELDS}`,
    [
      id,
      userId,
      f.label,
      f.make,
      f.model,
      f.color,
      f.plateEncrypted,
      f.totalSeats,
      f.isActive,
    ],
  );
  return rows[0] || null;
};

// Is this vehicle used by a ride that is still open or running?
export const hasLiveRides = async (fastify, vehicleId) => {
  const { rowCount } = await fastify.db.query(
    `SELECT 1 FROM rides
      WHERE vehicle_id = $1 AND status IN ('published', 'driving')
      LIMIT 1`,
    [vehicleId],
  );
  return rowCount > 0;
};

export const remove = async (fastify, id, userId) => {
  const { rows } = await fastify.db.query(
    "DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId],
  );
  return rows[0] || null;
};
