const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { Client } = require('pg')
const live = require('./live.cjs')

const isDev = !app.isPackaged && process.env.SERMS_DEV !== '0'
let mainWindow = null

function readIni() {
  const candidates = [
    process.env.SERMS_INI,
    path.join(path.dirname(app.getPath('exe')), 'srgb.ini'),
    path.join(process.resourcesPath || '', 'srgb.ini'),
    path.join(__dirname, '..', '..', 'srgb.ini'),
    path.join(process.cwd(), 'srgb.ini'),
    path.join(process.cwd(), 'config', 'srgb.ini'),
    path.join(process.cwd(), 'release', 'win-unpacked', 'resources', 'srgb.ini'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8')
        const values = {}
        let section = ''
        for (const rawLine of text.split(/\r?\n/)) {
          const line = rawLine.trim()
          if (!line || line.startsWith(';') || line.startsWith('#')) continue
          if (line.startsWith('[') && line.endsWith(']')) {
            section = line.slice(1, -1).toLowerCase()
            continue
          }
          const separator = line.indexOf('=')
          if (separator === -1) continue
          const key = line.slice(0, separator).trim().toLowerCase()
          values[`${section}.${key}`] = line.slice(separator + 1).trim()
        }
        return {
          path: candidate,
          host: values['settings.pghostname'] || 'localhost',
          port: Number(values['settings.pgport'] || 5432),
          database: values['settings.pgdbname'] || 'dbspc',
        }
      }
    } catch {
      // Keep looking for a readable configuration file.
    }
  }

  return null
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#f6f1e8',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    show: false,
    autoHideMenuBar: true,
    title: "SERMS Modern · St. Peter's College",
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? url.startsWith('http://127.0.0.1:5173') : url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })
}

app.whenReady().then(() => {
  app.setAppUserModelId('ph.edu.spc.serms')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('app:info', () => {
  const config = readIni()
  return {
    name: 'SERMS Modern',
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
    dataMode: 'demo',
    config: config
      ? {
          path: config.path.replace(/^.*[\\/]/, ''),
          host: config.host,
          port: config.port,
          database: config.database,
        }
      : null,
  }
})

ipcMain.handle('live:connect', async (_event, credentials) => {
  const config = readIni()
  if (!config) return { ok: false, message: 'srgb.ini was not found.' }
  if (!credentials?.username || !credentials?.password) {
    return { ok: false, message: 'Enter your PostgreSQL username and password.' }
  }
  try {
    const data = await live.connect(config, credentials)
    return { ok: true, ...data }
  } catch (error) {
    const networkIssue =
      /timeout|getaddrinfo|connect|network|unreachable/i.test(String(error?.message || '')) ||
      ['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND'].includes(error?.code)
    const authIssue = error?.code === '28P01' || /password authentication failed/i.test(String(error?.message || ''))
    const encodingIssue =
      error?.code === '22021' || /invalid byte sequence for encoding/i.test(String(error?.message || ''))
    return {
      ok: false,
      message: networkIssue
        ? `The school server is not reachable at ${config.host}:${config.port}. Check the school Wi-Fi and try again.`
        : authIssue
          ? 'The school server rejected that username or password.'
          : encodingIssue
            ? 'The school database contains text that is not valid UTF-8. The app tried its Latin-1 fallback; ask the database administrator to confirm the server encoding.'
            : `The live records could not be loaded: ${error?.message || 'unknown database error'}`,
    }
  }
})

ipcMain.handle('live:refresh', async () => {
  try {
    return { ok: true, ...(await live.bootstrap()) }
  } catch (error) {
    return { ok: false, message: error?.message || 'The live records could not be refreshed.' }
  }
})

ipcMain.handle('live:assessment', async (_event, studid) => {
  try {
    return { ok: true, lines: await live.assessmentLinesFor(studid) }
  } catch (error) {
    return { ok: false, message: error?.message || 'The assessment fee lines could not be loaded.' }
  }
})

ipcMain.handle('live:saveGrades', async (_event, payload) => {
  try {
    const result = await live.saveGrades(payload)
    return { ok: true, ...result }
  } catch (error) {
    return { ok: false, message: error?.message || 'The grades could not be saved.' }
  }
})

ipcMain.handle('live:disconnect', async () => {
  await live.disconnect()
  return { ok: true }
})

ipcMain.handle('db:test', async (_event, credentials) => {
  const config = readIni()
  if (!config) {
    return { ok: false, message: 'srgb.ini was not found next to the app or in the SERMS folder.' }
  }
  if (!credentials?.username || !credentials?.password) {
    return { ok: false, message: 'Enter your PostgreSQL username and password.' }
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: credentials.username,
    password: credentials.password,
    connectionTimeoutMillis: 7000,
    statement_timeout: 7000,
  })

  try {
    await client.connect()
    const result = await client.query(
      'select current_user as username, current_database() as database, version() as version',
    )
    const row = result.rows[0]

    let preview = null
    try {
      const termResult = await client.query(
        'select sy, sem from srgb.semester where current order by sy desc, sem desc limit 1',
      )
      const term = termResult.rows[0]
      const counts = await client.query(
        `select
           (select count(*) from srgb.student) as students,
           (select count(*) from srgb.semstudent where sy = $1 and sem = $2) as enrolled`,
        term ? [term.sy, term.sem] : ['', ''],
      )
      preview = {
        students: Number(counts.rows[0].students),
        enrolled: Number(counts.rows[0].enrolled),
        term: term ? { sy: String(term.sy).trim(), sem: String(term.sem).trim() } : null,
      }
    } catch {
      // A connection can still be valid before the live schema queries are wired.
    }

    return {
      ok: true,
      message: `Connected to ${row.database} as ${row.username}.`,
      serverVersion: String(row.version || '').split(' ').slice(0, 2).join(' '),
      config: { host: config.host, port: config.port, database: config.database },
      preview,
    }
  } catch (error) {
    const networkCodes = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND'])
    const networkIssue =
      networkCodes.has(error?.code) ||
      /timeout|getaddrinfo|connect|network|unreachable/i.test(String(error?.message || ''))
    return {
      ok: false,
      message: networkIssue
        ? `The school server is not reachable at ${config.host}:${config.port}. Check the school Wi-Fi and try again.`
        : 'The server could not complete the sign-in. Check the username, password, and database.',
      code: error?.code,
    }
  } finally {
    await client.end().catch(() => {})
  }
})
