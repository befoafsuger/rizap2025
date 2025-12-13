import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { users } from '../db/schema'
import { getDb } from '../db/client'
import { eq } from 'drizzle-orm'

const app = new Hono()

// ユーザー登録
// 実際のURL: POST /api/users
app.post(
  '/', 
  zValidator('json', z.object({ displayName: z.string() })),
  async (c) => {
    const { displayName } = c.req.valid('json');
    const db = getDb(c.env as any);
    const res = await db.insert(users).values({ displayName }).returning();
    return c.json(res[0]);
  }
);

// ユーザー情報取得
// 実際のURL: GET /api/users/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env as any);
  const res = await db.select().from(users).where(eq(users.id, id));
  
  if (res.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json(res[0]);
});

export default app;