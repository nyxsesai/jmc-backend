import fp from "fastify-plugin";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/apiError.js";

async function authPlugin(fastify) {
  // Decorate `fastify.authenticate` to be used as preHandler
  fastify.decorate("authenticate", async function (request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw ApiError.unauthorized("Missing or invalid Authorization header");
      }
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);

      // Attach user to request
      request.user = decoded; // { userId, firebaseUid }
    } catch (err) {
      if (err.isApiError) throw err;
      throw ApiError.unauthorized("Invalid or expired token");
    }
  });
}

export default fp(authPlugin, { name: "auth" });
