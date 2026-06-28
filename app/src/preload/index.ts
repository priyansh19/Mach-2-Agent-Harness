import { contextBridge, ipcRenderer } from 'electron'

const api = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  ollama: {
    chat: (model: string, messages: { role: string; content: string }[]) =>
      ipcRenderer.send('ollama:chat', { model, messages }),
    models: (): Promise<string[]> => ipcRenderer.invoke('ollama:models'),
    onChunk: (cb: (chunk: string) => void) =>
      ipcRenderer.on('ollama:chunk', (_, chunk) => cb(chunk)),
    onDone: (cb: () => void) => ipcRenderer.on('ollama:done', () => cb()),
    onError: (cb: (err: string) => void) =>
      ipcRenderer.on('ollama:error', (_, err) => cb(err)),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('ollama:chunk')
      ipcRenderer.removeAllListeners('ollama:done')
      ipcRenderer.removeAllListeners('ollama:error')
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
