import fp from "fastify-plugin";
import { pool, query } from "../database/pool.js";

async function dbPlugin(fastify) {
  fastify.decorate("db", { pool, query });

  fastify.addHook("onClose", async () => {
    await pool.end();
  });
}

export default fp(dbPlugin, { name: "db" });
