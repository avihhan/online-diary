import React from 'react'
import { useAuth, USERS } from '../state/useAuth'
import Pencil from './Pencil'

export default function Hud() {
  const { user, logout } = useAuth()
  if (!user) return null
  const profile = USERS[user]
  return (
    <div className="hud">
      <Pencil tone={profile.tone} label={profile.label} />
      <button className="logout" onClick={logout}>
        Lock
      </button>
    </div>
  )
}
