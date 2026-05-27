import React, { useEffect, useState } from 'react'
import HeartsBackground from './components/HeartsBackground'
import Book from './three/Book'
import PasswordModal from './components/PasswordModal'
import OpenBook from './components/OpenBook'
import NavArrows from './components/NavArrows'
import Hud from './components/Hud'
import BackgroundMusic from './components/BackgroundMusic'
import { useAuth } from './state/useAuth'
import { playClick, playOpen } from './utils/sounds'

export default function App() {
  const isUnlocked = useAuth((s) => s.isUnlocked)
  const [modalOpen, setModalOpen] = useState(false)

  // Cover-open animation phase. We split it in two stages so the cover swings
  // open in 3D first, then the CSS-3D book fades in over the top.
  const [opened, setOpened] = useState(isUnlocked)
  const [faded, setFaded] = useState(isUnlocked)

  useEffect(() => {
    if (isUnlocked) {
      setOpened(true)
      playOpen()
      const t1 = setTimeout(() => setFaded(true), 900)
      return () => clearTimeout(t1)
    } else {
      setFaded(false)
      setOpened(false)
    }
  }, [isUnlocked])

  return (
    <>
      <HeartsBackground count={16} />

      <Book
        opened={opened}
        faded={faded}
        onLockClick={() => {
          playClick()
          setModalOpen(true)
        }}
      />

      <OpenBook visible={isUnlocked && faded} />

      {isUnlocked && faded && (
        <>
          <Hud />
          <NavArrows />
        </>
      )}

      <PasswordModal
        open={modalOpen}
        onClose={() => {
          playClick()
          setModalOpen(false)
        }}
        onUnlocked={() => setModalOpen(false)}
      />

      <BackgroundMusic />

      <div className="scanlines" />
    </>
  )
}
