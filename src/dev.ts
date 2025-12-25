import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

// Importar rutas (usando la misma lógica que index.ts)
import datosAcggp from './routes/datos-acggp'
import departamentos from './routes/departamentos'
import geomsDepartamentos from './routes/geoms-departamentos'
import acggpDepartamental from './routes/acggp-departamental'
import estadisticas from './routes/estadisticas'
import municipios from './routes/municipios'
import geomsMunicipios from './routes/geoms-municipios'
import produccion from './routes/produccion'
import produccionDepartamental from './routes/produccion-departamental'

const app = new Hono().basePath('/api')

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors())

// Middleware de Cache (Simulado para dev)
app.use('*', async (c, next) => {
  await next()
  c.res.headers.set('X-Cache-Status', 'HIT-MOCK')
})

app.route('/datos-acggp', datosAcggp)
app.route('/departamentos', departamentos)
app.route('/geoms-departamentos', geomsDepartamentos)
app.route('/acggp-departamental', acggpDepartamental)
app.route('/estadisticas-departamentales', estadisticas)
app.route('/municipios', municipios)
app.route('/geoms-municipios', geomsMunicipios)
app.route('/produccion', produccion)
app.route('/produccion-departamental', produccionDepartamental)

app.get('/health', (c) => c.json({ status: 'ok', environment: 'local-dev' }))

console.log('🚀 Servidor de prueba corriendo en http://localhost:3002')

serve({
  fetch: app.fetch,
  port: 3002,
})
