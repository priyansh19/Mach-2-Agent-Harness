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
}

export default function WelcomeView({ onNewChat, model, models, onModelChange }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        {/* Anthropic-style spike mark */}
        <svg className="spike-mark" width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 0L18.4 13.6L32 16L18.4 18.4L16 32L13.6 18.4L0 16L13.6 13.6L16 0Z"
            fill="#cc785c"
          />
        </svg>
        <h1 className="welcome-headline">
          What can I help<br />you with?
        </h1>
        <p className="welcome-sub">
          Running on <strong>{model || 'Ollama'}</strong>
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
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
