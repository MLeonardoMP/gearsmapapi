import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'

const app = new Hono()

const schema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
  recurso: z.string().optional(),
  anio: z.string().optional(),
  mes: z.string().optional(),
})

app.get('/', zValidator('query', schema), async (c) => {
  try {
    const { municipio_id, departamento_id, recurso, anio, mes } = c.req.valid('query')

    // Usamos el patrón db.sql para consistencia con el resto de la API
    // El truco (val IS NULL OR col = val) permite filtros opcionales en una sola consulta
    const result = await db.sql`
      SELECT * FROM produccion 
      WHERE (${municipio_id || null} IS NULL OR municipio_id = ${municipio_id})
        AND (${departamento_id || null} IS NULL OR departamento_id = ${departamento_id})
        AND (${recurso || null} IS NULL OR recurso = ${recurso})
        AND (${anio || null} IS NULL OR anio = ${anio})
        AND (${mes || null} IS NULL OR mes = ${mes})
      ORDER BY anio DESC, mes ASC
      LIMIT 1000
    `

    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
