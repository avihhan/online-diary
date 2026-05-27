import React, { useMemo, useState } from 'react'

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toIsoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfMonth(year, month) {
  return new Date(year, month, 1)
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Retro pixel-styled month calendar. The user clicks a day to select it; the
 * `markedDates` Set marks days that already have an important date attached so
 * we can render a heart on them.
 */
export default function RetroCalendar({ value, onChange, markedDates = new Set(), onSound }) {
  const today = useMemo(() => new Date(), [])
  const initial = value ? new Date(value) : today
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  // Collapsed by default so the calendar doesn't dominate small screens.
  // On desktop the CSS keeps the body visible regardless of this flag.
  const [collapsed, setCollapsed] = useState(true)

  const firstDay = startOfMonth(viewYear, viewMonth)
  const startWeekday = firstDay.getDay()
  const numDays = daysInMonth(viewYear, viewMonth)

  const cells = []
  for (let i = 0; i < startWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= numDays; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayIso = toIsoDate(today)
  const selectedIso = value || ''

  function shiftMonth(delta) {
    onSound?.()
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  function toggleCollapsed() {
    onSound?.()
    setCollapsed((c) => !c)
  }

  const bodyId = 'retro-cal-body'

  return (
    <div className={`retro-cal ${collapsed ? 'retro-cal--collapsed' : ''}`}>
      <div className="retro-cal__head">
        <button type="button" className="retro-cal__nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ◀
        </button>
        <button
          type="button"
          className="retro-cal__title"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? 'Show calendar' : 'Hide calendar'}
        >
          <span className="retro-cal__title-month">
            {viewYear}-{pad(viewMonth + 1)}
          </span>
          {selectedIso && (
            <span className="retro-cal__title-pick" aria-hidden>
              ♥ {selectedIso}
            </span>
          )}
          <span className="retro-cal__chev" aria-hidden>{collapsed ? '▼' : '▲'}</span>
        </button>
        <button type="button" className="retro-cal__nav" onClick={() => shiftMonth(1)} aria-label="Next month">
          ▶
        </button>
      </div>

      <div id={bodyId} className="retro-cal__body">
        <div className="retro-cal__row retro-cal__row--head">
          {WEEK_DAYS.map((d, i) => (
            <div key={i} className="retro-cal__dow">{d}</div>
          ))}
        </div>

        <div className="retro-cal__grid">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`e-${idx}`} className="retro-cal__cell retro-cal__cell--empty" />
            }
            const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
            const isToday = iso === todayIso
            const isSelected = iso === selectedIso
            const hasEvent = markedDates.has(iso)
            return (
              <button
                key={iso}
                type="button"
                className={[
                  'retro-cal__cell',
                  isToday ? 'retro-cal__cell--today' : '',
                  isSelected ? 'retro-cal__cell--selected' : '',
                  hasEvent ? 'retro-cal__cell--event' : '',
                ].join(' ')}
                onClick={() => {
                  onSound?.()
                  onChange?.(iso)
                }}
              >
                <span className="retro-cal__num">{day}</span>
                {hasEvent && <span className="retro-cal__heart" aria-hidden>♥</span>}
              </button>
            )
          })}
        </div>

        <div className="retro-cal__foot">
          <div className="retro-cal__selected">
            {selectedIso ? `Picked: ${selectedIso}` : 'Pick a date'}
          </div>
        </div>
      </div>
    </div>
  )
}
