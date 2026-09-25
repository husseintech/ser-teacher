import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}

export function getDb() {
  const client = neon(connectionString());
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
