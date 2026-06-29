import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { Langfuse } from 'langfuse'

const langfuse = new Langfuse({
  publicKey: 'pk-lf-f1ff4a91-5511-46d9-b3f2-f3db49112808',
  secretKey: 'sk-lf-6c61058f-a568-430f-93e6-598415159fd0',
  baseUrl: 'http://localhost:3000'
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#181715',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Title bar controls ────────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.isMaximized() ? win.unmaximize() : win?.maximize()
})
ipcMain.on('window:close', () => BrowserWindow.getFocusedWindow()?.close())

// ── Ollama: list available models ─────────────────────────────────────────────
ipcMain.handle('ollama:models', async () => {
  try {
    const res = await fetch('http://localhost:11434/api/tags')
    const data = (await res.json()) as { models?: { name: string }[] }
    return data.models?.map((m) => m.name) ?? []
  } catch {
    return []
  }
})

// ── Ollama: streaming chat ────────────────────────────────────────────────────
ipcMain.on('ollama:chat', async (event, { model, messages }) => {
  const trace = langfuse.trace({ name: 'ui-direct-chat', input: messages, tags: ['direct', 'ollama'], metadata: { model } })
  const generation = trace.generation({ name: 'ollama-completion', model, input: messages })
  let fullOutput = ''

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true })
    })

    if (!response.ok || !response.body) {
      generation.end({ output: `ERROR: Ollama returned ${response.status}`, level: 'ERROR' })
      await langfuse.flushAsync()
      event.sender.send('ollama:error', `Ollama returned ${response.status}`)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as { message?: { content: string }; done?: boolean }
          if (data.message?.content) {
            fullOutput += data.message.content
            event.sender.send('ollama:chunk', data.message.content)
          }
          if (data.done) event.sender.send('ollama:done')
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    generation.end({ output: fullOutput })
    await langfuse.flushAsync()
  } catch (err) {
    generation.end({ output: String(err), level: 'ERROR' })
    await langfuse.flushAsync()
    event.sender.send('ollama:error', String(err))
  }
})

// ── Harness: single-turn chat via FastAPI ─────────────────────────────────────
ipcMain.handle('harness:chat', async (_event, { message, sessionId }) => {
  try {
    const res = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId || '' })
    })
    if (!res.ok) return { error: `Harness server returned ${res.status}` }
    return await res.json()
  } catch (err) {
    return { error: String(err) }
  }
})

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('com.mach2')
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
