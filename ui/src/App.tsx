import { useState, useRef, useCallback } from 'react'
import { useChat, type Mode } from './hooks/useChat'
import ChatPanel from './components/ChatPanel'
import Inspector from './components/Inspector'
import './App.css'

export default function App() {
  const { mode, switchMode, messages, loading, inspector, send, clear } = useChat()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(() => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    send(text)
  }, [input, loading, send])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const changeMode = (m: Mode) => { switchMode(m); inputRef.current?.focus() }

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-logo">Mach2</span>
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'direct' ? 'active' : ''}`} onClick={() => changeMode('direct')}>
            Direct
          </button>
          <button className={`mode-btn ${mode === 'harness' ? 'active' : ''}`} onClick={() => changeMode('harness')}>
            Harness
          </button>
        </div>
        <span className="topbar-model">ornith:9b</span>
        <button className="clear-btn" onClick={clear} title="Clear chat">✕ Clear</button>
      </header>

      <div className="body">
        <ChatPanel messages={messages} loading={loading} />
        <Inspector state={inspector} />
      </div>

      <div className="input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={loading ? 'Waiting for response…' : 'Type a message and press Enter…'}
          disabled={loading}
          autoFocus
        />
        <button className="send-btn" onClick={submit} disabled={loading || !input.trim()}>
          {loading ? '…' : '↵'}
        </button>
      </div>
    </div>
  )
}
