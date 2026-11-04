import * as controller from "./vehicles.controller.js";
import * as schema from "./vehicles.schema.js";

export default async function vehiclesRoutes(fastify) {
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    schema: schema.createVehicleSchema,
    handler: controller.createHandler,
  });

  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: controller.listHandler,
  });

  fastify.patch("/:id", {
    preHandler: [fastify.authenticate],
    schema: schema.updateVehicleSchema,
    handler: controller.updateHandler,
  });

  fastify.delete("/:id", {
    preHandler: [fastify.authenticate],
    schema: schema.vehicleIdSchema,
    handler: controller.deleteHandler,
  });
}
