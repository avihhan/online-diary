import { create } from 'zustand'

const STORAGE_KEY = 'diary-auth-v1'

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeStored(value) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

const initial = readStored()

export const USERS = {
  avi: { id: 'avi', label: 'Avi', color: '#4a90e2', colorDeep: '#2c6fc1', tone: 'blue' },
  gracelynn: {
    id: 'gracelynn',
    label: 'Gracelynn',
    color: '#ff6fb0',
    colorDeep: '#c4467d',
    tone: 'pink',
  },
}

export const useAuth = create((set) => ({
  token: initial?.token || '',
  user: initial?.user || '',
  isUnlocked: Boolean(initial?.token && initial?.user),
  setUser(user) {
    set((state) => {
      const next = { ...state, user }
      writeStored({ token: next.token, user: next.user })
      return { user }
    })
  },
  login({ token, user }) {
    writeStored({ token, user })
    set({ token, user, isUnlocked: true })
  },
  logout() {
    writeStored(null)
    set({ token: '', user: '', isUnlocked: false })
  },
}))
