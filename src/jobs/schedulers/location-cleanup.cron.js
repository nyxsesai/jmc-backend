// src/jobs/schedulers/location-cleanup.cron.js
import * as locationRepo from "../../modules/location/location.repository.js";

// How long to keep GPS history. Decide the real number with your privacy policy.
const RETENTION_DAYS = Math.max(
  1, // never below 1, so a bad value can't wipe the whole table
  Number.parseInt(process.env.LOCATION_RETENTION_DAYS, 10) || 7,
);
const RUN_EVERY_MS = 24 * 60 * 60 * 1000; // once a day

export const startLocationCleanupCron = (fastify) => {
  const purge = async () => {
    try {
      const deleted = await locationRepo.deleteOlderThan(
        fastify,
        RETENTION_DAYS,
      );
      if (deleted > 0) {
        fastify.log.info(
          `Deleted ${deleted} location rows older than ${RETENTION_DAYS} days.`,
        );
      }
    } catch (err) {
      fastify.log.error({ err }, "Failed to clean up old locations");
    }
  };

  // Run once on startup, then daily
  purge();
  const timer = setInterval(purge, RUN_EVERY_MS);
  timer.unref(); // don't keep the process alive just for this timer
  fastify.addHook("onClose", async () => clearInterval(timer));

  fastify.log.info(
    `Location cleanup cron started (keeping ${RETENTION_DAYS} days).`,
  );
};
