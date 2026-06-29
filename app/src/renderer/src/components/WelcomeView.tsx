import logo from '../assets/logo.png'
import type { Mode } from '../hooks/useChat'
import './WelcomeView.css'

const SUGGESTIONS = [
  { icon: '💡', label: 'Explain a concept', prompt: 'Explain how neural networks work' },
  { icon: '🔧', label: 'Debug code', prompt: 'Help me debug this Python error' },
  { icon: '📝', label: 'Summarise text', prompt: 'Summarise the following document' },
  { icon: '🚀', label: 'Write a script', prompt: 'Write a bash script to automate' }
]

type Props = {
  onNewChat: () => void
  model: string
  models: string[]
  onModelChange: (m: string) => void
  mode: Mode
  onModeChange: (m: Mode) => void
}

export default function WelcomeView({ onNewChat, model, models, onModelChange, mode, onModeChange }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <img src={logo} alt="Mach2" className="welcome-logo" />
        <h1 className="welcome-headline">
          What can I help<br />you with?
        </h1>
        <p className="welcome-sub">
          Running on <strong>{model || 'Ollama'}</strong> · <strong>{mode === 'harness' ? 'Harness' : 'Direct'}</strong> mode
        </p>
      </div>

      <div className="suggestions-grid">
        {SUGGESTIONS.map((s) => (
          <button key={s.label} className="suggestion-chip" onClick={onNewChat}>
            <span className="chip-icon">{s.icon}</span>
            <span className="chip-label">{s.label}</span>
          </button>
        ))}
      </div>

      {models.length > 0 && (
        <div className="model-row">
          <label className="model-label">Model</label>
          <select
            className="model-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
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
      )}
    </div>
  )
}
