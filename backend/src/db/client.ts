import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { CloudflareBindings } from "../types";

const connections = new Map<string, ReturnType<typeof drizzle>>();

export const getDb = (env: CloudflareBindings) => {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const cached = connections.get(url);
  if (cached) {
    return cached;
  }

  const client = postgres(url);
  const db = drizzle(client);
  connections.set(url, db);
  return db;
};
