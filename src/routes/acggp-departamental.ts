import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'

const app = new Hono()

const schema = z.object({
  departamento_id: z.string().optional(),
  anio: z.string().optional(),
})

app.get('/', zValidator('query', schema), async (c) => {
  try {
    const { departamento_id, anio } = c.req.valid('query')
    let result

    if (departamento_id && anio) {
      result = await db.sql`
        SELECT * FROM acggp_deps_anio 
        WHERE departamento_id = ${departamento_id} AND anio = ${anio}
      `
    } else if (departamento_id) {
      result = await db.sql`
        SELECT * FROM acggp_deps_anio 
        WHERE departamento_id = ${departamento_id}
        ORDER BY anio DESC
      `
    } else if (anio) {
      result = await db.sql`
        SELECT * FROM acggp_deps_anio 
        WHERE anio = ${anio}
        ORDER BY departamento
      `
    } else {
      result = await db.sql`
        SELECT * FROM acggp_deps_anio 
        ORDER BY departamento, anio DESC
      `
    }

    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
