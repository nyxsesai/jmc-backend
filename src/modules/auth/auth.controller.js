import * as service from "./auth.service.js";
import { success } from "../../utils/response.js";

export const verifyOtpHandler = async (request, reply) => {
  const result = await service.verifyOtp(request.server, request.body);
  return reply.send(success(result, "Login successful"));
};

export const registerHandler = async (request, reply) => {
  const result = await service.register(
    request.server,
    request.user.userId,
    request.body,
  );
  return reply.send(success(result, "Profile updated"));
};

export const meHandler = async (request, reply) => {
  const result = await service.getMe(request.server, request.user.userId);
  return reply.send(success(result));
};

export const switchRoleHandler = async (request, reply) => {
  const result = await service.switchRole(
    request.server,
    request.user.userId,
    request.body.role,
  );
  return reply.send(success(result, "Role switched"));
};

export const logoutHandler = async (request, reply) => {
  const result = await service.logout(request.server, request.user.userId);
  return reply.send(success(result, "Logged out"));
};
