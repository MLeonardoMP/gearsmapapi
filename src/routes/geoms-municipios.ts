import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'

const app = new Hono()

const schema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
})

app.get('/', zValidator('query', schema), async (c) => {
  try {
    const { municipio_id, departamento_id, page, limit } = c.req.valid('query')
    const p = parseInt(page)
    const l = parseInt(limit)
    const offset = (p - 1) * l

    if (municipio_id) {
      const result =
        await db.sql`SELECT municipio_id, departamento_id, municipio, geom FROM municipios WHERE municipio_id = ${municipio_id}`
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    } else if (departamento_id) {
      const count =
        await db.sql`SELECT COUNT(*) as total FROM municipios WHERE departamento_id = ${departamento_id}`
      const total = parseInt(count.rows[0].total)
      const result = await db.sql`
        SELECT municipio_id, departamento_id, municipio, geom 
        FROM municipios 
        WHERE departamento_id = ${departamento_id} 
        ORDER BY municipio 
        LIMIT ${l} OFFSET ${offset}
      `
      return c.json({
        data: result.rows,
        pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) },
      })
    }

    const result =
      await db.sql`SELECT municipio_id, departamento_id, municipio FROM municipios ORDER BY departamento_id, municipio`
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
