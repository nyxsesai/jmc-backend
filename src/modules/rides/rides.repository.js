const RIDE_FIELDS = `
  r.id, r.status, r.departure_at, r.total_seats, r.seats_available,
  r.vehicle_id, r.origin_place_id, r.destination_place_id,
  ST_Y(r.origin_geog::geometry)      AS origin_lat,
  ST_X(r.origin_geog::geometry)      AS origin_lng,
  ST_Y(r.destination_geog::geometry) AS destination_lat,
  ST_X(r.destination_geog::geometry) AS destination_lng,
  r.preferences, r.notes_ciphertext, r.created_at, r.updated_at`;

export const findDriverVehicle = async (fastify, userId, vehicleId) => {
  const { rows } = await fastify.db.query(
    `SELECT id, total_seats FROM vehicles
      WHERE user_id = $1 AND is_active = true
        AND ($2::uuid IS NULL OR id = $2::uuid)
      ORDER BY id
      LIMIT 1`,
    [userId, vehicleId || null],
  );
  return rows[0] || null;
};

export const getVehicleSeats = async (fastify, vehicleId) => {
  if (!vehicleId) return null;
  const { rows } = await fastify.db.query(
    "SELECT total_seats FROM vehicles WHERE id = $1",
    [vehicleId],
  );
  return rows[0] ? rows[0].total_seats : null;
};

// How many of these place ids belong to this user?
export const countOwnPlaces = async (fastify, userId, placeIds) => {
  const { rows } = await fastify.db.query(
    "SELECT count(*)::int AS n FROM places WHERE user_id = $1 AND id = ANY($2::uuid[])",
    [userId, placeIds],
  );
  return rows[0].n;
};

// Another published/driving ride by the same driver near this departure time?
export const hasOverlap = async (
  fastify,
  driverId,
  departureAt,
  windowMinutes,
  excludeId = null,
) => {
  const { rowCount } = await fastify.db.query(
    `SELECT 1 FROM rides
      WHERE driver_id = $1
        AND status IN ('published', 'driving')
        AND ($4::uuid IS NULL OR id <> $4::uuid)
        AND departure_at BETWEEN $2::timestamptz - ($3::int * interval '1 minute')
                             AND $2::timestamptz + ($3::int * interval '1 minute')
      LIMIT 1`,
    [driverId, departureAt, windowMinutes, excludeId],
  );
  return rowCount > 0;
};

export const insertRide = async (fastify, r) => {
  const { rows } = await fastify.db.query(
    `WITH route AS (
       SELECT ST_SetSRID(ST_GeomFromGeoJSON($9::text), 4326)::geography AS g
     )
     INSERT INTO rides (
       driver_id, vehicle_id, origin_place_id, destination_place_id,
       origin_geog, destination_geog, route_geog, corridor_geog,
       departure_at, total_seats, seats_available, preferences, notes_ciphertext
     )
     SELECT
       $1::uuid, $2::uuid, $3::uuid, $4::uuid,
       ST_SetSRID(ST_MakePoint($5::float8, $6::float8), 4326)::geography,
       ST_SetSRID(ST_MakePoint($7::float8, $8::float8), 4326)::geography,
       route.g,
       ST_Buffer(route.g, $10::float8)::geography,
       $11::timestamptz, $12::int, $12::int, $13::jsonb, $14::bytea
     FROM route
     RETURNING id, status, departure_at, total_seats, seats_available, vehicle_id, created_at`,
    [
      r.driverId,
      r.vehicleId,
      r.originPlaceId,
      r.destinationPlaceId,
      r.origin.lng,
      r.origin.lat,
      r.destination.lng,
      r.destination.lat,
      JSON.stringify({ type: "LineString", coordinates: r.route }),
      r.corridorMeters,
      r.departureAt,
      r.totalSeats,
      JSON.stringify(r.preferences),
      r.notesCiphertext,
    ],
  );
  return rows[0];
};

export const listMine = async (fastify, driverId, scope) => {
  const filter =
    scope === "past"
      ? "(r.status IN ('completed','cancelled','expired') OR r.departure_at < now() - interval '2 hours')"
      : "(r.status IN ('draft','published','driving') AND r.departure_at >= now() - interval '2 hours')";
  const order = scope === "past" ? "DESC" : "ASC";
  const { rows } = await fastify.db.query(
    `SELECT ${RIDE_FIELDS}
       FROM rides r
      WHERE r.driver_id = $1 AND ${filter}
      ORDER BY r.departure_at ${order}
      LIMIT 50`,
    [driverId],
  );
  return rows;
};

export const findOwnRide = async (fastify, rideId, driverId) => {
  const { rows } = await fastify.db.query(
    `SELECT ${RIDE_FIELDS} FROM rides r WHERE r.id = $1 AND r.driver_id = $2`,
    [rideId, driverId],
  );
  return rows[0] || null;
};

// Only a published ride with nobody booked can be edited
export const updateRide = async (fastify, rideId, driverId, f) => {
  const { rows } = await fastify.db.query(
    `UPDATE rides
        SET departure_at     = COALESCE($3::timestamptz, departure_at),
            total_seats      = COALESCE($4::int, total_seats),
            seats_available  = COALESCE($4::int, seats_available),
            preferences      = COALESCE($5::jsonb, preferences),
            notes_ciphertext = COALESCE($6::bytea, notes_ciphertext),
            updated_at       = now()
      WHERE id = $1 AND driver_id = $2
        AND status = 'published'
        AND seats_available = total_seats
      RETURNING id, status, departure_at, total_seats, seats_available`,
    [
      rideId,
      driverId,
      f.departureAt,
      f.totalSeats,
      f.preferences ? JSON.stringify(f.preferences) : null,
      f.notesCiphertext,
    ],
  );
  return rows[0] || null;
};

export const cancelRide = async (fastify, rideId, driverId) => {
  const { rows } = await fastify.db.query(
    `UPDATE rides
        SET status = 'cancelled', updated_at = now()
      WHERE id = $1 AND driver_id = $2 AND status IN ('draft', 'published')
      RETURNING id, status`,
    [rideId, driverId],
  );
  return rows[0] || null;
};

export const startRide = async (fastify, rideId, driverId) => {
  const { rows } = await fastify.db.query(
    `UPDATE rides
        SET status = 'driving', started_at = now(), updated_at = now()
      WHERE id = $1 AND driver_id = $2 AND status = 'published'
      RETURNING id, status, started_at`,
    [rideId, driverId],
  );
  return rows[0] || null;
};

export const completeRide = async (fastify, rideId, driverId) => {
  const { rows } = await fastify.db.query(
    `UPDATE rides
        SET status = 'completed', ended_at = now(), updated_at = now()
      WHERE id = $1 AND driver_id = $2 AND status = 'driving'
      RETURNING id, status, ended_at`,
    [rideId, driverId],
  );
  return rows[0] || null;
};

export const findAvailableRides = async (
  fastify,
  passengerId,
  pickup,
  dropoff,
  radiusMeters = 1000,
) => {
  const { rows } = await fastify.db.query(
    `WITH passenger_search AS (
       SELECT 
         ST_SetSRID(ST_MakePoint($2::float8, $3::float8), 4326)::geography AS pickup_geog,
         ST_SetSRID(ST_MakePoint($4::float8, $5::float8), 4326)::geography AS dropoff_geog
     )
     SELECT 
       r.id, r.status, r.departure_at, r.total_seats, r.seats_available,
       r.vehicle_id, r.preferences, r.created_at,
       ST_Y(r.origin_geog::geometry)      AS origin_lat,
       ST_X(r.origin_geog::geometry)      AS origin_lng,
       ST_Y(r.destination_geog::geometry) AS destination_lat,
       ST_X(r.destination_geog::geometry) AS destination_lng,
       u.id AS driver_id,
       u.full_name AS driver_name,
       round(ST_Distance(r.corridor_geog, s.pickup_geog)) AS pickup_distance_m
     FROM rides r
     JOIN users u ON u.id = r.driver_id
     JOIN user_contacts uc ON uc.matched_user_id = r.driver_id AND uc.owner_id = $1::uuid AND uc.is_hidden = false
     CROSS JOIN passenger_search s
     WHERE r.status = 'published'
       AND r.departure_at > now()
       AND r.seats_available > 0
       AND ST_DWithin(r.corridor_geog, s.pickup_geog, $6::float8)
       AND ST_DWithin(r.destination_geog, s.dropoff_geog, 5000)
       AND NOT EXISTS (
         SELECT 1 FROM blocks b 
          WHERE (b.blocker_id = $1::uuid AND b.blocked_id = r.driver_id)
             OR (b.blocker_id = r.driver_id AND b.blocked_id = $1::uuid)
       )
     ORDER BY r.departure_at ASC
     LIMIT 20`,
    [
      passengerId,
      pickup.lng,
      pickup.lat,
      dropoff.lng,
      dropoff.lat,
      radiusMeters,
    ],
  );
  return rows;
};
