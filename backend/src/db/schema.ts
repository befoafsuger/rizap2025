import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // Supabase Authと連携するなら .defaultRandom() は外して手動挿入
  displayName: text("display_name").notNull(),
  level: integer("level").default(1).notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enemies = pgTable("enemies", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  hp: integer("hp").notNull(),
  assetUrl: text("asset_url"),
  attackPattern: jsonb("attack_pattern").default({}),
  isActive: boolean("is_active").default(true),
});

export const battleLogs = pgTable("battle_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  enemyId: text("enemy_id")
    .references(() => enemies.id)
    .notNull(),
  damageDealt: integer("damage_dealt").notNull(),
  duration: integer("duration").notNull(), // 秒数
  replayData: jsonb("replay_data")
    .$type<Array<{ t: number; d: number; c: boolean }>>()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
