const { spawn } = require('node:child_process')
const electron = require('electron')

delete process.env.ELECTRON_RUN_AS_NODE

const child = spawn(electron, ['electron/main.cjs'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code) => process.exit(code ?? 0))
