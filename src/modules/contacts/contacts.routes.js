import * as controller from "./contacts.controller.js";
import * as schema from "./contacts.schema.js";

export default async function contactsRoutes(fastify) {
  fastify.post("/sync", {
    config: {
      rateLimit: false,
      // rateLimit: {
      //   max: 20,
      //   timeWindow: "1 hour",
      //   keyGenerator: (req) => req.user?.userId || req.ip,
      // },
    },
    preHandler: [fastify.authenticate],
    schema: schema.syncSchema,
    handler: controller.syncHandler,
  });

  fastify.get("/trusted", {
    preHandler: [fastify.authenticate],
    handler: controller.trustedHandler,
  });

  fastify.patch("/:userId/hidden", {
    preHandler: [fastify.authenticate],
    schema: schema.hideSchema,
    handler: controller.hideHandler,
  });

  fastify.delete("/", {
    preHandler: [fastify.authenticate],
    handler: controller.deleteHandler,
  });
}
