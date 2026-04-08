# Figma To-Do Sticker Plugin — Implementation Plan

## Overview

A Figma plugin that lets users place a sticky-note-style to-do list directly onto their canvas. Each sticker is a native Figma frame that can be edited via the plugin UI.

---

## User Flow

1. User opens the plugin panel
2. User clicks **"Add Sticker"** → a to-do sticker frame appears on the canvas
3. User clicks the sticker (or selects it) → plugin UI switches to **edit mode**
4. In edit mode:
   - User can set/edit a **header** (title of the sticker)
   - User can **type a to-do item** and press **Enter** to add it
   - User can **click a to-do item** to cross it out (strikethrough)
   - User can **delete** a to-do item
5. Changes are written back to the Figma frame on the canvas in real time

---

## Architecture

### Files

```
figma-todo-plugin/
├── manifest.json         # Plugin config
├── code.ts               # Main thread (runs in Figma sandbox)
├── ui.html               # Plugin UI (iframe)
├── tsconfig.json         # TypeScript config
├── package.json          # Dev dependencies
└── IMPLEMENTATION_PLAN.md
```

### Data Model

Each sticker stores its state in the frame's `pluginData`:

```ts
interface TodoSticker {
  header: string;
  todos: Array<{
    id: string;
    text: string;
    done: boolean;
  }>;
}
```

This is persisted via `node.setPluginData('todos', JSON.stringify(data))` so the sticker state survives across sessions.

---

## Implementation Steps

### Phase 1 — Project Setup
- [ ] Initialize npm project with TypeScript
- [ ] Install `@figma/plugin-typings`
- [ ] Set up `tsconfig.json` and build script
- [ ] Write `manifest.json` with correct permissions (`currentpage`)

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
- [ ] **Edit view** (sticker selected):
  - Header input field at top
  - To-do list with checkboxes/strikethrough items
  - Text input + Enter key to add new to-do
  - Click existing item to toggle done/undone
  - Optional: delete button per item
- [ ] Post messages to `code.ts` on every change (live sync)
- [ ] Style: clean, minimal, matches Figma's aesthetic

### Phase 4 — Sticker Rendering Logic
- [ ] Use Figma `TextNode` for each to-do item
- [ ] Apply `TextDecoration = "STRIKETHROUGH"` for done items
- [ ] Use `FrameNode` as container (auto-layout vertical for easy stacking)
- [ ] Set `fills` to a warm yellow (`#FFF176`) for the sticker background
- [ ] Header uses bold weight; to-do items use regular weight

### Phase 5 — Polish
- [ ] Handle edge cases: empty todos, very long text, no header
- [ ] Sticker visual: drop shadow, slightly rotated feel (optional)
- [ ] "Delete Sticker" button in edit view
- [ ] Keyboard shortcut to add sticker

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
