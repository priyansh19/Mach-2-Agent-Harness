import { useEffect, useRef } from 'react'
import type { Message } from '../hooks/useChat'
import './ChatPanel.css'

export default function ChatPanel({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-panel">
      {messages.length === 0 && (
        <p className="chat-empty">Send a message to start. Switch modes with the toolbar above.</p>
      )}
      {messages.map((m, i) => (
        <div key={i} className={`bubble bubble-${m.role}`}>
          <span className="bubble-label">{m.role === 'user' ? 'You' : 'ornith'}</span>
          {!m.content && loading && i === messages.length - 1
            ? <span className="bubble-text bubble-loading"><span className="spinner" />Processing…</span>
            : <span className="bubble-text">{m.content}</span>
          }
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
