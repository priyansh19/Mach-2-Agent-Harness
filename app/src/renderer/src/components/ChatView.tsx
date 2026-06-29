import { useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'
import type { Mode } from '../hooks/useChat'
import type { Chat, Message } from '../App'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import './ChatView.css'

type Props = {
  chat: Chat
  model: string
  models: string[]
  onModelChange: (m: string) => void
  onUpdateChat: (msgs: Message[]) => void
  mode: Mode
  onModeChange: (m: Mode) => void
}

export default function ChatView({ chat, model, models, onModelChange, onUpdateChat, mode, onModeChange }: Props) {
  const { messages, setMessages, loading, send } = useChat(model, mode)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(chat.messages)
  }, [chat.id])

  useEffect(() => {
    if (messages.length > 0) onUpdateChat(messages)
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-view">
      <div className="model-bar">
        {models.length > 0 && (
          <select
            className="model-bar-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
        <div className="mode-toggle">
          <button
            className={`mode-btn${mode === 'direct' ? ' active' : ''}`}
            onClick={() => onModeChange('direct')}
          >
            Direct
          </button>
          <button
            className={`mode-btn${mode === 'harness' ? ' active' : ''}`}
            onClick={() => onModeChange('harness')}
          >
            Harness
          </button>
        </div>
      </div>

      <div className="messages-scroll">
        <div className="messages-inner">
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && messages[messages.length - 1]?.content === '' && (
            <div className="thinking-dots">
              <span /><span /><span />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={send} disabled={loading} />
    </div>
  )
}
