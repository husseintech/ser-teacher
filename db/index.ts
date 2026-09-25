import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

function connectionString() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL or POSTGRES_URL is not configured");
  }
  return url;
}

export function getDb() {
  client ??= postgres(connectionString(), {
    max: 1,
    prepare: false,
    ssl: "require",
    idle_timeout: 20,
    connect_timeout: 15,
  });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;