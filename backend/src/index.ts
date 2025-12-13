// src/index.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

// 分割したファイルをインポート
import usersRoute from "./routes/users";
import battleRoute from "./routes/battle-logs";
import enemiesRoute from "./routes/enemies";
const app = new Hono();

// ミドルウェア
app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

const routes = app
  .route("/routes/users", usersRoute)
  .route("/routes/battle-logs", battleRoute)
  .route("/routes/enemies", enemiesRoute);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
// chainしたルート変数の型をexportする
export type AppType = typeof routes;
