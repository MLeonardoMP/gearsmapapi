import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const app = new Hono()
    app.get('/health', (c) => c.json({ status: 'ok' }))

    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})
