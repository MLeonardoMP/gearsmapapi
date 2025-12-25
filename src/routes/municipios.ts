import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'

const app = new Hono()

const schema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
})

app.get('/', zValidator('query', schema), async (c) => {
  try {
    const { municipio_id, departamento_id } = c.req.valid('query')

    if (municipio_id) {
      const result =
        await db.sql`SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y FROM municipios WHERE municipio_id = ${municipio_id}`
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    } else if (departamento_id) {
      const result =
        await db.sql`SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y FROM municipios WHERE departamento_id = ${departamento_id} ORDER BY municipio`
      return c.json(result.rows)
    }

    const result =
      await db.sql`SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y FROM municipios ORDER BY departamento, municipio`
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
