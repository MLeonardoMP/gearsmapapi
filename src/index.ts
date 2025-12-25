import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

// Importar rutas
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

// Middleware de Cache (1 hora por defecto para datos geográficos)
app.use('*', async (c, next) => {
  await next()
  if (c.res.status === 200) {
    c.res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  }
})

// Registro de Rutas
app.route('/datos-acggp', datosAcggp)
app.route('/departamentos', departamentos)
app.route('/geoms-departamentos', geomsDepartamentos)
app.route('/acggp-departamental', acggpDepartamental)
app.route('/estadisticas-departamentales', estadisticas)
app.route('/municipios', municipios)
app.route('/geoms-municipios', geomsMunicipios)
app.route('/produccion', produccion)
app.route('/produccion-departamental', produccionDepartamental)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', runtime: 'edge' }))

export const runtime = 'edge'

export const GET = handle(app)
export const POST = handle(app)
export const OPTIONS = handle(app)
