import React, { useEffect, useState } from 'react'
import { useDiary } from '../../state/useDiary'
import { useAuth, USERS } from '../../state/useAuth'

export default function BucketListPage() {
  const bucket = useDiary((s) => s.bucket)
  const bucketLoaded = useDiary((s) => s.bucketLoaded)
  const bucketLoading = useDiary((s) => s.bucketLoading)
  const loadBucket = useDiary((s) => s.loadBucket)
  const addBucket = useDiary((s) => s.addBucket)
  const toggleBucket = useDiary((s) => s.toggleBucket)
  const deleteBucket = useDiary((s) => s.deleteBucket)
  const user = useAuth((s) => s.user)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!bucketLoaded) loadBucket()
  }, [bucketLoaded, loadBucket])

  async function handleAdd(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !user) return
    setDraft('')
    await addBucket(text, user)
  }

  const sorted = [...bucket].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })

  return (
    <div className="page-surface">
      <div className="corner-ribbon">~ Page 3 ~</div>
      <h1>Date Ideas</h1>
      <div
        style={{
          fontFamily: 'var(--font-script)',
          fontSize: 22,
          color: 'var(--pink-deep)',
          marginBottom: 12,
        }}
      >
        Things we wanna do together &lt;3
      </div>

      <form
        onSubmit={handleAdd}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <input
          className="retro-input"
          placeholder="A new date idea..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          style={{ flex: '1 1 180px', minWidth: 0 }}
        />
        <button
          type="submit"
          className={`retro-btn ${user === 'avi' ? 'blue' : ''}`}
          disabled={!draft.trim()}
          style={{ flex: '0 0 auto' }}
        >
          Add
        </button>
      </form>

      <ul className="list">
        {bucketLoading && !bucketLoaded && <div className="loading">Loading list...</div>}
        {bucketLoaded && sorted.length === 0 && (
          <div className="empty">No ideas yet. Type one above!</div>
        )}
        {sorted.map((b) => {
          const profile = USERS[b.addedBy] || USERS.gracelynn
          return (
            <li key={b.id} className={`list-item ${b.checked ? 'done' : ''}`}>
              <input
                type="checkbox"
                className="retro-check"
                checked={b.checked}
                onChange={(e) => toggleBucket(b.id, e.target.checked, user)}
              />
              <span className={`pencil ${profile.tone}`} title={`Added by ${profile.label}`} />
              <div className="text">
                <div style={{ fontSize: 20 }}>{b.text}</div>
                {b.checked && b.checkedBy && (
                  <div className="meta">checked off by {USERS[b.checkedBy]?.label || b.checkedBy}</div>
                )}
              </div>
              <button className="del" onClick={() => deleteBucket(b.id)}>
                x
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
