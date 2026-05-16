'use client'

import React from 'react'

interface HighlightTextProps {
  text: string
  query: string
  className?: string
}

/**
 * Renders text with search query terms highlighted using Electric Blue.
 */
export function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query || !text) return <span className={className}>{text || '—'}</span>

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-accent-blue/10 text-accent-blue rounded px-0.5 not-italic font-black"
            style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.2)' }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}
