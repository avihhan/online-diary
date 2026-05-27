import React, { useEffect, useState } from 'react'
import { useDiary } from '../../state/useDiary'
import { useAuth, USERS } from '../../state/useAuth'

function formatStamp(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function ThoughtsPage() {
  const thoughts = useDiary((s) => s.thoughts)
  const thoughtsLoaded = useDiary((s) => s.thoughtsLoaded)
  const thoughtsLoading = useDiary((s) => s.thoughtsLoading)
  const loadThoughts = useDiary((s) => s.loadThoughts)
  const addThought = useDiary((s) => s.addThought)
  const deleteThought = useDiary((s) => s.deleteThought)
  const user = useAuth((s) => s.user)
  const profile = user ? USERS[user] : null
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!thoughtsLoaded) loadThoughts()
  }, [thoughtsLoaded, loadThoughts])

  async function handleSend(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !user) return
    setSending(true)
    try {
      await addThought(text, user)
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-surface">
      <div className="corner-ribbon">~ Page 4 ~</div>
      <h1>Shared Thoughts</h1>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
          fontFamily: 'var(--font-script)',
          fontSize: 22,
        }}
      >
        <span className={`pencil ${profile?.tone || 'pink'}`} />
        <span>
          Writing as <strong style={{ color: profile?.color }}>{profile?.label || '...'}</strong>
        </span>
      </div>

      <form onSubmit={handleSend} style={{ marginBottom: 14 }}>
        <textarea
          className="thought-textarea"
          placeholder="A little note for us..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="submit"
            className={`retro-btn ${user === 'avi' ? 'blue' : ''}`}
            disabled={!draft.trim() || sending}
          >
            {sending ? 'Saving...' : 'Pin It'}
          </button>
        </div>
      </form>

      <h2>Our Notes</h2>
      <ul className="list">
        {thoughtsLoading && !thoughtsLoaded && <div className="loading">Loading thoughts...</div>}
        {thoughtsLoaded && thoughts.length === 0 && (
          <div className="empty">No thoughts yet. Be the first!</div>
        )}
        {thoughts.map((t) => {
          const tProfile = USERS[t.author] || USERS.gracelynn
          return (
            <li key={t.id} className="thought-card">
              <div className="head">
                <span className={`pencil ${tProfile.tone}`}>{tProfile.label}</span>
                <span className="meta" style={{ fontFamily: 'var(--font-pixel)', fontSize: 8 }}>
                  {formatStamp(t.createdAt)}
                </span>
              </div>
              <div className="body">{t.text}</div>
              {t.author === user && (
                <div style={{ textAlign: 'right' }}>
                  <button className="del" onClick={() => deleteThought(t.id)}>
                    delete
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
