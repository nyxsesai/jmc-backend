// src/jobs/schedulers/ride-expiry.cron.js

export const startRideExpiryCron = (fastify) => {
  const expireOldRides = async () => {
    try {
      const result = await fastify.db.query(`
        UPDATE rides
        SET status = 'expired', updated_at = now()
        WHERE status = 'published' 
          AND departure_at < now() - interval '2 hours'
      `);

      if (result.rowCount > 0) {
        fastify.log.info(`Auto-expired ${result.rowCount} missed rides.`);
      }
    } catch (err) {
      fastify.log.error("Failed to expire rides:", err);
    }
  };

  // Run immediately on startup
  expireOldRides();

  // Run every 1 hour
  setInterval(expireOldRides, 60 * 60 * 1000);

  fastify.log.info("Ride Expiry Cron Job started.");
};
