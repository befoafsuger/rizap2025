import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { enemies } from "../db/schema";
import { getDb } from "../db/client";
import type { CloudflareBindings } from "../types";

const enemiesRoute = new Hono<{ Bindings: CloudflareBindings }>();

enemiesRoute.get(
  "/",
  zValidator(
    "query",
    z.object({
      includeInactive: z.string().optional(),
    }).passthrough(),
  ),
  async (c) => {
    const db = getDb(c.env);
    const { includeInactive } = c.req.valid("query");
    const includeInactiveBool = includeInactive === "true";

    const data = includeInactiveBool
      ? await db.select().from(enemies)
      : await db.select().from(enemies).where(eq(enemies.isActive, true));

    return c.json(data);
  },
);

export default enemiesRoute;
