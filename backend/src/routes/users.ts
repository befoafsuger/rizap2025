import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { users } from '../db/schema'
import { getDb } from '../db/client'
import type { CloudflareBindings } from '../types'

const usersRoute = new Hono<{ Bindings: CloudflareBindings }>()

usersRoute.get('/', async (c) => {
  const db = getDb(c.env)
  const data = await db.select().from(users)
  return c.json(data)
})

usersRoute.post(
  '/',
  zValidator('json', z.object({ displayName: z.string() })),
  async (c) => {
    const db = getDb(c.env)
    const { displayName } = c.req.valid('json')
    const [created] = await db.insert(users).values({ displayName }).returning()
    return c.json(created)
  },
)

usersRoute.get('/:id', async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const res = await db.select().from(users).where(eq(users.id, id))

  if (res.length === 0) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json(res[0])
})

export default usersRoute
