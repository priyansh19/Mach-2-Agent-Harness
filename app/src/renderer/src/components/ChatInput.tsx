import { useState, useRef, type KeyboardEvent } from 'react'
import './ChatInput.css'

type Props = { onSend: (text: string) => void; disabled: boolean }

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function autoResize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const canSend = !!text.trim() && !disabled

  return (
    <div className="input-wrap">
      <div className={`input-card ${disabled ? 'input-busy' : ''}`}>
        <textarea
          ref={ref}
          className="input-ta"
          placeholder="Message Mach2…"
          value={text}
          rows={1}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onInput={autoResize}
        />
        <button
          className={`send-btn ${canSend ? 'send-active' : ''}`}
          onClick={submit}
          disabled={!canSend}
          title="Send (Enter)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12V2M2 7l5-5 5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <p className="input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
