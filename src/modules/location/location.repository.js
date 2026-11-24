export const isDriverOfDrivingRide = async (fastify, rideId, userId) => {
  const { rowCount } = await fastify.db.query(
    `SELECT 1 FROM rides
      WHERE id = $1::uuid AND driver_id = $2::uuid AND status = 'driving'`,
    [rideId, userId],
  );
  return rowCount > 0;
};

// A passenger can watch while the ride is driving, they have a booking,
// they have not cancelled or been dropped off, and nobody has blocked the other.
export const canWatchRide = async (fastify, rideId, userId) => {
  const { rowCount } = await fastify.db.query(
    `SELECT 1
       FROM rides r
       JOIN ride_passengers rp ON rp.ride_id = r.id
      WHERE r.id = $1::uuid
        AND r.status = 'driving'
        AND rp.passenger_id = $2::uuid
        AND rp.cancelled_at IS NULL
        AND rp.dropped_off_at IS NULL
        AND (rp.status = 'accepted' OR rp.picked_up_at IS NOT NULL)
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
           WHERE (b.blocker_id = $2::uuid AND b.blocked_id = r.driver_id)
              OR (b.blocker_id = r.driver_id AND b.blocked_id = $2::uuid))`,
    [rideId, userId],
  );
  return rowCount > 0;
};

// Inserts only if this user is the driver and the ride is 'driving'.
// Returns true if a row was saved.
export const insertUpdate = async (fastify, rideId, driverId, p) => {
  const { rowCount } = await fastify.db.query(
    `INSERT INTO ride_location_updates
       (ride_id, driver_id, geog, heading_degrees, speed_mps,
        accuracy_meters, battery_percent, captured_at)
     SELECT r.id, r.driver_id,
            ST_SetSRID(ST_MakePoint($3::float8, $4::float8), 4326)::geography,
            $5::numeric, $6::numeric, $7::numeric, $8::smallint, $9::timestamptz
       FROM rides r
      WHERE r.id = $1::uuid AND r.driver_id = $2::uuid AND r.status = 'driving'`,
    [
      rideId,
      driverId,
      p.lng,
      p.lat,
      p.heading,
      p.speed,
      p.accuracy,
      p.battery,
      p.capturedAt,
    ],
  );
  return rowCount > 0;
};

// numeric columns come back from Postgres as strings, so cast them to float8
export const getLatest = async (fastify, rideId) => {
  const { rows } = await fastify.db.query(
    `SELECT ST_Y(geog::geometry)      AS lat,
            ST_X(geog::geometry)      AS lng,
            heading_degrees::float8   AS heading,
            speed_mps::float8         AS speed_mps,
            accuracy_meters::float8   AS accuracy_m,
            captured_at               AS recorded_at
       FROM ride_location_updates
      WHERE ride_id = $1::uuid
      ORDER BY captured_at DESC
      LIMIT 1`,
    [rideId],
  );
  return rows[0] || null;
};

// For a cleanup job later
export const deleteOlderThan = async (fastify, days) => {
  const { rowCount } = await fastify.db.query(
    `DELETE FROM ride_location_updates
      WHERE captured_at < now() - ($1::int * interval '1 day')`,
    [days],
  );
  return rowCount;
};
