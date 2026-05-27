import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 3D heart-shaped padlock that sits on the book cover. Click to trigger the
 * unlock flow. Animates with a gentle floating wobble driven by useFrame.
 */
function makeHeartShape() {
  const shape = new THREE.Shape()
  const x = 0
  const y = 0
  shape.moveTo(x, y - 0.45)
  shape.bezierCurveTo(x, y - 0.45, x - 0.45, y - 0.9, x - 0.9, y - 0.45)
  shape.bezierCurveTo(x - 1.35, y, x - 0.9, y + 0.6, x, y + 0.85)
  shape.bezierCurveTo(x + 0.9, y + 0.6, x + 1.35, y, x + 0.9, y - 0.45)
  shape.bezierCurveTo(x + 0.45, y - 0.9, x, y - 0.45, x, y - 0.45)
  return shape
}

export default function HeartLock3D({ onClick, locked = true, position = [0, -1.2, 0.16] }) {
  const groupRef = useRef()

  const heartGeom = useMemo(() => {
    const shape = makeHeartShape()
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 24,
    })
    geom.center()
    return geom
  }, [])

  const shackleGeom = useMemo(
    () => new THREE.TorusGeometry(0.32, 0.07, 12, 32, Math.PI),
    [],
  )

  const keyholeGeom = useMemo(() => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0.05, 0.06, 0, Math.PI * 2, false)
    shape.moveTo(-0.04, 0)
    shape.lineTo(0.04, 0)
    shape.lineTo(0.05, -0.18)
    shape.lineTo(-0.05, -0.18)
    shape.lineTo(-0.04, 0)
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: false,
      curveSegments: 16,
    })
  }, [])

  useFrame((state) => {
    if (!groupRef.current || !locked) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.06
    groupRef.current.position.y = position[1] + Math.sin(t * 1.6) * 0.025
  })

  const handlePointerOver = (e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }
  const handlePointerOut = (e) => {
    e.stopPropagation()
    document.body.style.cursor = ''
  }
  const handleClick = (e) => {
    e.stopPropagation()
    if (locked) onClick?.()
  }

  return (
    <group
      ref={groupRef}
      position={position}
      scale={0.9}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <mesh position={[0, 0.7, 0]} geometry={shackleGeom}>
        <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh geometry={heartGeom}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh geometry={heartGeom} scale={0.86} position={[0, 0, 0.04]}>
        <meshStandardMaterial color="#3b3b3b" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh geometry={keyholeGeom} position={[0, 0, 0.16]}>
        <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  )
}
