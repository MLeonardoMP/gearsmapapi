import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'

const app = new Hono()

const schema = z.object({
  departamento_id: z.string().optional(),
  municipio_id: z.string().optional(),
})

app.get('/', zValidator('query', schema), async (c) => {
  try {
    const { departamento_id, municipio_id } = c.req.valid('query')

    if (municipio_id) {
      const munRes =
        await db.sql`SELECT departamento_id FROM municipios WHERE municipio_id = ${municipio_id}`
      if (munRes.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      const depId = munRes.rows[0].departamento_id
      const result =
        await db.sql`SELECT * FROM estadisticas_departamentales WHERE departamento_id = ${depId}`
      return c.json(result.rows[0])
    } else if (departamento_id) {
      const result =
        await db.sql`SELECT * FROM estadisticas_departamentales WHERE departamento_id = ${departamento_id}`
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    }

    const result = await db.sql`SELECT * FROM estadisticas_departamentales ORDER BY departamento`
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
