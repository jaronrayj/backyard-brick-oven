import React, { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/outline'

let nextId = 0

// A text box you can type anything into, with a ▾ button that lists the
// usual choices. Typing narrows the list; the button always shows all of them.
const ComboBox = ({ value, onChange, options, className = '', placeholder }) => {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const wrap = useRef(null)
  const [listId] = useState(() => `combo-${(nextId += 1)}`)

  useEffect(() => {
    if (!open) return undefined
    const away = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const q = String(value || '').trim().toLowerCase()
  const shown = showAll || !q ? options : options.filter((o) => o.toLowerCase().includes(q))

  const choose = (o) => {
    onChange(o)
    setOpen(false)
  }

  return (
    <div ref={wrap} className="relative">
      <input
        className={`${className} pr-9`}
        value={value}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setShowAll(false)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'ArrowDown') {
            setShowAll(true)
            setOpen(true)
          }
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Show choices"
        className="absolute inset-y-0 right-0 px-2 flex items-center text-gray-500 hover:text-gray-900"
        onClick={() => {
          setShowAll(true)
          setOpen((o) => !o)
        }}
      >
        <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && shown.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm"
        >
          {shown.map((o) => (
            <li key={o} role="option" aria-selected={o === value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 hover:bg-amber-50 ${o === value ? 'font-semibold text-amber-800' : 'text-gray-800'}`}
                onClick={() => choose(o)}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ComboBox
