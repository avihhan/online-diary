import React, { useMemo } from 'react'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

export default function HeartsBackground({ count = 14 }) {
  const hearts = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i += 1) {
      arr.push({
        left: `${rand(0, 100)}%`,
        size: rand(18, 42),
        duration: rand(14, 28),
        delay: rand(-20, 0),
        opacity: rand(0.5, 0.95),
      })
    }
    return arr
  }, [count])

  return (
    <div className="hearts-bg" aria-hidden>
      <div className="hearts-bg__tile" />
      {hearts.map((h, i) => (
        <span
          key={i}
          className="heart-float"
          style={{
            left: h.left,
            width: h.size,
            height: h.size,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: h.opacity,
          }}
        />
      ))}
    </div>
  )
}
