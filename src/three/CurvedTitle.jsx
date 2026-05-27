import React, { useMemo } from 'react'
import { Text } from '@react-three/drei'

/**
 * Renders a string as individual glyphs distributed along an arc so the title
 * appears to curve across the book cover. The arc is convex upward (smile-shape)
 * by default.
 */
export default function CurvedTitle({
  text,
  radius = 4.6,
  arc = 0.55,
  y = 0,
  z = 0,
  size = 0.3,
  color = '#f3d488',
  outlineColor = '#3f2010',
  outlineWidth = 0.012,
  font,
}) {
  const chars = useMemo(() => Array.from(text), [text])
  const total = chars.length
  const startAngle = Math.PI / 2 + arc / 2
  const angleStep = total > 1 ? arc / (total - 1) : 0

  return (
    <group>
      {chars.map((ch, i) => {
        const angle = startAngle - angleStep * i
        const x = Math.cos(angle) * radius
        const dy = Math.sin(angle) * radius - radius + y
        const rotZ = angle - Math.PI / 2
        return (
          <Text
            key={`${ch}-${i}`}
            position={[x, dy, z]}
            rotation={[0, 0, rotZ]}
            fontSize={size}
            color={color}
            outlineColor={outlineColor}
            outlineWidth={outlineWidth}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.02}
            font={font}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </Text>
        )
      })}
    </group>
  )
}
