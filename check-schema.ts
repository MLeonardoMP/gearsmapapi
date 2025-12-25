import 'dotenv/config'
import { sql } from '@vercel/postgres'

async function checkSchema() {
  // Verificar columnas de departamentos
  const deptosCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'departamentos'
    ORDER BY ordinal_position
  `
  console.log('Columnas de departamentos:')
  console.log(deptosCols.rows.map(r => r.column_name))

  // Verificar columnas de municipios
  const munisCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'municipios'
    ORDER BY ordinal_position
  `
  console.log('\nColumnas de municipios:')
  console.log(munisCols.rows.map(r => r.column_name))

  // Verificar columnas de produccion
  const prodCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'produccion'
    ORDER BY ordinal_position
  `
  console.log('\nColumnas de produccion:')
  console.log(prodCols.rows.map(r => r.column_name))

  process.exit(0)
}

checkSchema()
