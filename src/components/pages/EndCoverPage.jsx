import React from 'react'
import { useDiary } from '../../state/useDiary'
import { playClick } from '../../utils/sounds'

export default function EndCoverPage() {
  const goTo = useDiary((s) => s.goTo)
  const year = new Date().getFullYear()

  return (
    <div className="page-surface end-cover">
      <div className="corner-ribbon">~ Fin ~</div>

      <h1 className="end-cover__title">The End &#9829;</h1>

      <div
        style={{
          fontFamily: 'var(--font-script)',
          fontSize: 24,
          color: 'var(--pink-deep)',
          textAlign: 'center',
          marginBottom: 'clamp(8px, 1.4vh, 14px)',
        }}
      >
        Closing the diary&hellip; for now.
      </div>

      <div className="end-cover__frame">
        <img
          src="/images/avi-and-gracelynn.png"
          alt="Pixel-art portrait of Avi and Gracelynn"
          className="end-cover__portrait"
        />
      </div>

      <div className="end-cover__signoff">
        Made with love by Avi &amp; Gracelynn
      </div>

      <div className="end-cover__year">{`~ ${year} ~`}</div>

      <div className="end-cover__pencils" aria-hidden="true">
        <span className="pencil pink" />
        <span className="end-cover__heart">&#9829;</span>
        <span className="pencil blue" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
        <button
          className="retro-btn ghost"
          onClick={() => {
            playClick()
            goTo('toc')
          }}
        >
          &larr; Back to start
        </button>
      </div>
    </div>
  )
}
