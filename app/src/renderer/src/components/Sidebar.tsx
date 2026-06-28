import type { Chat } from '../App'
import './Sidebar.css'

type Props = {
  chats: Chat[]
  activeChatId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
}

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat }: Props) {
  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        New chat
      </button>

      <div className="chat-list">
        {chats.length === 0 ? (
          <p className="chat-empty">No conversations yet</p>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <svg
                className="chat-icon"
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
              >
                <path
                  d="M11.5 8.5a1 1 0 01-1 1h-7l-2 2V2a1 1 0 011-1h8a1 1 0 011 1v6.5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="chat-title">{chat.title}</span>
            </button>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-row">
          <div className="user-avatar">P</div>
          <span className="user-name">Priyansh</span>
        </div>
      </div>
    </aside>
  )
}
