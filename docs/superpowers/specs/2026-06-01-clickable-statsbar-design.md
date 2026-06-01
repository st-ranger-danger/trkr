# Clickable StatsBar — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

The four stat cards at the top of the trkr dashboard (Open, Critical, High, Completed) become clickable filter shortcuts. Clicking a card applies a preset `status` + `priority` filter to the task list. The active card is visually highlighted; inactive cards dim. Clicking the active card again deselects it and returns to the default view.

---

## Behaviour

### Filter presets

| Card | `status` param | `priority` param |
|---|---|---|
| Open | `open` (default — param deleted) | `all` (param deleted) |
| Critical | `open` (param deleted) | `critical` |
| High | `open` (param deleted) | `high` |
| Completed | `done` | `all` (param deleted) |

### Active state

A card is considered active when the current URL params match its preset:

- **Open** — `status=open` AND `priority=all` (i.e. both params absent)
- **Critical** — `status=open` AND `priority=critical`
- **High** — `status=open` AND `priority=high`
- **Completed** — `status=done` (priority param irrelevant)

### Deselect (toggle off)

Clicking the currently active card resets to the default view: both `status` and `priority` params are deleted (equivalent to Open).

### Project filter

Stat card clicks never touch the `project` URL param. If a project filter is already active, clicking a stat card layers on top of it.

### Edge case: `status=all`

When the status filter is set to "All" (via the Filters dropdowns), no stat card matches — all four render at full opacity with no ring. This is an uncommon state and requires no special handling beyond the active-detection logic naturally returning false for all cards.

---

## Visual Design

**Active card:** colored ring border using the card's stat color.
```
border-color: <stat-color>
box-shadow: 0 0 0 1px <stat-color>
```

**Inactive cards (when Critical, High, or Completed is active):** dimmed to 45% opacity (`opacity: 0.45`). Hovering a dimmed card restores it to full opacity.

**Default state (Open active):** Open card gets the ring; other three cards render at full opacity. Dimming is not applied in the default state — it would make the board feel permanently filtered when nothing special is selected.

**Cursor:** `cursor-pointer` on all cards at all times.

**Transition:** `transition: opacity 0.15s, border-color 0.15s, box-shadow 0.15s` — snappy but not jarring.

---

## Component Changes

### `StatsBar.tsx`

**New props:**
```ts
activeFilter: { status: string; priority: string }
onStatClick: (key: 'open' | 'critical' | 'high' | 'completed') => void
```

**Changes:**
- Each stat card `<div>` becomes a `<button>` element.
- Each card derives its `isActive` boolean from `activeFilter`.
- Active card gets the ring styles; inactive cards (when another is active) get `opacity-0.45`.
- `onClick` calls `onStatClick(key)`.
- Add `cursor-pointer` and transition classes.
- `aria-pressed={isActive}` for accessibility.

### `Dashboard.tsx`

**New handler: `handleStatClick`**

```ts
function handleStatClick(key: 'open' | 'critical' | 'high' | 'completed') {
  const presets = {
    open:      { status: 'open', priority: 'all' },
    critical:  { status: 'open', priority: 'critical' },
    high:      { status: 'open', priority: 'high' },
    completed: { status: 'done', priority: 'all' },
  }
  const preset = presets[key]
  const isActive =
    key === 'completed'
      ? status === 'done'
      : status === preset.status && priority === preset.priority

  const next = new URLSearchParams(params.toString())

  if (isActive) {
    // Deselect → reset to default
    next.delete('status')
    next.delete('priority')
  } else {
    if (preset.status === 'open') next.delete('status')
    else next.set('status', preset.status)
    if (preset.priority === 'all') next.delete('priority')
    else next.set('priority', preset.priority)
  }

  router.replace(`/?${next.toString()}`, { scroll: false })
}
```

**Updated `<StatsBar />` usage:**
```tsx
<StatsBar
  tasks={tasks}
  activeFilter={{ status, priority }}
  onStatClick={handleStatClick}
/>
```

---

## Out of Scope

- Animating the task list on filter change (already handled by existing re-render).
- Persisting "last active stat" across sessions.
- Adding a stat card for any priority other than Critical and High.
