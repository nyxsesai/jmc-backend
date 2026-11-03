import healthRoutes from "./health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

import contactsRoutes from "../modules/contacts/contacts.routes.js";
import ridesRoutes from "../modules/rides/rides.routes.js";
import placesRoutes from "../modules/places/places.routes.js";
import vehiclesRoutes from "../modules/vehicles/vehicles.routes.js";

export default async function registerRoutes(fastify) {
  // Root — friendly response instead of 404
  fastify.get("/", async () => ({
    name: "JMC Backend",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      db: "/api/v1/health/db",
      auth: "/api/v1/auth",
    },
  }));

  fastify.register(healthRoutes, { prefix: "/api/v1" });
  fastify.register(authRoutes, { prefix: "/api/v1/auth" });

  fastify.register(contactsRoutes, { prefix: "/api/v1/contacts" });
  fastify.register(ridesRoutes, { prefix: "/api/v1/rides" });
  fastify.register(placesRoutes, { prefix: "/api/v1/places" });
  fastify.register(vehiclesRoutes, { prefix: "/api/v1/vehicles" });
}
