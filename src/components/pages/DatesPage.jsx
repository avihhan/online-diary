import React, { useEffect, useMemo, useState } from 'react'
import { useDiary } from '../../state/useDiary'
import { useAuth, USERS } from '../../state/useAuth'
import RetroCalendar, { toIsoDate } from '../RetroCalendar'
import { playClick, playSelect, playError } from '../../utils/sounds'

function prettyDate(iso) {
  if (!iso) return ''
  try {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function daysUntil(iso) {
  if (!iso) return null
  try {
    const [y, m, d] = iso.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diff = Math.round((target - today) / 86400000)
    return diff
  } catch {
    return null
  }
}

function daysLabel(n) {
  if (n == null) return ''
  if (n === 0) return 'today!'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  if (n > 1) return `in ${n} days`
  return `${Math.abs(n)} days ago`
}

export default function DatesPage() {
  const dates = useDiary((s) => s.dates)
  const datesLoaded = useDiary((s) => s.datesLoaded)
  const datesLoading = useDiary((s) => s.datesLoading)
  const loadDates = useDiary((s) => s.loadDates)
  const addDate = useDiary((s) => s.addDate)
  const deleteDate = useDiary((s) => s.deleteDate)
  const user = useAuth((s) => s.user)

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [picked, setPicked] = useState(toIsoDate(new Date()))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!datesLoaded) loadDates()
  }, [datesLoaded, loadDates])

  const markedDates = useMemo(() => new Set(dates.map((d) => d.date)), [dates])

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    const t = title.trim()
    if (!t) {
      setErr('Give it a title')
      playError()
      return
    }
    if (!picked) {
      setErr('Pick a date')
      playError()
      return
    }
    setSaving(true)
    try {
      await addDate({ title: t, date: picked, notes: notes.trim(), addedBy: user })
      playSelect()
      setTitle('')
      setNotes('')
    } catch (e2) {
      setErr('Could not save. Try again.')
      playError()
    } finally {
      setSaving(false)
    }
  }

  const sortedDates = useMemo(() => {
    // Sort by upcoming first (today+future), then past in reverse
    const today = toIsoDate(new Date())
    const upcoming = []
    const past = []
    for (const d of dates) {
      if ((d.date || '') >= today) upcoming.push(d)
      else past.push(d)
    }
    upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    past.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return [...upcoming, ...past]
  }, [dates])

  return (
    <div className="page-surface">
      <div className="corner-ribbon">~ Page 4 ~</div>
      <h1>Important Dates</h1>
      <div
        style={{
          fontFamily: 'var(--font-script)',
          fontSize: 22,
          color: 'var(--pink-deep)',
          marginBottom: 10,
        }}
      >
        Anniversaries, milestones, little reminders.
      </div>

      <div className="dates-grid">
        <RetroCalendar
          value={picked}
          onChange={(iso) => setPicked(iso)}
          markedDates={markedDates}
          onSound={playClick}
        />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <input
            className="retro-input"
            placeholder="Title (e.g. Our anniversary)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            style={{ fontSize: 16 }}
          />
          <textarea
            className="thought-textarea"
            placeholder="Notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            style={{ minHeight: 60, fontSize: 16 }}
          />
          {err && <div style={{ color: '#b32d57', fontFamily: 'var(--font-pixel)', fontSize: 9 }}>{err}</div>}
          <button
            type="submit"
            className={`retro-btn ${user === 'avi' ? 'blue' : ''}`}
            disabled={saving}
          >
            {saving ? 'Saving...' : '★ Add Date'}
          </button>
        </form>
      </div>

      <h2>Saved</h2>
      <ul className="list">
        {datesLoading && !datesLoaded && <div className="loading">Loading dates...</div>}
        {datesLoaded && sortedDates.length === 0 && (
          <div className="empty">No dates yet. Pick one on the calendar and add it!</div>
        )}
        {sortedDates.map((d) => {
          const profile = USERS[d.addedBy] || USERS.gracelynn
          const n = daysUntil(d.date)
          const isPast = n != null && n < 0
          return (
            <li key={d.id} className="list-item" style={{ opacity: isPast ? 0.7 : 1 }}>
              <span className={`pencil ${profile.tone}`} title={`Added by ${profile.label}`} />
              <div className="text">
                <div style={{ fontSize: 18 }}>{d.title}</div>
                <div className="meta">
                  {prettyDate(d.date)} · {daysLabel(n)}
                </div>
                {d.notes && (
                  <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: 16, marginTop: 4, opacity: 0.85 }}>
                    {d.notes}
                  </div>
                )}
              </div>
              <button
                className="del"
                title="Delete"
                onClick={() => {
                  playClick()
                  deleteDate(d.id)
                }}
              >
                x
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
