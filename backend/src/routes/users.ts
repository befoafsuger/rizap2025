import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { users } from "../db/schema";
import { getDb } from "../db/client";
import { eq } from "drizzle-orm";
import type { CloudflareBindings } from "../types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// ユーザー一覧取得 (クエリなしだが validator を通す)
app.get(
  "/",
  zValidator("query", z.object({}).passthrough()),
  async (c) => {
    const db = getDb(c.env);
    const res = await db.select().from(users);
    return c.json(res);
  },
);

// ユーザー登録
// 実際のURL: POST /api/users
app.post(
  "/",
  zValidator("json", z.object({ displayName: z.string().min(1) })),
  async (c) => {
    const { displayName } = c.req.valid("json");
    const db = getDb(c.env);
    const res = await db.insert(users).values({ displayName }).returning();
    return c.json(res[0]);
  },
);

// ユーザー情報取得
// 実際のURL: GET /api/users/:id
app.get(
  "/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid("param");
    const db = getDb(c.env);
    const res = await db.select().from(users).where(eq(users.id, id));

    if (res.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(res[0]);
  },
);

export default app;
