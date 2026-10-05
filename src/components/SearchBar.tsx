// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 ackervekenbm

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="search"
      className="search-input"
      placeholder="Search artist, title, genre, label, year…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Search collection"
    />
  )
}