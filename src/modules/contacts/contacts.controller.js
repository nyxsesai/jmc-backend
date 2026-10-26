import * as service from "./contacts.service.js";
import { success } from "../../utils/response.js";

export const syncHandler = async (request, reply) => {
  const result = await service.syncContacts(
    request.server,
    request.user.userId,
    request.body.phones,
  );
  return reply.send(success(result, "Contacts synced"));
};

export const trustedHandler = async (request, reply) => {
  const result = await service.getTrusted(request.server, request.user.userId);
  return reply.send(success(result));
};

export const hideHandler = async (request, reply) => {
  const result = await service.hideContact(
    request.server,
    request.user.userId,
    request.params.userId,
    request.body.hidden,
  );
  return reply.send(success(result, "Contact updated"));
};

export const deleteHandler = async (request, reply) => {
  const result = await service.deleteContacts(
    request.server,
    request.user.userId,
  );
  return reply.send(success(result, "Synced contacts deleted"));
};
