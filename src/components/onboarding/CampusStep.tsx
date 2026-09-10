'use client'

import { Building2, Check, Search } from 'lucide-react'
import { useId, useState } from 'react'
import { emailMatchesUniversity } from './helpers'
import type { University } from './types'
import styles from '@/components/journey/Journey.module.css'

export function CampusStep({
  accountEmail,
  universities,
  universityId,
  onSelect,
  invalid,
}: {
  accountEmail: string | null
  universities: University[]
  universityId: number | null
  onSelect: (id: number | null) => void
  invalid: boolean
}) {
  const selected = universities.find(
    (university) => university.id === universityId,
  )
  const [query, setQuery] = useState(selected?.name || '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()
  const normalized = query.trim().toLowerCase()
  const results =
    normalized.length < 2
      ? []
      : universities.filter((university) =>
          [
            university.name,
            university.shortName,
            university.city,
            university.state,
          ].some((value) => value?.toLowerCase().includes(normalized)),
        )
  const expanded = open && normalized.length >= 2
  function select(university: University) {
    onSelect(university.id)
    setQuery(university.name)
    setOpen(false)
    setActiveIndex(-1)
  }
  return (
    <div className={styles.fields}>
      <label className={styles.label} htmlFor="university-search">
        University
      </label>
      <div className={styles.search}>
        <Search aria-hidden="true" />
        <input
          id="university-search"
          className={styles.input}
          type="search"
          autoComplete="off"
          placeholder="Search your university or city"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            expanded && activeIndex >= 0 && results[activeIndex]
              ? `${listId}-${activeIndex}`
              : undefined
          }
          aria-describedby="university-hint"
          aria-invalid={invalid || undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            onSelect(null)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              return
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              const next =
                event.key === 'ArrowDown'
                  ? Math.min(activeIndex + 1, results.length - 1)
                  : Math.max(activeIndex - 1, 0)
              setActiveIndex(next)
              document
                .getElementById(`${listId}-${next}`)
                ?.scrollIntoView({ block: 'nearest' })
            }
            if (event.key === 'Enter' && expanded) {
              event.preventDefault()
              if (results[activeIndex]) select(results[activeIndex])
            }
          }}
        />
      </div>
      <p id="university-hint" className={styles.hint}>
        Type at least two characters, then choose from the directory.
      </p>
      {expanded ? (
        <div
          className={styles.results}
          id={listId}
          role="listbox"
          aria-label="Universities"
        >
          {results.map((university, index) => (
            <button
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={university.id === universityId}
              id={`${listId}-${index}`}
              key={university.id}
              className={styles.result}
              data-active={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(university)}
            >
              <Building2 aria-hidden="true" />
              <span>
                <strong>{university.name}</strong>
                <small>
                  {[university.city, university.state]
                    .filter(Boolean)
                    .join(', ')}
                </small>
              </span>
            </button>
          ))}
          {!results.length ? (
            <p className={styles.membership}>
              No matches yet. Try the full university name or its city.
            </p>
          ) : null}
        </div>
      ) : null}
      <span className="sr-only" role="status">
        {expanded
          ? `${results.length} universities found.`
          : selected
            ? `${selected.name} selected.`
            : ''}
      </span>
      {selected ? (
        <div className={styles.university}>
          <Building2 aria-hidden="true" />
          <div>
            <strong>{selected.name}</strong>
            <p>{[selected.city, selected.state].filter(Boolean).join(', ')}</p>
          </div>
          <Check aria-hidden="true" />
        </div>
      ) : null}
      <p className={styles.membership}>
        <strong>Campus access is checked when you finish.</strong>
        <br />
        {!accountEmail
          ? 'Your phone account works for public notes and rooms. University access stays pending without a confirmed academic email.'
          : selected && emailMatchesUniversity(accountEmail, selected)
            ? 'Your email domain matches this university. We’ll confirm your campus membership when your setup is saved.'
            : 'You can get started with public notes and rooms. University-only notes require a confirmed email that matches your campus.'}
      </p>
    </div>
  )
}
