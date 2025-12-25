import { createPool } from '@vercel/postgres'

// El pool de Vercel Postgres maneja automáticamente la conexión vía HTTP en el Edge
export const db = createPool()
