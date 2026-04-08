# getitdone — Figma Plugin Implementation Plan

## Overview

**getitdone** is a Figma plugin that lets users place to-do card stickers directly onto their canvas. Each sticker has a **purple header** (title + deadline) and a **white body** (checkbox list). Cards are native Figma frames editable via the plugin UI.

---

## Visual Design Reference

```
  to-dos                         ← small cyan label above card
┌──────────────────────────────────┐
│  Header                  📅      │  ← title + calendar icon (right)
│  by Wed 4/8                      │  ← italic deadline row (only if date set)
├──────────────────────────────────┤
│  □  UI kit done                  │  ← square checkbox + dark text
│  □  need the testing plan        │
│  □  reconstruct the MVP          │
│  □  try to reconstruct page      │
└──────────────────────────────────┘

  Without date:
┌──────────────────────────────────┐
│  Header                  📅      │  ← just one row, no subtitle
├──────────────────────────────────┤
│  ...                             │
```

**Colors:**
- Header bg: `#7C3AED` (purple)
- Header text: `#FFFFFF`
- Deadline text: `#D8B4FE` (lighter purple/lavender)
- Body bg: `#FFFFFF`
- Todo text: `#1A1A1A` (near black)
- Checkbox: `#1A1A1A` outline, unfilled → on done: filled or strikethrough text
- Label: `#60A5FA` (cyan/blue)

**Dimensions:** ~400×500px, no corner radius on card (straight edges)

---

## User Flow

1. User opens the plugin panel
2. User clicks **"Add Sticker"** (or presses **`S`**) → a to-do sticker frame appears on the canvas
3. User clicks the sticker (or selects it) → plugin UI switches to **edit mode**
4. In edit mode:
   - User can set/edit a **header** (title of the sticker)
   - User can **type a to-do item** and press **Enter** to add it
   - User can **click a to-do item** to cross it out (strikethrough)
   - User can **delete** a to-do item
5. Changes are written back to the Figma frame on the canvas in real time

---

## Keyboard Shortcut: S to Add Sticker

| Key       | Figma Design Canvas | FigJam      | Plugin UI (iframe)  |
|-----------|---------------------|-------------|---------------------|
| `S`       | Not assigned ✓      | Add sticky  | **Add sticker ← use** |
| `Shift+S` | Section tool ✗      | —           | —                   |

**Decision:** Use `S` within the plugin panel UI. Plugin keyboard shortcuts are scoped to the plugin iframe and cannot conflict with Figma canvas shortcuts regardless. `S` is unassigned in Figma Design (only used in FigJam, which is a separate product).

**Implementation:** In `ui.html`:
```js
document.addEventListener('keydown', e => {
  if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey) {
    addSticker();
  }
});
```

---

## Architecture

### Files

```
figma-todo-plugin/
├── manifest.json         # Plugin config (name: "getitdone")
├── code.ts               # Main thread (runs in Figma sandbox)
├── ui.html               # Plugin UI (iframe)
├── tsconfig.json         # TypeScript config
├── package.json          # Dev dependencies
└── IMPLEMENTATION_PLAN.md
```

### manifest.json (key fields)

```json
{
  "name": "getitdone",
  "id": "<generated-plugin-id>",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

### Data Model

Each sticker stores its state in the frame's `pluginData`:

```ts
interface TodoSticker {
  header: string;
  deadline: string | null;  // ISO date string e.g. "2026-04-08", null if not set
  todos: Array<{
    id: string;
    text: string;
    done: boolean;
  }>;
}
```

Date is formatted for display as `"by [Day Mon D]"` (e.g. `"by Wed Apr 8"`) using `toLocaleDateString`.

Persisted via `node.setPluginData('todos', JSON.stringify(data))` so sticker state survives across sessions.

---

## Implementation Steps

### Phase 1 — Project Setup
- [ ] Initialize npm project with TypeScript
- [ ] Install `@figma/plugin-typings`
- [ ] Set up `tsconfig.json` and build script
- [ ] Write `manifest.json` with `name: "getitdone"` and `editorType: ["figma"]`

### Phase 2 — Plugin Main Thread (`code.ts`)
- [ ] Handle `"create-sticker"` message → draw a sticky frame on canvas
  - Frame: ~300×400px, yellow fill, rounded corners
  - Header text node at top
  - Placeholder to-do text nodes below
  - Save initial state via `setPluginData`
- [ ] Handle `"update-sticker"` message → update frame contents from UI data
  - Clear existing text nodes
  - Re-render header + todos (done items get strikethrough decoration)
- [ ] Handle `selectionchange` event → detect if selected node is a sticker
  - Read `getPluginData` and send to UI to populate edit form
- [ ] On plugin open, check if a sticker is already selected → go straight to edit mode

### Phase 3 — Plugin UI (`ui.html`)
- [ ] **Default view** (no sticker selected):
  - "Add Sticker" button
  - Hint label: "or press **S**"
- [ ] **Edit view** (sticker selected):
  - Header input field at top (same row as calendar icon button)
  - Calendar icon button → opens native `<input type="date">` date picker
  - If date selected: show "by [formatted date]" preview below header input; show clear (×) button
  - If no date: deadline row hidden — only header row shows
  - To-do list with checkboxes/strikethrough items
  - Text input + Enter key to add new to-do
  - Click existing item to toggle done/undone
  - Optional: delete button per item
- [ ] Keyboard shortcut: `S` key (when plugin panel is focused) → triggers Add Sticker
  - Scoped to iframe only — zero conflict with Figma canvas shortcuts
- [ ] Post messages to `code.ts` on every change (live sync)
- [ ] Style: clean, minimal, matches Figma's aesthetic

### Phase 4 — Sticker Rendering Logic
- [ ] Outer `FrameNode`: auto-layout vertical, ~400px wide, no corner radius
- [ ] **"to-dos" label**: small `TextNode` above the card, color `#60A5FA`, placed separately on canvas
- [ ] **Header section** (`FrameNode`, purple `#7C3AED` fill, padding 24px, auto-layout vertical):
  - Row 1: horizontal auto-layout frame
    - Title: `TextNode`, bold, white, ~28px (fills width)
    - Calendar icon: `VectorNode` or emoji placeholder, right-aligned, white
  - Row 2 (conditional — only rendered if deadline is set):
    - `TextNode`, italic, `#D8B4FE`, ~18px, text = `"by [formatted date]"`
    - Omit this node entirely when no date is set
- [ ] **Body section** (`FrameNode`, white fill, auto-layout vertical, padding 24px, gap 16px):
  - Per todo: horizontal auto-layout frame with:
    - Checkbox: `RectangleNode` ~20×20px, stroke `#1A1A1A`, no fill (unchecked) or filled (checked)
    - Text: `TextNode`, `#1A1A1A`, ~20px, wraps
  - Done state: checkbox fill `#1A1A1A` + text `TextDecoration = "STRIKETHROUGH"`

### Phase 5 — Polish
- [ ] Handle edge cases: empty todos, very long text, no header
- [ ] Sticker visual: drop shadow, slightly rotated feel (optional)
- [ ] "Delete Sticker" button in edit view

---

## Key Figma API Concepts Used

| Concept | Purpose |
|---|---|
| `figma.createFrame()` | Create the sticker container |
| `figma.createText()` | Add header + to-do text nodes |
| `node.setPluginData()` | Persist todo state on the node |
| `node.getPluginData()` | Read todo state when re-selecting |
| `figma.on('selectionchange')` | Detect when user clicks a sticker |
| `figma.ui.postMessage()` | Send data from plugin to UI |
| `figma.ui.onmessage` | Receive data from UI in plugin |
| Auto-layout (`primaryAxisAlignItems`) | Stack todos vertically in frame |

---

## Tech Stack

- **TypeScript** (compiled to JS for Figma sandbox)
- **Vanilla HTML/CSS/JS** for the UI panel (no framework needed)
- **Figma Plugin API** (no external dependencies at runtime)

---

## GitHub Branch Strategy

- `main` — stable, plan + scaffold
- `feat/sticker-core` — Phase 2 & 3 (core create + edit flow)
- `feat/sticker-polish` — Phase 4 & 5 (rendering + polish)
