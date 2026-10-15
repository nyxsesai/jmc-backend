import fp from "fastify-plugin";
import { initFirebase } from "../config/firebase.js";

async function firebasePlugin(fastify) {
  const firebase = initFirebase();

  fastify.decorate("firebase", firebase);

  if (firebase) {
    fastify.log.info("Firebase plugin ready");
  } else {
    fastify.log.warn("Firebase plugin loaded (creds missing — disabled)");
  }
}

export default fp(firebasePlugin, { name: "firebase" });
