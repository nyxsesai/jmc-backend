import * as controller from "./rides.controller.js";
import * as schema from "./rides.schema.js";

export default async function ridesRoutes(fastify) {
  fastify.post("/", {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: "1 hour",
        keyGenerator: (req) => req.user?.userId || req.ip,
      },
    },
    preHandler: [fastify.authenticate],
    schema: schema.createRideSchema,
    handler: controller.createHandler,
  });

  fastify.get("/mine", {
    preHandler: [fastify.authenticate],
    schema: schema.listMineSchema,
    handler: controller.mineHandler,
  });

  fastify.get("/search", {
    preHandler: [fastify.authenticate],
    schema: schema.searchRidesSchema,
    handler: controller.searchHandler,
  });

  fastify.patch("/:id", {
    preHandler: [fastify.authenticate],
    schema: schema.updateRideSchema,
    handler: controller.updateHandler,
  });

  fastify.post("/:id/cancel", {
    preHandler: [fastify.authenticate],
    schema: schema.cancelRideSchema,
    handler: controller.cancelHandler,
  });

  fastify.post("/:id/start", {
    preHandler: [fastify.authenticate],
    schema: schema.cancelRideSchema,
    handler: controller.startHandler,
  });

  fastify.post("/:id/complete", {
    preHandler: [fastify.authenticate],
    schema: schema.cancelRideSchema,
    handler: controller.completeHandler,
  });
}
