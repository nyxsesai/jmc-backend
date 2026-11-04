import * as controller from "./places.controller.js";
import * as schema from "./places.schema.js";

export default async function placesRoutes(fastify) {
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    schema: schema.createPlaceSchema,
    handler: controller.createHandler,
  });

  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: controller.listHandler,
  });

  fastify.patch("/:id", {
    preHandler: [fastify.authenticate],
    schema: schema.updatePlaceSchema,
    handler: controller.updateHandler,
  });

  fastify.delete("/:id", {
    preHandler: [fastify.authenticate],
    schema: schema.placeIdSchema,
    handler: controller.deleteHandler,
  });

  // mark a saved place as the user's home (users.home_place_id)
  fastify.put("/:id/home", {
    preHandler: [fastify.authenticate],
    schema: schema.placeIdSchema,
    handler: controller.setHomeHandler,
  });

  fastify.delete("/home", {
    preHandler: [fastify.authenticate],
    handler: controller.clearHomeHandler,
  });
}
