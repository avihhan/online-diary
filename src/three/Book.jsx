import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import BookCover from './BookCover'

const AGroup = animated.group

// Approximate book dimensions used for the fit-to-viewport math.
const BOOK_WIDTH = 4.4
const BOOK_HEIGHT = 6.2

/**
 * Picks a scale that keeps the closed book comfortably inside the viewport
 * (even on narrow phones) while leaving the heart lock easily tappable.
 */
function useResponsiveBookScale() {
  const { viewport } = useThree()
  const padding = 0.86
  const fitW = (viewport.width / BOOK_WIDTH) * padding
  const fitH = (viewport.height / BOOK_HEIGHT) * padding
  return Math.min(1, Math.min(fitW, fitH))
}

function ResponsiveBookGroup({ opened, faded, onLockClick }) {
  const baseScale = useResponsiveBookScale()
  const targetScale =
    (faded ? 0.35 : opened ? 0.95 : 1) * baseScale

  const { groupX, groupY, scale } = useSpring({
    groupX: faded ? -4.5 : 0,
    groupY: faded ? 2.5 : 0,
    scale: targetScale,
    config: { mass: 1, tension: 80, friction: 26 },
  })

  return (
    <AGroup position-x={groupX} position-y={groupY} scale={scale}>
      <BookCover onLockClick={onLockClick} locked={!opened} opened={opened} />
    </AGroup>
  )
}

/**
 * Top-level 3D scene. Renders the closed leather book and animates the cover
 * "swinging open" once `opened` becomes true. After the cover swings open the
 * scene shrinks slightly and pans aside so the CSS-3D OpenBook can take over.
 */
export default function Book({ opened, faded, onLockClick }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: faded ? 0 : 1,
        pointerEvents: opened ? 'none' : 'auto',
        opacity: faded ? 0.55 : 1,
        transition: 'opacity 600ms ease',
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={36} />

      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <directionalLight position={[-5, 2, 3]} intensity={0.55} color="#ffd0e8" />
      <pointLight position={[0, -3, 3]} intensity={0.6} color="#ffb4c8" />
      <hemisphereLight args={['#ffd9ec', '#3a0f29', 0.5]} />

      <Suspense fallback={null}>
        <ResponsiveBookGroup
          opened={opened}
          faded={faded}
          onLockClick={onLockClick}
        />
        <ContactShadows
          position={[0, -3.4, 0]}
          opacity={0.55}
          scale={10}
          blur={2.8}
          far={4}
          color="#3a0f29"
        />
      </Suspense>
    </Canvas>
  )
}
