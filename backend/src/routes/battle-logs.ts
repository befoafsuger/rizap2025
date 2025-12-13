import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { getDb } from "../db/client"
import { battleLogs, users } from "../db/schema"
import { eq, sql } from "drizzle-orm"
import type { CloudflareBindings } from "../types"

const app = new Hono<{ Bindings: CloudflareBindings }>()

const battleLogsRoutes = app
  .get("/ghost", zValidator("query", z.object({}).passthrough()), async (c) => {
    const db = getDb(c.env)
    // 簡易的にランダム取得
    const ghosts = await db.select().from(battleLogs).limit(1)
    return c.json(ghosts[0] || { message: "No ghost found" })
  })
  .post(
    "/result",
    zValidator(
      "json",
      z.object({
        userId: z.string().uuid(),
        enemyId: z.string().min(1),
        totalDamage: z.number(),
        result: z.enum(["WIN", "LOSE"]),
      })
    ),
    async (c) => {
      const db = getDb(c.env)
      const data = c.req.valid("json")

      // 1. ログ保存
      await db.insert(battleLogs).values({
        userId: data.userId,
        enemyId: data.enemyId,
        damageDealt: data.totalDamage,
        duration: 0,
        replayData: [],
      })

      // 2. 経験値加算 & レベルアップ計算
      await db
        .update(users)
        .set({
          totalXp: sql`${users.totalXp} + ${data.totalDamage}`,
          level: sql`FLOOR((${users.totalXp} + ${data.totalDamage}) / 1000) + 1`,
        })
        .where(eq(users.id, data.userId))

      return c.json({ success: true })
    }
  )

export { battleLogsRoutes }
