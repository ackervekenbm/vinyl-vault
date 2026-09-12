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