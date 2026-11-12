import { spawn } from 'node:child_process'
import { createServer } from 'vite'

const server = await createServer({
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  logLevel: 'error',
})

await server.listen()

const child = spawn(process.execPath, ['tests/smoke.mjs'], {
  stdio: 'inherit',
  env: process.env,
})

const code = await new Promise((resolve) => child.on('exit', resolve))
await server.close()
process.exit(code ?? 1)
