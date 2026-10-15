export default async function healthRoutes(fastify) {
  fastify.get("/health", async () => ({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  fastify.get("/health/db", async (request, reply) => {
    try {
      const result = await fastify.db.query(
        "SELECT NOW() as now, PostGIS_Version() as postgis",
      );
      return {
        success: true,
        db: "connected",
        now: result.rows[0].now,
        postgis: result.rows[0].postgis,
      };
    } catch (err) {
      request.log.error(err);
      return reply.status(503).send({
        success: false,
        db: "disconnected",
        error: err.message,
      });
    }
  });
}
