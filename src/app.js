import Fastify from "fastify";
import cors from "@fastify/cors";
import dbPlugin from "./plugins/db.plugin.js";
import authPlugin from "./plugins/auth.plugin.js";
import errorHandlerPlugin from "./plugins/errorHandler.plugin.js";
import firebasePlugin from "./plugins/firebase.plugin.js";
import registerRoutes from "./routes/index.js";
import rateLimit from "@fastify/rate-limit";

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    global: true,
    max: 100, // 5 requests
    timeWindow: "1 minute",
    cache: 10000, // track up to 10k keys
    allowList: [], // optionally exclude certain IPs
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      success: false,
      message: `Too many requests. Please try again in ${context.after}.`,
      code: "RATE_LIMITED",
    }),
  });
  await fastify.register(errorHandlerPlugin);
  await fastify.register(dbPlugin);
  await fastify.register(authPlugin);
  await fastify.register(firebasePlugin);
  await fastify.register(registerRoutes);

  return fastify;
}
