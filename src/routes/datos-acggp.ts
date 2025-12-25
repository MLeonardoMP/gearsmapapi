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
    let result

    if (municipio_id) {
      result = await db.sql`
        SELECT aliado, proyecto, actividad, tematica, publico, anio,
               departamento, municipio, fecha_ejecucion_plan, fecha_ejecucion_real,
               numero_participantes, municipio_id, departamento_id
        FROM datos_acggp
        WHERE municipio_id = ${municipio_id}
        ORDER BY fecha_ejecucion_real DESC
      `
    } else if (departamento_id) {
      result = await db.sql`
        SELECT aliado, proyecto, actividad, tematica, publico, anio,
               departamento, municipio, fecha_ejecucion_plan, fecha_ejecucion_real,
               numero_participantes, municipio_id, departamento_id
        FROM datos_acggp
        WHERE departamento_id = ${departamento_id}
        ORDER BY fecha_ejecucion_real DESC
      `
    } else {
      result = await db.sql`
        SELECT aliado, proyecto, actividad, tematica, publico, anio,
               departamento, municipio, fecha_ejecucion_plan, fecha_ejecucion_real,
               numero_participantes, municipio_id, departamento_id
        FROM datos_acggp
        ORDER BY fecha_ejecucion_real DESC
      `
    }

    return c.json(result.rows)
  } catch (_err) {
    console.error(_err)
    return c.json({ error: 'Error al obtener datos ACGGP' }, 500)
  }
})

export default app
