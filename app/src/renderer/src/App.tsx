import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import WelcomeView from './components/WelcomeView'
import ChatView from './components/ChatView'
import './App.css'

export type Message = { role: 'user' | 'assistant'; content: string }
export type Chat = { id: string; title: string; messages: Message[] }

export default function App() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [model, setModel] = useState('gemma4:latest')
  const [models, setModels] = useState<string[]>([])

  useEffect(() => {
    window.api.ollama.models().then((m) => {
      setModels(m)
      if (m.length > 0) setModel(m[0])
    })
  }, [])

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null

  function newChat() {
    const chat: Chat = { id: crypto.randomUUID(), title: 'New chat', messages: [] }
    setChats((prev) => [chat, ...prev])
    setActiveChatId(chat.id)
  }

  function updateChat(id: string, messages: Message[]) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const title = messages.find((m) => m.role === 'user')?.content.slice(0, 42) ?? 'New chat'
        return { ...c, title, messages }
      })
    )
  }

  return (
    <div className="app-root">
      {/* Frameless title bar — draggable except the window control buttons */}
      <div className="titlebar" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <span className="titlebar-brand">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" fill="#cc785c" />
          </svg>
          Mach2
        </span>
        <div
          className="titlebar-controls"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button className="tb-btn" onClick={() => window.api.window.minimize()} title="Minimise">
            <span>─</span>
          </button>
          <button className="tb-btn" onClick={() => window.api.window.maximize()} title="Maximise">
            <span>□</span>
          </button>
          <button
            className="tb-btn tb-close"
            onClick={() => window.api.window.close()}
            title="Close"
          >
            <span>✕</span>
          </button>
        </div>
      </div>

      <div className="app-body">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={newChat}
          onSelectChat={setActiveChatId}
        />
        <main className="main-area">
          {activeChat ? (
            <ChatView
              chat={activeChat}
              model={model}
              models={models}
              onModelChange={setModel}
              onUpdateChat={(msgs) => updateChat(activeChat.id, msgs)}
            />
          ) : (
            <WelcomeView
              onNewChat={newChat}
              model={model}
              models={models}
              onModelChange={setModel}
            />
          )}
        </main>
      </div>
    </div>
  )
}
