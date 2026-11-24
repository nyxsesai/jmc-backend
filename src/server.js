import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { startRideExpiryCron } from "./jobs/schedulers/ride-expiry.cron.js";
import { startLocationCleanupCron } from "./jobs/schedulers/location-cleanup.cron.js";

async function start() {
  try {
    const app = await buildApp();
    startRideExpiryCron(app);
    startLocationCleanupCron(app);
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`JMC Backend running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
