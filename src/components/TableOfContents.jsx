import React from 'react'
import { useDiary } from '../state/useDiary'
import { useAuth, USERS } from '../state/useAuth'

const ITEMS = [
  { id: 'places', num: '01', title: 'Our Map', subtitle: 'Places we love & dream of' },
  { id: 'bucket', num: '02', title: 'Date Ideas', subtitle: 'Our shared bucket list' },
  { id: 'thoughts', num: '03', title: 'Shared Thoughts', subtitle: 'Little notes to each other' },
]

export default function TableOfContents() {
  const goTo = useDiary((s) => s.goTo)
  const user = useAuth((s) => s.user)
  const profile = user ? USERS[user] : null

  return (
    <div className="page-surface">
      <div className="corner-ribbon">~ Vol. 1 ~</div>
      <h1>Welcome{profile ? `, ${profile.label}` : ''}</h1>
      <div
        style={{
          fontFamily: 'var(--font-script)',
          fontSize: 28,
          color: 'var(--pink-deep)',
          marginBottom: 6,
        }}
      >
        Our little diary of us.
      </div>
      <h2>Contents</h2>
      <div className="toc">
        {ITEMS.map((it) => (
          <button key={it.id} className="toc-item" onClick={() => goTo(it.id)}>
            <span className="num">{it.num}</span>
            <div style={{ textAlign: 'left' }}>
              <div>{it.title}</div>
              <div
                style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: 16,
                  letterSpacing: 0,
                  textTransform: 'none',
                  opacity: 0.8,
                  marginTop: 4,
                }}
              >
                {it.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 'auto',
          fontFamily: 'var(--font-script)',
          fontSize: 26,
          color: 'var(--ink)',
          textAlign: 'right',
          opacity: 0.7,
        }}
      >
        ~ A & G ~
      </div>
    </div>
  )
}
