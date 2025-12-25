import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

// Handler directo sin Hono
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const path = url.pathname.replace('/api', '')
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  try {
    // ========== HEALTH CHECK ==========
    if (path === '/health' || path === '/health/') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() })
    }

    // ========== DEPARTAMENTOS ==========
    // Columnas reales: gid, departamento_id, departamento, area_departamento, geom, x, y
    if (path === '/departamentos' || path === '/departamentos/') {
      const { departamento_id } = req.query
      if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT gid, departamento_id, departamento, area_departamento, x, y
          FROM departamentos
          WHERE departamento_id = ${departamento_id}
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT gid, departamento_id, departamento, area_departamento, x, y
          FROM departamentos
          ORDER BY departamento
        `
        return res.json(result.rows)
      }
    }

    // ========== MUNICIPIOS ==========
    // Columnas reales: gid, municipio_id, departamento_id, departamento, municipio, geom, x, y
    if (path === '/municipios' || path === '/municipios/') {
      const { departamento_id, municipio_id } = req.query
      if (municipio_id && typeof municipio_id === 'string') {
        const result = await sql`
          SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y
          FROM municipios
          WHERE municipio_id = ${municipio_id}
        `
        return res.json(result.rows)
      } else if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y
          FROM municipios
          WHERE departamento_id = ${departamento_id}
          ORDER BY municipio
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT gid, municipio_id, departamento_id, departamento, municipio, x, y
          FROM municipios
          ORDER BY departamento, municipio
        `
        return res.json(result.rows)
      }
    }

    // ========== PRODUCCION ==========
    // Columnas reales: departamento, municipio, operadora, campo, contrato, anio, mes, produccion, recurso, municipio_id, departamento_id
    if (path === '/produccion' || path === '/produccion/') {
      const { municipio_id, departamento_id, anio, mes, limit: limitParam } = req.query
      const limit = limitParam && typeof limitParam === 'string' ? parseInt(limitParam) : 100
      
      if (municipio_id && typeof municipio_id === 'string') {
        const result = await sql`
          SELECT departamento_id, departamento, municipio_id, municipio, 
                 operadora, campo, contrato, anio, mes, produccion, recurso
          FROM produccion
          WHERE municipio_id = ${municipio_id}
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      } else if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT departamento_id, departamento, municipio_id, municipio, 
                 operadora, campo, contrato, anio, mes, produccion, recurso
          FROM produccion
          WHERE departamento_id = ${departamento_id}
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      } else if (anio && typeof anio === 'string') {
        const mesFilter = mes && typeof mes === 'string' ? parseInt(mes) : null
        if (mesFilter) {
          const result = await sql`
            SELECT departamento_id, departamento, municipio_id, municipio, 
                   operadora, campo, contrato, anio, mes, produccion, recurso
            FROM produccion
            WHERE anio = ${parseInt(anio)} AND mes = ${mesFilter}
            ORDER BY produccion DESC
            LIMIT ${limit}
          `
          return res.json(result.rows)
        } else {
          const result = await sql`
            SELECT departamento_id, departamento, municipio_id, municipio, 
                   operadora, campo, contrato, anio, mes, produccion, recurso
            FROM produccion
            WHERE anio = ${parseInt(anio)}
            ORDER BY mes DESC, produccion DESC
            LIMIT ${limit}
          `
          return res.json(result.rows)
        }
      } else {
        // Por defecto: obtener la producción más reciente
        const result = await sql`
          SELECT departamento_id, departamento, municipio_id, municipio, 
                 operadora, campo, contrato, anio, mes, produccion, recurso
          FROM produccion
          ORDER BY anio DESC, mes DESC, produccion DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      }
    }

    // ========== GEOMS DEPARTAMENTOS ==========
    if (path === '/geoms-departamentos' || path === '/geoms-departamentos/') {
      const { departamento_id } = req.query
      if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT gid, departamento_id, departamento, geom
          FROM departamentos
          WHERE departamento_id = ${departamento_id}
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT gid, departamento_id, departamento, geom
          FROM departamentos
          ORDER BY departamento
        `
        return res.json(result.rows)
      }
    }

    // ========== GEOMS MUNICIPIOS ==========
    if (path === '/geoms-municipios' || path === '/geoms-municipios/') {
      const { municipio_id, departamento_id } = req.query
      if (municipio_id && typeof municipio_id === 'string') {
        const result = await sql`
          SELECT gid, municipio_id, municipio, departamento_id, departamento, geom
          FROM municipios
          WHERE municipio_id = ${municipio_id}
        `
        return res.json(result.rows)
      } else if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT gid, municipio_id, municipio, departamento_id, departamento, geom
          FROM municipios
          WHERE departamento_id = ${departamento_id}
          ORDER BY municipio
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT gid, municipio_id, municipio, departamento_id, departamento, geom
          FROM municipios
          ORDER BY departamento, municipio
        `
        return res.json(result.rows)
      }
    }

    // ========== ESTADISTICAS ==========
    if (path === '/estadisticas' || path === '/estadisticas/') {
      const [deptos, municipios, produccionStats, ultimaActualizacion] = await Promise.all([
        sql`SELECT COUNT(*)::int as count FROM departamentos`,
        sql`SELECT COUNT(*)::int as count FROM municipios`,
        sql`SELECT COUNT(*)::int as count FROM produccion`,
        sql`SELECT MAX(anio::int * 100 + mes::int) as ultimo FROM produccion`
      ])
      
      const ultimoPeriodo = ultimaActualizacion.rows[0]?.ultimo
      const anio = ultimoPeriodo ? Math.floor(ultimoPeriodo / 100) : null
      const mes = ultimoPeriodo ? ultimoPeriodo % 100 : null
      
      return res.json({
        total_departamentos: deptos.rows[0]?.count || 0,
        total_municipios: municipios.rows[0]?.count || 0,
        total_registros_produccion: produccionStats.rows[0]?.count || 0,
        ultima_actualizacion: { anio, mes }
      })
    }

    // Ruta no encontrada
    return res.status(404).json({ error: 'Not Found', path })
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
