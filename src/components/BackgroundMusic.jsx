import React, { useEffect, useRef, useState } from 'react'
import { tracks as discoveredTracks } from 'virtual:audio-tracks'
import { setMuted as setSfxMuted, isMuted as isSfxMuted, playClick } from '../utils/sounds'

const STORAGE = 'diary-music-v2'

function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

function shortName(name) {
  if (!name) return ''
  return name.length > 32 ? name.slice(0, 29) + '...' : name
}

/**
 * Background-music player. Auto-discovers every audio file in `public/audio/`
 * via the Vite `virtual:audio-tracks` module and plays them as a looping
 * playlist (advances to the next track when one ends, wraps around at the end).
 */
export default function BackgroundMusic() {
  const audioRef = useRef(null)
  const stored = readPrefs() || {}
  const tracks = discoveredTracks || []
  const hasTracks = tracks.length > 0

  const [trackIdx, setTrackIdx] = useState(() => {
    const i = Number.isInteger(stored.trackIdx) ? stored.trackIdx : 0
    return Math.min(Math.max(i, 0), Math.max(0, tracks.length - 1))
  })
  const [playing, setPlaying] = useState(stored.playing ?? true)
  const [volume, setVolume] = useState(stored.volume ?? 0.35)
  const [shuffle, setShuffle] = useState(stored.shuffle ?? false)
  const [sfxMuted, setSfxLocal] = useState(isSfxMuted())
  const [expanded, setExpanded] = useState(false)

  const current = hasTracks ? tracks[trackIdx] : null

  useEffect(() => {
    writePrefs({ trackIdx, playing, volume, shuffle })
  }, [trackIdx, playing, volume, shuffle])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !current) return
    if (playing) {
      const p = el.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      el.pause()
    }
  }, [playing, current])

  useEffect(() => {
    if (!playing || !current) return
    const el = audioRef.current
    if (!el) return
    const tryPlay = () => {
      if (!playing || !el.paused) return
      el.play().catch(() => {})
    }
    const evts = ['click', 'keydown', 'pointerdown', 'touchstart']
    evts.forEach((e) => window.addEventListener(e, tryPlay, { once: true }))
    return () => evts.forEach((e) => window.removeEventListener(e, tryPlay))
  }, [playing, current])

  function nextIdx(curr) {
    if (tracks.length <= 1) return 0
    if (shuffle) {
      let n = curr
      while (n === curr) n = Math.floor(Math.random() * tracks.length)
      return n
    }
    return (curr + 1) % tracks.length
  }

  function prevIdx(curr) {
    if (tracks.length <= 1) return 0
    if (shuffle) {
      let n = curr
      while (n === curr) n = Math.floor(Math.random() * tracks.length)
      return n
    }
    return (curr - 1 + tracks.length) % tracks.length
  }

  function handleEnded() {
    setTrackIdx((i) => nextIdx(i))
  }

  function togglePlay() {
    playClick()
    setPlaying((p) => !p)
  }
  function next() {
    playClick()
    setTrackIdx((i) => nextIdx(i))
    setPlaying(true)
  }
  function prev() {
    playClick()
    setTrackIdx((i) => prevIdx(i))
    setPlaying(true)
  }
  function toggleShuffle() {
    playClick()
    setShuffle((s) => !s)
  }
  function toggleSfx() {
    const n = !sfxMuted
    setSfxMuted(n)
    setSfxLocal(n)
    if (!n) playClick()
  }

  return (
    <div
      className="music-ctl music-ctl--hud"
      title={!hasTracks ? 'Drop any MP3 into public/audio/ to enable music' : current?.name || ''}
    >
      {current && (
        <audio
          ref={audioRef}
          src={current.src}
          preload="auto"
          onEnded={handleEnded}
        />
      )}

      <button
        onClick={() => {
          playClick()
          setExpanded((e) => !e)
        }}
        className="music-ctl__toggle"
        title="Music controls"
      >
        ♪
      </button>

      {expanded && (
        <div className="music-ctl__panel">
          <div className="music-ctl__row">
            <button onClick={prev} disabled={!hasTracks} title="Previous">⏮</button>
            <button onClick={togglePlay} disabled={!hasTracks}>
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={next} disabled={!hasTracks} title="Next">⏭</button>
            <button onClick={toggleShuffle} disabled={!hasTracks} className={shuffle ? 'active' : ''} title="Shuffle">
              ⇄
            </button>
          </div>
          <div className="music-ctl__title">
            {hasTracks
              ? `${trackIdx + 1}/${tracks.length} · ${shortName(current.name)}`
              : 'No music in public/audio/'}
          </div>
          <div className="music-ctl__row">
            <label className="music-ctl__lbl">VOL</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={!hasTracks}
              aria-label="Music volume"
            />
          </div>
          <div className="music-ctl__row">
            <button onClick={toggleSfx} className={sfxMuted ? '' : 'active'}>
              {sfxMuted ? 'SFX Off' : 'SFX On'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
