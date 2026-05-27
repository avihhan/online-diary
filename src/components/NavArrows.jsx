import React from 'react'
import { useDiary, PAGE_NAMES } from '../state/useDiary'
import { playClick } from '../utils/sounds'

export default function NavArrows() {
  const { pageIndex, prev, next, goTo } = useDiary()
  const isFirst = pageIndex === 0
  const isLast = pageIndex === PAGE_NAMES.length - 1

  const handle = (fn) => () => {
    playClick()
    fn()
  }

  return (
    <div className="nav-arrows">
      <button className="retro-btn ghost" disabled={isFirst} onClick={handle(prev)}>
        ◀ Prev
      </button>
      <button className="retro-btn" onClick={handle(() => goTo('toc'))}>
        ★ Contents
      </button>
      <button className="retro-btn blue" disabled={isLast} onClick={handle(next)}>
        Next ▶
      </button>
    </div>
  )
}
