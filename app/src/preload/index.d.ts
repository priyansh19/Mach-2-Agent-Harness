declare global {
  interface Window {
    api: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      ollama: {
        chat: (model: string, messages: { role: string; content: string }[]) => void
        models: () => Promise<string[]>
        onChunk: (cb: (chunk: string) => void) => void
        onDone: (cb: () => void) => void
        onError: (cb: (err: string) => void) => void
        removeAllListeners: () => void
      }
      harness: {
        chat: (message: string, sessionId: string) => Promise<{ answer?: string; session_id?: string; error?: string }>
      }
    }
  }
}
