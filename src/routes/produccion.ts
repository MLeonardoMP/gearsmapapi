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

    let query = 'SELECT * FROM produccion WHERE 1=1'
    const params: unknown[] = []

    if (municipio_id) {
      params.push(municipio_id)
      query += ` AND municipio_id = $${params.length}`
    }
    if (departamento_id) {
      params.push(departamento_id)
      query += ` AND departamento_id = $${params.length}`
    }
    if (recurso) {
      params.push(recurso)
      query += ` AND recurso = $${params.length}`
    }
    if (anio) {
      params.push(anio)
      query += ` AND anio = $${params.length}`
    }
    if (mes) {
      params.push(mes)
      query += ` AND mes = $${params.length}`
    }

    query += ' ORDER BY anio DESC, mes ASC'

    // Si no hay filtros, limitamos a 100 para evitar sobrecarga
    if (params.length === 0) {
      query += ' LIMIT 100'
    }

    const result = await db.query(query, params)
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

export default app
