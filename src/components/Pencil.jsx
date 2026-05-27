import React from 'react'

export default function Pencil({ tone = 'pink', label = '' }) {
  return (
    <span className={`pencil ${tone}`}>
      {label}
    </span>
  )
}
