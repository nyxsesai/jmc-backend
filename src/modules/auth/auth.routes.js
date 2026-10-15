import * as controller from "./auth.controller.js";
import * as schema from "./auth.schema.js";

export default async function authRoutes(fastify) {
  // fastify.post("/send-otp", {
  //   schema: schema.sendOtpSchema,
  //   handler: controller.sendOtpHandler,
  // });

  // ─── NEW: Firebase-based verify (used when creds are set) ───
  fastify.post("/verify-otp", {
    schema: schema.verifyOtpFirebaseSchema,
    handler: controller.verifyOtpHandler,
  });

  fastify.post("/register", {
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
