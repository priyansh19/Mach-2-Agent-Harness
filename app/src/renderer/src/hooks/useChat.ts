import { useState, useCallback, useRef } from 'react'
import type { Message } from '../App'

export type Mode = 'direct' | 'harness'

export function useChat(model: string, mode: Mode = 'direct') {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bufferRef = useRef('')
  const sessionIdRef = useRef('')

  const send = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: 'user', content: text }
      const history = [...messages, userMsg]
      setMessages([...history, { role: 'assistant', content: '' }])
      setLoading(true)

      if (mode === 'harness') {
        const result = await window.api.harness.chat(text, sessionIdRef.current)
        if (result.error) {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: `⚠️ ${result.error}` }
            return updated
          })
        } else {
          sessionIdRef.current = result.session_id ?? ''
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: result.answer ?? '' }
            return updated
          })
        }
        setLoading(false)
        return
      }

      // Direct mode — streaming
      bufferRef.current = ''
      window.api.ollama.removeAllListeners()

      window.api.ollama.onChunk((chunk) => {
        bufferRef.current += chunk
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: bufferRef.current }
          return updated
        })
      })

      window.api.ollama.onDone(() => {
        setLoading(false)
        window.api.ollama.removeAllListeners()
      })

      window.api.ollama.onError((err) => {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: `⚠️ ${err}` }
          return updated
        })
        setLoading(false)
        window.api.ollama.removeAllListeners()
      })

      window.api.ollama.chat(model, history)
    },
    [messages, model, mode]
  )

  return { messages, setMessages, loading, send, sessionIdRef }
}
