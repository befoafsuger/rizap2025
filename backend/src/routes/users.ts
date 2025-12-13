import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { users } from "../db/schema"
import { getDb } from "../db/client"
import { eq } from "drizzle-orm"
import type { CloudflareBindings } from "../types"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// ユーザー一覧取得 (クエリなしだが validator を通す)
const usersRoutes = app
  .get("/", zValidator("query", z.object({}).passthrough()), async (c) => {
    const db = getDb(c.env)
    const res = await db.select().from(users)
    return c.json(res)
  })
  .post(
    "/",
    zValidator("json", z.object({ displayName: z.string().min(1) })),
    async (c) => {
      const { displayName } = c.req.valid("json")
      const db = getDb(c.env)
      const res = await db.insert(users).values({ displayName }).returning()
      return c.json(res[0])
    }
  )

export { usersRoutes }
