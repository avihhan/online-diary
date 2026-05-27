import React, { useEffect, useRef, useState } from 'react'
import { setMuted as setSfxMuted, isMuted as isSfxMuted, playClick } from '../utils/sounds'

const MUSIC_SRC = '/audio/blessed-spirits.mp3'
const STORAGE = 'diary-music-v1'

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

/**
 * Background-music controller. Loops public/audio/blessed-spirits.mp3 quietly
 * after the first user interaction (browsers block autoplay before that).
 *
 * A small HUD widget lets the listener pause, resume, and adjust volume; the
 * same widget also toggles UI sound effects.
 */
export default function BackgroundMusic() {
  const audioRef = useRef(null)
  const stored = readPrefs() || {}
  const [playing, setPlaying] = useState(stored.playing ?? true)
  const [volume, setVolume] = useState(stored.volume ?? 0.35)
  const [sfxMuted, setSfxLocal] = useState(isSfxMuted())
  const [missing, setMissing] = useState(false)

  // Persist
  useEffect(() => {
    writePrefs({ playing, volume })
  }, [playing, volume])

  // Apply volume to <audio>
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Play/pause control
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      const p = el.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay blocked; will retry on first interaction below.
        })
      }
    } else {
      el.pause()
    }
  }, [playing])

  // Retry play after first user interaction (autoplay policy)
  useEffect(() => {
    if (!playing) return
    const el = audioRef.current
    if (!el) return
    const tryPlay = () => {
      if (!playing || !el.paused) return
      el.play().catch(() => {})
    }
    const evts = ['click', 'keydown', 'pointerdown', 'touchstart']
    evts.forEach((e) => window.addEventListener(e, tryPlay, { once: true }))
    return () => evts.forEach((e) => window.removeEventListener(e, tryPlay))
  }, [playing])

  // Check whether file exists (helpful UX if user hasn't dropped the MP3 in)
  useEffect(() => {
    let cancelled = false
    fetch(MUSIC_SRC, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled && !res.ok) setMissing(true)
      })
      .catch(() => {
        if (!cancelled) setMissing(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function toggle() {
    playClick()
    setPlaying((p) => !p)
  }

  function toggleSfx() {
    const next = !sfxMuted
    setSfxMuted(next)
    setSfxLocal(next)
    if (!next) playClick()
  }

  return (
    <div
      className="music-ctl"
      style={{
        position: 'fixed',
        top: 14,
        right: 14,
        zIndex: 9100,
        background: 'rgba(255, 245, 250, 0.85)',
        border: '3px solid var(--ink)',
        padding: '6px 10px',
        boxShadow: '3px 3px 0 var(--ink)',
      }}
      title={missing ? 'Drop blessed-spirits.mp3 into public/audio/ to enable music' : ''}
    >
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" />
      <button onClick={toggle} disabled={missing} title={playing ? 'Pause music' : 'Play music'}>
        {missing ? '♪ ?' : playing ? '♪ Pause' : '♪ Play'}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        disabled={missing}
        aria-label="Music volume"
      />
      <button onClick={toggleSfx} title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}>
        {sfxMuted ? 'SFX Off' : 'SFX On'}
      </button>
    </div>
  )
}
