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
    if (path === '/departamentos' || path === '/departamentos/') {
      const { departamento_id } = req.query
      if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT departamento_id, departamento, geocode, centroide
          FROM departamentos
          WHERE departamento_id = ${departamento_id}
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT departamento_id, departamento, geocode, centroide
          FROM departamentos
          ORDER BY departamento
        `
        return res.json(result.rows)
      }
    }

    // ========== MUNICIPIOS ==========
    if (path === '/municipios' || path === '/municipios/') {
      const { departamento_id, municipio_id } = req.query
      if (municipio_id && typeof municipio_id === 'string') {
        const result = await sql`
          SELECT municipio_id, municipio, departamento_id, departamento, geocode, centroide
          FROM municipios
          WHERE municipio_id = ${municipio_id}
        `
        return res.json(result.rows)
      } else if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT municipio_id, municipio, departamento_id, departamento, geocode, centroide
          FROM municipios
          WHERE departamento_id = ${departamento_id}
          ORDER BY municipio
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT municipio_id, municipio, departamento_id, departamento, geocode, centroide
          FROM municipios
          ORDER BY departamento, municipio
        `
        return res.json(result.rows)
      }
    }

    // ========== PRODUCCION ==========
    if (path === '/produccion' || path === '/produccion/') {
      const { municipio_id, departamento_id, pozo_id, anio, mes, limit: limitParam } = req.query
      const limit = limitParam && typeof limitParam === 'string' ? parseInt(limitParam) : 100
      
      if (pozo_id && typeof pozo_id === 'string') {
        const result = await sql`
          SELECT pozo_id, pozo, contrato, empresa, departamento_id, departamento,
                 municipio_id, municipio, longitud, latitud, anio, mes,
                 dias, petroleo_bpd, gas_kpcd, agua_bpd, gas_lift_kpcd, gas_lift_kpcd_iny
          FROM produccion
          WHERE pozo_id = ${pozo_id}
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      } else if (municipio_id && typeof municipio_id === 'string') {
        const result = await sql`
          SELECT pozo_id, pozo, contrato, empresa, departamento_id, departamento,
                 municipio_id, municipio, longitud, latitud, anio, mes,
                 dias, petroleo_bpd, gas_kpcd, agua_bpd, gas_lift_kpcd, gas_lift_kpcd_iny
          FROM produccion
          WHERE municipio_id = ${municipio_id}
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      } else if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT pozo_id, pozo, contrato, empresa, departamento_id, departamento,
                 municipio_id, municipio, longitud, latitud, anio, mes,
                 dias, petroleo_bpd, gas_kpcd, agua_bpd, gas_lift_kpcd, gas_lift_kpcd_iny
          FROM produccion
          WHERE departamento_id = ${departamento_id}
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      } else {
        // Por defecto: obtener la producción más reciente
        const anioFiltro = anio && typeof anio === 'string' ? parseInt(anio) : 2024
        const mesFiltro = mes && typeof mes === 'string' ? parseInt(mes) : 12
        const result = await sql`
          SELECT pozo_id, pozo, contrato, empresa, departamento_id, departamento,
                 municipio_id, municipio, longitud, latitud, anio, mes,
                 dias, petroleo_bpd, gas_kpcd, agua_bpd, gas_lift_kpcd, gas_lift_kpcd_iny
          FROM produccion
          WHERE anio = ${anioFiltro} AND mes = ${mesFiltro}
          ORDER BY petroleo_bpd DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      }
    }

    // ========== PRODUCCION DEPARTAMENTAL ==========
    if (path === '/produccion-departamental' || path === '/produccion-departamental/') {
      const { departamento_id, anio } = req.query
      if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT departamento_id, departamento, anio, mes,
                 total_pozos, petroleo_bpd, gas_kpcd, agua_bpd
          FROM produccion_departamental
          WHERE departamento_id = ${departamento_id}
          ORDER BY anio DESC, mes DESC
        `
        return res.json(result.rows)
      } else if (anio && typeof anio === 'string') {
        const result = await sql`
          SELECT departamento_id, departamento, anio, mes,
                 total_pozos, petroleo_bpd, gas_kpcd, agua_bpd
          FROM produccion_departamental
          WHERE anio = ${parseInt(anio)}
          ORDER BY departamento, mes
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT departamento_id, departamento, anio, mes,
                 total_pozos, petroleo_bpd, gas_kpcd, agua_bpd
          FROM produccion_departamental
          ORDER BY anio DESC, mes DESC
          LIMIT 200
        `
        return res.json(result.rows)
      }
    }

    // ========== GEOMS DEPARTAMENTOS ==========
    if (path === '/geoms-departamentos' || path === '/geoms-departamentos/') {
      const { departamento_id } = req.query
      if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT departamento_id, departamento, geom
          FROM departamentos
          WHERE departamento_id = ${departamento_id}
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT departamento_id, departamento, geom
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
          SELECT municipio_id, municipio, departamento_id, departamento, geom
          FROM municipios
          WHERE municipio_id = ${municipio_id}
        `
        return res.json(result.rows)
      } else if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT municipio_id, municipio, departamento_id, departamento, geom
          FROM municipios
          WHERE departamento_id = ${departamento_id}
          ORDER BY municipio
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT municipio_id, municipio, departamento_id, departamento, geom
          FROM municipios
          ORDER BY departamento, municipio
        `
        return res.json(result.rows)
      }
    }

    // ========== ESTADISTICAS ==========
    if (path === '/estadisticas' || path === '/estadisticas/') {
      const [deptos, municipios, pozos, ultimaActualizacion] = await Promise.all([
        sql`SELECT COUNT(*)::int as count FROM departamentos`,
        sql`SELECT COUNT(*)::int as count FROM municipios`,
        sql`SELECT COUNT(DISTINCT pozo_id)::int as count FROM produccion`,
        sql`SELECT MAX(anio * 100 + mes) as ultimo FROM produccion`
      ])
      
      const ultimoPeriodo = ultimaActualizacion.rows[0]?.ultimo
      const anio = ultimoPeriodo ? Math.floor(ultimoPeriodo / 100) : null
      const mes = ultimoPeriodo ? ultimoPeriodo % 100 : null
      
      return res.json({
        total_departamentos: deptos.rows[0]?.count || 0,
        total_municipios: municipios.rows[0]?.count || 0,
        total_pozos: pozos.rows[0]?.count || 0,
        ultima_actualizacion: { anio, mes }
      })
    }

    // ========== DATOS ACGGP ==========
    if (path === '/datos-acggp' || path === '/datos-acggp/') {
      const { anio, mes, empresa } = req.query
      const limit = 100
      
      if (empresa && typeof empresa === 'string') {
        const result = await sql`
          SELECT id, empresa, anio, mes, petroleo_bpd, gas_kpcd
          FROM datos_acggp
          WHERE empresa ILIKE ${'%' + empresa + '%'}
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      } else if (anio && typeof anio === 'string' && mes && typeof mes === 'string') {
        const result = await sql`
          SELECT id, empresa, anio, mes, petroleo_bpd, gas_kpcd
          FROM datos_acggp
          WHERE anio = ${parseInt(anio)} AND mes = ${parseInt(mes)}
          ORDER BY petroleo_bpd DESC
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT id, empresa, anio, mes, petroleo_bpd, gas_kpcd
          FROM datos_acggp
          ORDER BY anio DESC, mes DESC
          LIMIT ${limit}
        `
        return res.json(result.rows)
      }
    }

    // ========== ACGGP DEPARTAMENTAL ==========
    if (path === '/acggp-departamental' || path === '/acggp-departamental/') {
      const { departamento_id, anio, mes } = req.query
      
      if (departamento_id && typeof departamento_id === 'string') {
        const result = await sql`
          SELECT id, departamento_id, departamento, anio, mes, petroleo_bpd, gas_kpcd
          FROM acggp_departamental
          WHERE departamento_id = ${departamento_id}
          ORDER BY anio DESC, mes DESC
        `
        return res.json(result.rows)
      } else if (anio && typeof anio === 'string' && mes && typeof mes === 'string') {
        const result = await sql`
          SELECT id, departamento_id, departamento, anio, mes, petroleo_bpd, gas_kpcd
          FROM acggp_departamental
          WHERE anio = ${parseInt(anio)} AND mes = ${parseInt(mes)}
          ORDER BY petroleo_bpd DESC
        `
        return res.json(result.rows)
      } else {
        const result = await sql`
          SELECT id, departamento_id, departamento, anio, mes, petroleo_bpd, gas_kpcd
          FROM acggp_departamental
          ORDER BY anio DESC, mes DESC
          LIMIT 200
        `
        return res.json(result.rows)
      }
    }

    // Ruta no encontrada
    return res.status(404).json({ error: 'Not Found', path })
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
