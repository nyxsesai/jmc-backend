import * as controller from "./auth.controller.js";
import * as schema from "./auth.schema.js";

export default async function authRoutes(fastify) {
  fastify.post("/verify-otp", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
        keyGenerator: (req) => req.ip, // per IP
      },
    },
    schema: schema.verifyOtpFirebaseSchema,
    handler: controller.verifyOtpHandler,
  });

  fastify.post("/register", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
        keyGenerator: (req) => req.user?.userId || req.ip, // per user
      },
    },
    preHandler: [fastify.authenticate],
    schema: schema.registerSchema,
    handler: controller.registerHandler,
  });

  fastify.get("/me", {
    preHandler: [fastify.authenticate],
    handler: controller.meHandler,
  });

  fastify.post("/switch-role", {
    preHandler: [fastify.authenticate],
    schema: schema.switchRoleSchema,
    handler: controller.switchRoleHandler,
  });

  fastify.post("/logout", {
    preHandler: [fastify.authenticate],
    handler: controller.logoutHandler,
  });
}
