import './MessageBubble.css'

type Props = { role: 'user' | 'assistant'; content: string }

function renderContent(content: string) {
  // Split on fenced code blocks (```...```)
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const firstLine = part.indexOf('\n')
      const lang = firstLine > 3 ? part.slice(3, firstLine).trim() : ''
      const code = part.slice(firstLine + 1).replace(/```$/, '')
      return (
        <pre key={i} className="code-block">
          {lang && <span className="code-lang">{lang}</span>}
          <code>{code}</code>
        </pre>
      )
    }
    return (
      <span key={i} className="prose">
        {part}
      </span>
    )
  })
}

export default function MessageBubble({ role, content }: Props) {
  if (role === 'user') {
    return (
      <div className="row row-user">
        <div className="bubble-user">{content}</div>
      </div>
    )
  }
  return (
    <div className="row row-assistant">
      <div className="bubble-assistant">{renderContent(content)}</div>
    </div>
  )
}
