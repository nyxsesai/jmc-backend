import * as service from "./rides.service.js";
import { success } from "../../utils/response.js";

export const createHandler = async (request, reply) => {
  const result = await service.createRide(
    request.server,
    request.user.userId,
    request.body,
  );
  return reply.code(201).send(success(result, "Ride published"));
};

export const mineHandler = async (request, reply) => {
  const result = await service.listMine(
    request.server,
    request.user.userId,
    request.query.scope,
  );
  return reply.send(success(result));
};

export const updateHandler = async (request, reply) => {
  const result = await service.updateRide(
    request.server,
    request.user.userId,
    request.params.id,
    request.body,
  );
  return reply.send(success(result, "Ride updated"));
};

export const cancelHandler = async (request, reply) => {
  const result = await service.cancelRide(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result, "Ride cancelled"));
};

export const startHandler = async (request, reply) => {
  const result = await service.startRide(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result, "Ride started"));
};

export const completeHandler = async (request, reply) => {
  const result = await service.completeRide(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result, "Ride completed"));
};

export const searchHandler = async (request, reply) => {
  const result = await service.searchRides(
    request.server,
    request.user.userId,
    request.query,
  );
  return reply.send(success(result));
};

export const detailsHandler = async (request, reply) => {
  const result = await service.getRideDetails(
    request.server,
    request.user.userId,
    request.params.id,
  );
  return reply.send(success(result));
};
