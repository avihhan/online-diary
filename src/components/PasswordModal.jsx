import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../api/client'
import { useAuth, USERS } from '../state/useAuth'
import { playClick, playUnlock, playError } from '../utils/sounds'

const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const card = {
  initial: { opacity: 0, scale: 0.85, y: 40 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
  transition: { type: 'spring', stiffness: 220, damping: 22 },
}

export default function PasswordModal({ open, onClose, onUnlocked }) {
  const [who, setWho] = useState('gracelynn')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuth((s) => s.login)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!password) {
      setError('Type the secret word')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth', { password })
      if (res.data?.ok) {
        playUnlock()
        login({ token: res.data.token, user: who })
        setPassword('')
        onUnlocked?.()
      } else {
        playError()
        setError('That is not our word. Try again.')
      }
    } catch (err) {
      playError()
      const code = err?.response?.status
      if (code === 401) setError('That is not our word. Try again.')
      else setError('Could not reach the diary. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          variants={backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
        >
          <motion.form
            className="modal"
            variants={card}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h2>Who is opening the diary?</h2>
            <div className="row">
              {Object.values(USERS).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`who-btn ${u.tone} ${who === u.id ? 'selected' : ''}`}
                  onClick={() => {
                    playClick()
                    setWho(u.id)
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>

            <h2>Whisper the secret word</h2>
            <input
              type="password"
              className="retro-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="* * * * * *"
              autoFocus
            />
            {error && <div className="err">{error}</div>}

            <div className="row" style={{ marginTop: 16 }}>
              <button type="button" className="retro-btn ghost" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className={`retro-btn ${who === 'avi' ? 'blue' : ''}`}
                disabled={loading}
              >
                {loading ? 'Opening...' : 'Unlock'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
