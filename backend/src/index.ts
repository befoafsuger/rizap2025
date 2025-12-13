// src/index.ts
import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { prettyJSON } from "hono/pretty-json"

import { usersRoutes } from "./routes/users"
import { battleLogsRoutes } from "./routes/battle-logs"
import { enemiesRoutes } from "./routes/enemies"

const app = new Hono()
  .use("*", logger())
  .use("*", cors())
  .use("*", prettyJSON())

const routes = app
  .route("/api/users", usersRoutes)
  .route("/api/battle/logs", battleLogsRoutes)
  .route("/api/battle/enemies", enemiesRoutes)

export default app
export type AppType = typeof routes
