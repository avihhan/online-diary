import React, { useMemo, useRef } from 'react'
import { RoundedBox, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import CurvedTitle from './CurvedTitle'
import HeartLock3D from './HeartLock3D'

const AGroup = animated.group

/**
 * The closed leather diary. The front cover is hinged at the spine so it can
 * swing open when `opened` is true. The book idle-floats with a gentle wobble.
 */
export default function BookCover({ onLockClick, locked = true, opened = false }) {
  const groupRef = useRef()

  const leatherMap = useTexture('/textures/leather.svg')
  leatherMap.wrapS = leatherMap.wrapT = THREE.RepeatWrapping
  leatherMap.repeat.set(1, 1.4)
  leatherMap.anisotropy = 8

  const leatherMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: leatherMap,
        color: '#8a4d24',
        roughness: 0.78,
        metalness: 0.05,
      }),
    [leatherMap],
  )

  const innerCoverMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4a2410',
        roughness: 0.9,
      }),
    [],
  )

  const pagesMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f7ecd6',
        roughness: 0.95,
      }),
    [],
  )

  const { coverRotY, lockOpacity } = useSpring({
    coverRotY: opened ? -Math.PI * 0.82 : 0,
    lockOpacity: locked ? 1 : 0,
    config: { mass: 1.2, tension: 60, friction: 22 },
  })

  useFrame((state) => {
    if (!groupRef.current || opened) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.07
    groupRef.current.rotation.x = -0.05 + Math.sin(t * 0.5) * 0.02
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.05
  })

  const W = 4.4
  const H = 6.2
  const coverThickness = 0.18
  const pagesThickness = 0.32

  return (
    <group ref={groupRef}>
      {/* Back cover */}
      <group position={[0, 0, -pagesThickness / 2 - coverThickness / 2]}>
        <RoundedBox args={[W, H, coverThickness]} radius={0.06} smoothness={3} material={leatherMaterial} />
      </group>

      {/* Page stack (slightly smaller than covers) */}
      <mesh material={pagesMaterial}>
        <boxGeometry args={[W - 0.18, H - 0.18, pagesThickness]} />
      </mesh>

      {/* Hinged front cover: group pivots at spine, mesh is offset to the right */}
      <AGroup
        position={[-W / 2, 0, pagesThickness / 2 + coverThickness / 2]}
        rotation-y={coverRotY}
      >
        <group position={[W / 2, 0, 0]}>
          <RoundedBox
            args={[W, H, coverThickness]}
            radius={0.06}
            smoothness={3}
            material={leatherMaterial}
          />

          {/* Inner side of front cover (visible when open) */}
          <mesh position={[0, 0, -coverThickness / 2 - 0.001]} rotation={[0, Math.PI, 0]} material={innerCoverMaterial}>
            <planeGeometry args={[W - 0.1, H - 0.1]} />
          </mesh>

          {/* Inset border ring */}
          <mesh position={[0, 0, coverThickness / 2 + 0.001]}>
            <ringGeometry args={[3.0, 3.05, 64]} />
            <meshStandardMaterial color="#3f2010" roughness={0.6} />
          </mesh>

          {/* Compass-like emblem (subtle, behind title curve) */}
          <mesh position={[0, 0.5, coverThickness / 2 + 0.002]}>
            <ringGeometry args={[0.65, 0.7, 32]} />
            <meshStandardMaterial color="#3f2010" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.5, coverThickness / 2 + 0.002]}>
            <ringGeometry args={[0.4, 0.42, 32]} />
            <meshStandardMaterial color="#3f2010" roughness={0.7} />
          </mesh>

          {/* Curved title lines */}
          <group position={[0, 2.4, coverThickness / 2 + 0.01]}>
            <CurvedTitle text="DIARY OF" radius={5.2} arc={0.38} size={0.3} />
          </group>
          <group position={[0, 1.3, coverThickness / 2 + 0.01]}>
            <CurvedTitle text="AVI & GRACELYNN" radius={6.6} arc={0.55} size={0.3} />
          </group>

          {/* Decorative cord wrap */}
          <mesh position={[2.1, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.05, 8, 24]} />
            <meshStandardMaterial color="#3f2010" roughness={0.6} />
          </mesh>

          {/* Heart-shaped padlock on cover (visible while locked) */}
          <animated.group visible={lockOpacity.to((v) => v > 0.05)}>
            <HeartLock3D
              onClick={onLockClick}
              locked={locked}
              position={[0, -1.6, coverThickness / 2 + 0.02]}
            />
          </animated.group>
        </group>
      </AGroup>

      {/* Spine accent */}
      <mesh position={[-W / 2 + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[pagesThickness + coverThickness * 2 + 0.01, H]} />
        <meshStandardMaterial color="#3f2010" roughness={0.85} />
      </mesh>
    </group>
  )
}
