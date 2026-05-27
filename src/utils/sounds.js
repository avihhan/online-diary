/**
 * Tiny Web Audio "chiptune" synth used for retro UI sound effects.
 *
 * No external files - everything is generated on the fly. The AudioContext is
 * lazily created on the first user gesture (browsers block audio before then),
 * and a single shared instance is reused for all sounds.
 *
 * Public API:
 *   playClick()    -> short blip for buttons
 *   playFlip()     -> two-tone whoosh for page turns
 *   playUnlock()   -> happy 3-note arpeggio for unlock
 *   playOpen()     -> woody pop for opening the book cover
 *   playSelect()   -> high pluck for picking dates / list items
 *   playError()    -> sad descending pair for failures
 *   setMuted(bool) -> mute / unmute all SFX
 *   isMuted()      -> read state
 */

let ctx = null
let muted = false

try {
  const stored = localStorage.getItem('diary-sfx-muted')
  if (stored != null) muted = stored === '1'
} catch {
  /* ignore */
}

function ensureCtx() {
  if (muted) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function playTone({
  freq = 440,
  endFreq = null,
  type = 'square',
  duration = 0.12,
  volume = 0.06,
  delay = 0,
}) {
  const ac = ensureCtx()
  if (!ac) return
  const start = ac.currentTime + delay
  const end = start + duration

  const osc = ac.createOscillator()
  const gain = ac.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (endFreq != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), end)
  }

  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)

  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(end + 0.02)
}

function playNoise({ duration = 0.18, volume = 0.05, delay = 0, filterFreq = 1200 }) {
  const ac = ensureCtx()
  if (!ac) return
  const sampleRate = ac.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * duration))
  const buffer = ac.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  }
  const start = ac.currentTime + delay
  const src = ac.createBufferSource()
  src.buffer = buffer

  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq

  const gain = ac.createGain()
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  src.connect(filter).connect(gain).connect(ac.destination)
  src.start(start)
  src.stop(start + duration + 0.05)
}

export function playClick() {
  playTone({ freq: 880, endFreq: 1320, type: 'square', duration: 0.06, volume: 0.05 })
}

export function playSelect() {
  playTone({ freq: 1320, endFreq: 1760, type: 'triangle', duration: 0.08, volume: 0.06 })
}

export function playFlip() {
  // whoosh - filtered noise, then a soft click at the end like a page settling
  playNoise({ duration: 0.22, volume: 0.04, filterFreq: 1800 })
  playTone({ freq: 220, endFreq: 110, type: 'sine', duration: 0.18, volume: 0.05, delay: 0.18 })
}

export function playUnlock() {
  playTone({ freq: 523, type: 'square', duration: 0.12, volume: 0.06, delay: 0 })
  playTone({ freq: 659, type: 'square', duration: 0.12, volume: 0.06, delay: 0.12 })
  playTone({ freq: 988, type: 'square', duration: 0.22, volume: 0.07, delay: 0.24 })
}

export function playOpen() {
  playTone({ freq: 220, endFreq: 110, type: 'sawtooth', duration: 0.25, volume: 0.06 })
  playNoise({ duration: 0.4, volume: 0.03, filterFreq: 800, delay: 0.05 })
}

export function playError() {
  playTone({ freq: 440, endFreq: 220, type: 'square', duration: 0.18, volume: 0.06 })
  playTone({ freq: 330, endFreq: 165, type: 'square', duration: 0.22, volume: 0.06, delay: 0.18 })
}

export function setMuted(value) {
  muted = Boolean(value)
  try {
    localStorage.setItem('diary-sfx-muted', muted ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function isMuted() {
  return muted
}

/**
 * Convenience helper that takes any browser event and emits the click sound.
 * Useful as `onClick={withClick(handler)}` -> the click sound fires AND the
 * original handler runs.
 */
export function withClick(handler) {
  return (e) => {
    playClick()
    return handler?.(e)
  }
}
