async function test() {
  const baseUrl = 'http://localhost:3001/api'

  const endpoints = ['/health', '/datos-acggp?departamento_id=05', '/departamentos']

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint}...`)
      const res = await fetch(baseUrl + endpoint)
      const data = await res.json()
      console.log(`Status: ${res.status}`)
      const headersObj: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headersObj[key] = value
      })
      console.log(`Headers:`, headersObj)
      console.log(`Data:`, JSON.stringify(data).substring(0, 100) + '...')
    } catch (err) {
      console.error(`Error testing ${endpoint}:`, err instanceof Error ? err.message : String(err))
    }
  }
}

test()
