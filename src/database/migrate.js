import "dotenv/config";
import fs from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node src/database/migrate.js <path-to-file.sql>");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(fs.readFileSync(file, "utf8"));
await client.end();
console.log("Done:", file);
