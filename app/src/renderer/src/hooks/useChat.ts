import { useState, useCallback, useRef } from 'react'
import type { Message } from '../App'

export function useChat(model: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bufferRef = useRef('')

  const send = useCallback(
    (text: string) => {
      const userMsg: Message = { role: 'user', content: text }
      const history = [...messages, userMsg]

      // Append user message + empty assistant placeholder
      setMessages([...history, { role: 'assistant', content: '' }])
      setLoading(true)
      bufferRef.current = ''

      window.api.ollama.removeAllListeners()

      // Each chunk arrives as a token string — append to the buffer, update last message
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
    [messages, model]
  )

  return { messages, setMessages, loading, send }
}
