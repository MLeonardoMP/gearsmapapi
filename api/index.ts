import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { sql } from '@vercel/postgres'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono().basePath('/api')

// Middlewares Globales
app.use('*', logger())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: ['https://gearsmap.com', 'https://www.gearsmap.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'OPTIONS'],
    maxAge: 600,
  })
)

// Middleware de Cache
app.use('*', async (c, next) => {
  await next()
  if (c.res.status === 200) {
    c.res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  }
})

// ========== HEALTH CHECK ==========
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ========== DEPARTAMENTOS ==========
const departamentosSchema = z.object({
  departamento_id: z.string().optional(),
})

app.get('/departamentos', zValidator('query', departamentosSchema), async (c) => {
  try {
    const { departamento_id } = c.req.valid('query')

    if (departamento_id) {
      const result = await sql`
        SELECT gid, departamento_id, departamento, area_departamento, x, y
        FROM departamentos
        WHERE departamento_id = ${departamento_id}
      `
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    }

    const result = await sql`
      SELECT gid, departamento_id, departamento, area_departamento, x, y
      FROM departamentos
      ORDER BY departamento
    `
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

// ========== MUNICIPIOS ==========
const municipiosSchema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
})

app.get('/municipios', zValidator('query', municipiosSchema), async (c) => {
  try {
    const { municipio_id, departamento_id } = c.req.valid('query')

    if (municipio_id) {
      const result =
        await sql`SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y FROM municipios WHERE municipio_id = ${municipio_id}`
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    } else if (departamento_id) {
      const result =
        await sql`SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y FROM municipios WHERE departamento_id = ${departamento_id} ORDER BY municipio`
      return c.json(result.rows)
    }

    const result =
      await sql`SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y FROM municipios ORDER BY departamento, municipio`
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

// ========== GEOMS DEPARTAMENTOS ==========
app.get('/geoms-departamentos', zValidator('query', departamentosSchema), async (c) => {
  try {
    const { departamento_id } = c.req.valid('query')

    if (departamento_id) {
      const result = await sql`
        SELECT departamento_id, departamento, geom
        FROM departamentos
        WHERE departamento_id = ${departamento_id}
      `
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    }

    const result = await sql`
      SELECT departamento_id, departamento, geom
      FROM departamentos
      ORDER BY departamento
    `
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

// ========== GEOMS MUNICIPIOS ==========
const geomsMunicipiosSchema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
})

app.get('/geoms-municipios', zValidator('query', geomsMunicipiosSchema), async (c) => {
  try {
    const { municipio_id, departamento_id, page, limit } = c.req.valid('query')
    const p = parseInt(page)
    const l = parseInt(limit)
    const offset = (p - 1) * l

    if (municipio_id) {
      const result =
        await sql`SELECT municipio_id, departamento_id, municipio, geom FROM municipios WHERE municipio_id = ${municipio_id}`
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    } else if (departamento_id) {
      const count =
        await sql`SELECT COUNT(*) as total FROM municipios WHERE departamento_id = ${departamento_id}`
      const total = parseInt(count.rows[0].total)
      const result = await sql`
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
      await sql`SELECT municipio_id, departamento_id, municipio FROM municipios ORDER BY departamento_id, municipio`
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

// ========== DATOS ACGGP ==========
const datosAcggpSchema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
})

app.get('/datos-acggp', zValidator('query', datosAcggpSchema), async (c) => {
  try {
    const { municipio_id, departamento_id } = c.req.valid('query')
    let result

    if (municipio_id) {
      result = await sql`
        SELECT aliado, proyecto, actividad, tematica, publico, anio,
               departamento, municipio, fecha_ejecucion_plan, fecha_ejecucion_real,
               numero_participantes, municipio_id, departamento_id
        FROM datos_acggp
        WHERE municipio_id = ${municipio_id}
        ORDER BY fecha_ejecucion_real DESC
      `
    } else if (departamento_id) {
      result = await sql`
        SELECT aliado, proyecto, actividad, tematica, publico, anio,
               departamento, municipio, fecha_ejecucion_plan, fecha_ejecucion_real,
               numero_participantes, municipio_id, departamento_id
        FROM datos_acggp
        WHERE departamento_id = ${departamento_id}
        ORDER BY fecha_ejecucion_real DESC
      `
    } else {
      result = await sql`
        SELECT aliado, proyecto, actividad, tematica, publico, anio,
               departamento, municipio, fecha_ejecucion_plan, fecha_ejecucion_real,
               numero_participantes, municipio_id, departamento_id
        FROM datos_acggp
        ORDER BY fecha_ejecucion_real DESC
      `
    }

    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error al obtener datos ACGGP' }, 500)
  }
})

// ========== ACGGP DEPARTAMENTAL ==========
const acggpDepartamentalSchema = z.object({
  departamento_id: z.string().optional(),
  anio: z.string().optional(),
})

app.get('/acggp-departamental', zValidator('query', acggpDepartamentalSchema), async (c) => {
  try {
    const { departamento_id, anio } = c.req.valid('query')
    let result

    if (departamento_id && anio) {
      result = await sql`
        SELECT * FROM acggp_deps_anio
        WHERE departamento_id = ${departamento_id} AND anio = ${anio}
      `
    } else if (departamento_id) {
      result = await sql`
        SELECT * FROM acggp_deps_anio
        WHERE departamento_id = ${departamento_id}
        ORDER BY anio DESC
      `
    } else if (anio) {
      result = await sql`
        SELECT * FROM acggp_deps_anio
        WHERE anio = ${anio}
        ORDER BY departamento
      `
    } else {
      result = await sql`
        SELECT * FROM acggp_deps_anio
        ORDER BY departamento, anio DESC
      `
    }

    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

// ========== ESTADISTICAS DEPARTAMENTALES ==========
const estadisticasSchema = z.object({
  departamento_id: z.string().optional(),
  municipio_id: z.string().optional(),
})

app.get('/estadisticas-departamentales', zValidator('query', estadisticasSchema), async (c) => {
  try {
    const { departamento_id, municipio_id } = c.req.valid('query')

    if (municipio_id) {
      const munRes =
        await sql`SELECT departamento_id FROM municipios WHERE municipio_id = ${municipio_id}`
      if (munRes.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      const depId = munRes.rows[0].departamento_id
      const result =
        await sql`SELECT * FROM estadisticas_departamentales WHERE departamento_id = ${depId}`
      return c.json(result.rows[0])
    } else if (departamento_id) {
      const result =
        await sql`SELECT * FROM estadisticas_departamentales WHERE departamento_id = ${departamento_id}`
      if (result.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
      return c.json(result.rows[0])
    }

    const result = await sql`SELECT * FROM estadisticas_departamentales ORDER BY departamento`
    return c.json(result.rows)
  } catch (_err) {
    return c.json({ error: 'Error' }, 500)
  }
})

// ========== PRODUCCION ==========
const produccionSchema = z.object({
  municipio_id: z.string().optional(),
  departamento_id: z.string().optional(),
  recurso: z.string().optional(),
  anio: z.string().optional(),
  mes: z.string().optional(),
})

app.get('/produccion', zValidator('query', produccionSchema), async (c) => {
  try {
    const { municipio_id, departamento_id, recurso, anio, mes } = c.req.valid('query')

    const result = await sql`
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

// ========== PRODUCCION DEPARTAMENTAL ==========
const produccionDepartamentalSchema = z.object({
  departamento_id: z.string().optional(),
  anio: z.string().optional(),
})

app.get(
  '/produccion-departamental',
  zValidator('query', produccionDepartamentalSchema),
  async (c) => {
    try {
      const { departamento_id, anio } = c.req.valid('query')
      let result

      if (departamento_id && anio) {
        result =
          await sql`SELECT * FROM production_deps_anio WHERE departamento_id = ${departamento_id} AND anio = ${anio}`
      } else if (departamento_id) {
        result =
          await sql`SELECT * FROM production_deps_anio WHERE departamento_id = ${departamento_id} ORDER BY anio DESC`
      } else if (anio) {
        result =
          await sql`SELECT * FROM production_deps_anio WHERE anio = ${anio} ORDER BY departamento`
      } else {
        result = await sql`SELECT * FROM production_deps_anio ORDER BY departamento, anio DESC`
      }

      return c.json(result.rows)
    } catch (_err) {
      return c.json({ error: 'Error' }, 500)
    }
  }
)

export default handle(app)
