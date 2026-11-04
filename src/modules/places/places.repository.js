const SELECT = `
  SELECT p.id, p.label, p.address_preview, p.address_encrypted,
         ST_Y(p.geog::geometry) AS lat,
         ST_X(p.geog::geometry) AS lng,
         COALESCE(u.home_place_id = p.id, false) AS is_home,
         p.created_at, p.updated_at
    FROM places p
    JOIN users u ON u.id = p.user_id`;

export const countByUser = async (fastify, userId) => {
  const { rows } = await fastify.db.query(
    "SELECT count(*)::int AS n FROM places WHERE user_id = $1",
    [userId],
  );
  return rows[0].n;
};

export const insert = async (fastify, userId, p) => {
  const { rows } = await fastify.db.query(
    `INSERT INTO places (user_id, label, address_preview, address_encrypted, geog)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5::float8, $6::float8), 4326)::geography)
     RETURNING id`,
    [userId, p.label, p.addressPreview, p.addressEncrypted, p.lng, p.lat],
  );
  return rows[0].id;
};

export const listByUser = async (fastify, userId) => {
  const { rows } = await fastify.db.query(
    `${SELECT} WHERE p.user_id = $1 ORDER BY is_home DESC, p.created_at DESC`,
    [userId],
  );
  return rows;
};

export const findOwn = async (fastify, id, userId) => {
  const { rows } = await fastify.db.query(
    `${SELECT} WHERE p.id = $1 AND p.user_id = $2`,
    [id, userId],
  );
  return rows[0] || null;
};

export const update = async (fastify, id, userId, f) => {
  const { rowCount } = await fastify.db.query(
    `UPDATE places
        SET label             = COALESCE($3, label),
            address_preview   = COALESCE($4, address_preview),
            address_encrypted = COALESCE($5::bytea, address_encrypted),
            geog = CASE WHEN $6::float8 IS NULL OR $7::float8 IS NULL THEN geog
                        ELSE ST_SetSRID(ST_MakePoint($7::float8, $6::float8), 4326)::geography END,
            updated_at        = now()
      WHERE id = $1 AND user_id = $2`,
    [id, userId, f.label, f.addressPreview, f.addressEncrypted, f.lat, f.lng],
  );
  return rowCount > 0;
};

export const remove = async (fastify, id, userId) => {
  const { rowCount } = await fastify.db.query(
    "DELETE FROM places WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return rowCount > 0;
};

export const setHome = async (fastify, userId, placeId) => {
  const { rowCount } = await fastify.db.query(
    `UPDATE users SET home_place_id = $2, updated_at = now()
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM places WHERE id = $2 AND user_id = $1)`,
    [userId, placeId],
  );
  return rowCount > 0;
};

export const clearHome = async (fastify, userId) => {
  await fastify.db.query(
    "UPDATE users SET home_place_id = NULL, updated_at = now() WHERE id = $1",
    [userId],
  );
};
