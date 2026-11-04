import * as service from "./vehicles.service.js";
import { success } from "../../utils/response.js";

export const createHandler = async (request, reply) => {
  const result = await service.createVehicle(
    request.server,
    request.user.userId,
    request.body,
  );
  return reply.code(201).send(success(result, "Vehicle added"));
};

export const listHandler = async (request, reply) => {
  const result = await service.listVehicles(
    request.server,
    request.user.userId,
  );
  return reply.send(success(result));
};

export const updateHandler = async (request, reply) => {
  const result = await service.updateVehicle(
    request.server,
    request.user.userId,
    request.params.id,
    request.body,
  );
  return reply.send(success(result, "Vehicle updated"));
};

export const deleteHandler = async (request, reply) => {
  const result = await service.deleteVehicle(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result, "Vehicle deleted"));
};
