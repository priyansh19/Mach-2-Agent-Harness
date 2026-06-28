import { useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'
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
}

export default function ChatView({ chat, model, models, onModelChange, onUpdateChat }: Props) {
  const { messages, setMessages, loading, send } = useChat(model)
  const bottomRef = useRef<HTMLDivElement>(null)

  // When switching chats, restore that chat's message history into the hook
  useEffect(() => {
    setMessages(chat.messages)
  }, [chat.id])

  // Bubble any message changes back up to App so the sidebar title updates
  useEffect(() => {
    if (messages.length > 0) onUpdateChat(messages)
  }, [messages])

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-view">
      {/* Model selector bar */}
      {models.length > 0 && (
        <div className="model-bar">
          <select
            className="model-bar-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Message thread */}
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
