import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { enemies } from "../db/schema";
import { getDb } from "../db/client";
import type { CloudflareBindings } from "../types";

const enemiesRoute = new Hono<{ Bindings: CloudflareBindings }>();

enemiesRoute.get("/", async (c) => {
  const db = getDb(c.env);
  const includeInactive = c.req.query("includeInactive") === "true";

  const data = includeInactive
    ? await db.select().from(enemies)
    : await db.select().from(enemies).where(eq(enemies.isActive, true));

  return c.json(data);
});

export default enemiesRoute;
