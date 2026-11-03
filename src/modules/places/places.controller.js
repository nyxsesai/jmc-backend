import * as service from "./places.service.js";
import { success } from "../../utils/response.js";

export const createHandler = async (request, reply) => {
  const result = await service.createPlace(
    request.server,
    request.user.userId,
    request.body,
  );
  return reply.code(201).send(success(result, "Place saved"));
};

export const listHandler = async (request, reply) => {
  const result = await service.listPlaces(request.server, request.user.userId);
  return reply.send(success(result));
};

export const updateHandler = async (request, reply) => {
  const result = await service.updatePlace(
    request.server,
    request.user.userId,
    request.params.id,
    request.body,
  );
  return reply.send(success(result, "Place updated"));
};

export const deleteHandler = async (request, reply) => {
  const result = await service.deletePlace(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result, "Place deleted"));
};

export const setHomeHandler = async (request, reply) => {
  const result = await service.setHome(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result, "Home place set"));
};

export const clearHomeHandler = async (request, reply) => {
  const result = await service.clearHome(request.server, request.user.userId);
  return reply.send(success(result, "Home place cleared"));
};
