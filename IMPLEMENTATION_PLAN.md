# getitdone — Figma Widget Implementation Plan

## Overview

**getitdone** is a **Figma Widget** (not a plugin) that places an interactive to-do card directly on the Figma canvas. Users interact with the widget ON the canvas — typing todos, clicking checkboxes, editing the header — without any side panel.

> **Why Widget, not Plugin?**
> Figma Plugins create static frames/text nodes that users can't interact with on canvas.
> Figma Widgets ARE interactive canvas elements — clicks, inputs, and state are all live on the sticker itself.

---

## User Flow

1. Open Figma → **Widgets** menu → Development → Import widget from manifest
2. Place widget on canvas via **Shift+I** → Widgets tab → getitdone
3. **On the sticker itself:**
   - Click the header to edit it inline
   - Click 📅 to open a small date picker popup → sets deadline below header
   - Click "Add a to-do…" row → type, press Enter → new todo appears
   - Click the □ box or the text → toggles done (■ + strikethrough)

---

## Visual Design

```
┌──────────────────────────────────┐
│  Header (editable)        📅     │  ← purple, bold, click to edit
│  by Wed Apr 8                    │  ← italic lavender, only if date set
├──────────────────────────────────┤
│  □  hfkj                         │  ← click box OR text to toggle done
│  ■  fjdkjfd (strikethrough)      │  ← filled box = done
│  ▫  Add a to-do…                 │  ← dashed box + input, click to type
└──────────────────────────────────┘
```

**Colors:** Purple header `#7C3AED` · White body `#FFFFFF` · Dark text `#1A1A1A` · Lavender deadline `#D8B4FE`

---

## Architecture

### Files

```
figma-todo-plugin/
├── manifest.json         # Widget config (widgetApi: "1.0.0")
├── code.tsx              # Widget JSX — all canvas interaction logic
├── ui.html               # Date picker popup (opened by 📅 click)
├── esbuild.config.js     # Build script (bundles TSX → code.js)
├── tsconfig.json         # TypeScript + JSX config
├── package.json          # esbuild + @figma/widget-typings
└── IMPLEMENTATION_PLAN.md
```

### Data Model (persisted via `useSyncedState`)

```ts
interface Todo {
  id: string;
  text: string;
  done: boolean;
}

// Widget state:
const [header, setHeader]     = useSyncedState<string>('header', 'Header');
const [todos, setTodos]       = useSyncedState<Todo[]>('todos', []);
const [deadline, setDeadline] = useSyncedState<string | null>('deadline', null);
```

`useSyncedState` persists state inside the Figma file — state survives reloads, is shared across collaborators in real time.

---

## Implementation Steps

### Phase 1 — Project Setup ✅ (partially done)
- [x] `manifest.json` → `widgetApi: "1.0.0"`, `editorType: ["figma"]`
- [x] `package.json` → `esbuild`, `@figma/widget-typings`
- [x] `tsconfig.json` → `jsx: "react"`, `jsxFactory: "figma.widget.h"`
- [ ] `esbuild.config.js` → bundle `code.tsx` → `code.js`, inject `ui.html` as `__html__`
- [ ] `npm install`

### Phase 2 — Widget Code (`code.tsx`)
- [ ] Widget component with `useSyncedState` for header, todos, deadline
- [ ] Purple `AutoLayout` header:
  - `Input` for editable title (click to edit inline on canvas)
  - `Text` "📅" that calls `openDatePicker()` (opens `ui.html` popup)
  - Conditional italic deadline `Text` row
- [ ] White `AutoLayout` body:
  - Per todo: `Rectangle` checkbox (10×10, click → toggle done) + `Text` (click → toggle done)
  - Done state: checkbox fill = `#1A1A1A`, text has `textDecoration="strikethrough"`
  - Add-todo row: dashed `Rectangle` + `Input` (Enter to add, ESC to cancel)

### Phase 3 — Date Picker UI (`ui.html`)
- [ ] Minimal HTML with `<input type="date">` + Set/Clear buttons
- [ ] On Set: `postMessage({ type: 'date-selected', date: value })`
- [ ] On Clear: `postMessage({ type: 'date-selected', date: null })`
- [ ] Widget receives message → `setDeadline(msg.date)` → `figma.closePlugin()`

### Phase 4 — Build & Test
- [ ] `npm run build` → compiles `code.tsx` + inlines `ui.html` → outputs `code.js`
- [ ] Load in Figma: **Widgets → Development → Import widget from manifest**
- [ ] Place widget, verify: header edit, todo add (Enter), checkbox toggle, date picker

---

## Key Widget API Concepts

| Concept | Purpose |
|---|---|
| `widget.register(Component)` | Register the widget root component |
| `useSyncedState(key, default)` | Persistent state synced to Figma file |
| `AutoLayout` | Figma auto-layout frame (widget version) |
| `Input` | Editable text field on canvas |
| `Rectangle` | The 10×10 checkbox square |
| `Text` | Display text, supports `onClick` |
| `figma.showUI(__html__, opts)` | Open date picker popup |
| `figma.ui.on('message', ...)` | Receive message from popup |
| `figma.closePlugin()` | Close popup after date selected |

---

## Tech Stack

- **TypeScript + JSX** (`code.tsx`) compiled via **esbuild**
- **`@figma/widget-typings`** for type safety
- **Vanilla HTML** for the date picker popup (`ui.html`)
- No runtime dependencies

---

## Keyboard Shortcut

`⌥⇧S` is no longer needed — widgets are placed from the Widgets menu (Shift+I).
The shortcut can be removed from the plan.

---

## GitHub Branch Strategy

- `main` — stable plan
- `feat/sticker-core` — current branch (widget implementation)
- `feat/sticker-polish` — Phase 4 polish after core works
