import fp from "fastify-plugin";
import { ApiError } from "../utils/apiError.js";
import { error as errorResponse } from "../utils/response.js";

async function errorHandlerPlugin(fastify) {
  fastify.setErrorHandler((err, request, reply) => {
    if (process.env.NODE_ENV !== "production") {
      request.log.error(err);
    }

    if (err instanceof ApiError) {
      return reply
        .status(err.statusCode)
        .send(errorResponse(err.message, err.code));
    }

    if (err.validation) {
      return reply
        .status(400)
        .send(errorResponse(err.message, "VALIDATION_ERROR"));
    }

    const status = err.statusCode || 500;
    const message = status === 500 ? "Internal server error" : err.message;
    return reply.status(status).send(errorResponse(message));
  });
}

export default fp(errorHandlerPlugin, { name: "errorHandler" });
