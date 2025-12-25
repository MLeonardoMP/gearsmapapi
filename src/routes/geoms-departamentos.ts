import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'

const app = new Hono()

const schema = z.object({
  departamento_id: z.string().optional(),
})

app.get('/', zValidator('query', schema), async (c) => {
  try {
    const { departamento_id } = c.req.valid('query')

    if (departamento_id) {
      const result = await db.sql`
        SELECT departamento_id, departamento, geom
        FROM departamentos
        WHERE departamento_id = ${departamento_id}
      `
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    }

    const result = await db.sql`
      SELECT departamento_id, departamento, geom
      FROM departamentos
      ORDER BY departamento
    `
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
