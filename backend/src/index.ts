import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { battleLogs, enemies, users } from "./db/schema";

type CloudflareBindings = {
  DATABASE_URL: string;
};

const connections = new Map<string, ReturnType<typeof drizzle>>();

const getDb = (env: CloudflareBindings) => {
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

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/health", (c) => c.json({ ok: true }));

app.get("/users", async (c) => {
  const db = getDb(c.env);
  const data = await db.select().from(users);
  return c.json(data);
});

app.post("/users", async (c) => {
  const db = getDb(c.env);
  const body = await c.req.json<Partial<typeof users.$inferInsert>>();

  if (!body.displayName) {
    return c.json({ message: "displayName is required" }, 400);
  }

  const payload: typeof users.$inferInsert = {
    displayName: body.displayName,
    level: body.level,
    totalXp: body.totalXp,
  };

  const [created] = await db.insert(users).values(payload).returning();
  return c.json(created, 201);
});

app.get("/enemies", async (c) => {
  const db = getDb(c.env);
  const includeInactive = c.req.query("includeInactive") === "true";

  const data = includeInactive
    ? await db.select().from(enemies)
    : await db.select().from(enemies).where(eq(enemies.isActive, true));

  return c.json(data);
});

app.get("/battle-logs", async (c) => {
  const db = getDb(c.env);
  const userId = c.req.query("userId");

  const data = userId
    ? await db.select().from(battleLogs).where(eq(battleLogs.userId, userId))
    : await db.select().from(battleLogs);

  return c.json(data);
});

app.post("/battle-logs", async (c) => {
  const db = getDb(c.env);
  const body = await c.req.json<Partial<typeof battleLogs.$inferInsert>>();
  const { userId, enemyId, damageDealt, duration, replayData } = body;

  if (
    !userId ||
    !enemyId ||
    typeof damageDealt !== "number" ||
    typeof duration !== "number" ||
    !replayData
  ) {
    return c.json(
      {
        message:
          "userId, enemyId, damageDealt, duration, and replayData are required",
      },
      400,
    );
  }

  const payload: typeof battleLogs.$inferInsert = {
    userId,
    enemyId,
    damageDealt,
    duration,
    replayData,
  };

  const [created] = await db.insert(battleLogs).values(payload).returning();
  return c.json(created, 201);
});

export default app;
