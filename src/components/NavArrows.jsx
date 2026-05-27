import React from 'react'
import { useDiary, PAGE_NAMES } from '../state/useDiary'

export default function NavArrows() {
  const { pageIndex, prev, next, goTo } = useDiary()
  const isFirst = pageIndex === 0
  const isLast = pageIndex === PAGE_NAMES.length - 1

  return (
    <div className="nav-arrows">
      <button className="retro-btn ghost" disabled={isFirst} onClick={prev}>
        ◀ Prev
      </button>
      <button className="retro-btn" onClick={() => goTo('toc')}>
        ★ Contents
      </button>
      <button className="retro-btn blue" disabled={isLast} onClick={next}>
        Next ▶
      </button>
    </div>
  )
}
