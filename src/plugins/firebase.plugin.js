import fp from "fastify-plugin";
import { initFirebase } from "../config/firebase.js";

async function firebasePlugin(fastify) {
  // Initialize Firebase
  const firebase = initFirebase();

  // Attach it to Fastify (this makes `fastify.firebase` available everywhere)
  fastify.decorate("firebase", firebase);

  // Log status
  if (firebase) {
    fastify.log.info("Firebase plugin ready");
  } else {
    fastify.log.warn("Firebase plugin loaded (creds missing — disabled)");
  }
}

// Wrap in fp() so it's not encapsulated
export default fp(firebasePlugin, { name: "firebase" });
