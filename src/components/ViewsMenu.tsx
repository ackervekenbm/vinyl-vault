// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 ackervekenbm

import { useEffect, useRef, useState } from 'react'
import type { SavedView } from '../utils/views'
import {
  MAX_SAVED_VIEWS,
  describeCriteria,
  nameTaken,
} from '../utils/views'
import { BookmarkIcon, CheckIcon, CloseIcon, PencilIcon, TrashIcon } from './icons'

const MAX_NAME_LENGTH = 60

interface ViewsButtonProps {
  views: SavedView[]
  activeView: SavedView | null
  dirty: boolean
  open: boolean
  onToggle: () => void
}

export function ViewsButton({
  views,
  activeView,
  dirty,
  open,
  onToggle,
}: ViewsButtonProps) {
  return (
    <button
      type="button"
      className={`filter-toggle views-toggle${open ? ' open' : ''}${dirty ? ' edited' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="views-panel"
      data-views-toggle=""
      aria-label={
        activeView
          ? `Saved views — ${activeView.name} in use${dirty ? ', changed since saving' : ''}`
          : 'Saved views'
      }
      title={
        activeView
          ? `Showing “${activeView.name}”${dirty ? ' (changed since it was saved)' : ''}`
          : 'Save and switch between searches and filter combinations'
      }
    >
      <BookmarkIcon />
      <span className="views-toggle-label">{activeView ? activeView.name : 'Views'}</span>
      {views.length > 0 && <span className="filter-count">{views.length}</span>}
    </button>
  )
}

interface ViewsPanelProps {
  views: SavedView[]
  counts: Record<string, number>
  activeView: SavedView | null
  dirty: boolean
  canSave: boolean
  onApply: (view: SavedView) => void
  onClear: () => void
  onSave: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onUpdate: (view: SavedView) => void
  onClose: () => void
}

export function ViewsPanel({
  views,
  counts,
  activeView,
  dirty,
  canSave,
  onApply,
  onClear,
  onSave,
  onRename,
  onDelete,
  onUpdate,
  onClose,
}: ViewsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)
  const [draftName, setDraftName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const atCapacity = views.length >= MAX_SAVED_VIEWS

  // Dismiss on outside click or Escape, and hand focus back to whatever opened
  // the panel so keyboard users don't get dumped on the document body.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      // The toolbar button toggles the panel itself; dismissing here as well
      // would close it on pointerdown only for its own click to reopen it.
      if (target instanceof Element && target.closest('[data-views-toggle]')) return
      if (!panelRef.current?.contains(target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [onClose])

  const submitSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = draftName.trim()
    if (!name) {
      setError('Give the view a name first.')
      return
    }
    if (nameTaken(views, name)) {
      setError(`You already have a view called “${name}”.`)
      return
    }
    setError(null)
    onSave(name)
    setDraftName('')
    saveInputRef.current?.focus()
  }

  const submitRename = (id: string) => {
    const name = renameDraft.trim()
    if (!name) {
      setError('Give the view a name first.')
      return
    }
    if (nameTaken(views, name, id)) {
      setError(`You already have a view called “${name}”.`)
      return
    }
    setError(null)
    onRename(id, name)
    setEditingId(null)
  }

  const startRename = (view: SavedView) => {
    setConfirmDeleteId(null)
    setError(null)
    setEditingId(view.id)
    setRenameDraft(view.name)
  }

  const startDelete = (view: SavedView) => {
    setEditingId(null)
    setError(null)
    setConfirmDeleteId(view.id)
  }

  const hint = atCapacity
    ? `That's the maximum of ${MAX_SAVED_VIEWS} views — delete one to save another.`
    : canSave
      ? 'A view remembers the search box and filters. Your folder and sort stay as they are.'
      : 'Set a search or filter first, then save it here as a view.'

  return (
    <div className="views-panel" id="views-panel" ref={panelRef}>
      <div className="views-panel-head">
        <span className="filter-panel-title">Saved views</span>
        <div className="views-panel-head-actions">
          <span className="views-panel-hint-inline">{views.length} saved</span>
          <button
            type="button"
            className="filter-reset"
            onClick={onClear}
            disabled={!canSave}
            aria-label="Clear search and filters"
            title="Clear the search box and every filter"
          >
            Clear
          </button>
        </div>
      </div>

      {activeView && dirty && (
        <div className="views-notice">
          <span className="views-notice-text">
            “{activeView.name}” no longer matches what you see.
          </span>
          <div className="views-notice-actions">
            <button
              type="button"
              className="views-mini-btn primary"
              onClick={() => onUpdate(activeView)}
            >
              Update view
            </button>
            <button
              type="button"
              className="views-mini-btn"
              onClick={() => onApply(activeView)}
            >
              Revert
            </button>
          </div>
        </div>
      )}

      {views.length > 0 && (
        <ul className="views-list">
          {views.map((view) => {
            const isCurrent = activeView?.id === view.id
            const summary = describeCriteria(view.query, view.filters).join(' · ')
            return (
              <li key={view.id} className={`views-row${isCurrent ? ' current' : ''}`}>
                {editingId === view.id ? (
                  <form
                    className="views-rename"
                    onSubmit={(event) => {
                      event.preventDefault()
                      submitRename(view.id)
                    }}
                  >
                    <input
                      className="views-rename-input"
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      maxLength={MAX_NAME_LENGTH}
                      aria-label={`Rename ${view.name}`}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="views-icon-btn"
                      aria-label={`Save name for ${view.name}`}
                    >
                      <CheckIcon />
                    </button>
                    <button
                      type="button"
                      className="views-icon-btn"
                      aria-label={`Cancel renaming ${view.name}`}
                      onClick={() => setEditingId(null)}
                    >
                      <CloseIcon />
                    </button>
                  </form>
                ) : confirmDeleteId === view.id ? (
                  <div className="views-confirm">
                    <span className="views-confirm-text">Delete “{view.name}”?</span>
                    <button
                      type="button"
                      className="views-mini-btn danger"
                      onClick={() => {
                        setConfirmDeleteId(null)
                        onDelete(view.id)
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="views-mini-btn"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="views-apply"
                      aria-current={isCurrent ? 'true' : undefined}
                      onClick={() => onApply(view)}
                    >
                      <span className="views-name">{view.name}</span>
                      <span className="views-desc">{summary || 'Everything'}</span>
                    </button>
                    <span className="views-count">
                      {(counts[view.id] ?? 0).toLocaleString()}
                    </span>
                    <span className="views-row-actions">
                      <button
                        type="button"
                        className="views-icon-btn"
                        aria-label={`Rename ${view.name}`}
                        title={`Rename “${view.name}”`}
                        onClick={() => startRename(view)}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="views-icon-btn"
                        aria-label={`Delete ${view.name}`}
                        title={`Delete “${view.name}”`}
                        onClick={() => startDelete(view)}
                      >
                        <TrashIcon />
                      </button>
                    </span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form className="views-save" onSubmit={submitSave}>
        <label className="views-save-label" htmlFor="views-save-name">
          Save the current search &amp; filters as a view
        </label>
        <div className="views-save-row">
          <input
            id="views-save-name"
            className="views-save-input"
            ref={saveInputRef}
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value)
              if (error) setError(null)
            }}
            placeholder="e.g. 7-inch singles"
            maxLength={MAX_NAME_LENGTH}
            disabled={atCapacity}
            autoComplete="off"
          />
          <button
            type="submit"
            className="views-save-btn"
            disabled={atCapacity || !draftName.trim() || !canSave}
          >
            Save
          </button>
        </div>
        {error ? (
          <p className="views-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="views-hint">{hint}</p>
        )}
      </form>
    </div>
  )
}