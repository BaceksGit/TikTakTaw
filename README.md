# TikTakTaw

Free to use Tic‑Tac‑Toe game built with React + Vite. 

**Author:** Baceks  
**Created:** March 11, 2026 (GMT+8)

## Features

- **Two modes:** `1v1` (local) and `vs Bot` (minimax AI).
- **Themes:** System / Light / Dark toggle.
- **Polish:** Win line animation, scoreboard, and “Bot is thinking…” state.

## How to Play

- Click a cell to place your mark.
- Get 3 in a row to win.
- Click **New game** to reset the board (scores stay).
- Switching modes resets everything (board + scores).

## Getting Started

### Prereqs

- Node.js (recommended: Node 18+)

### Install

```bash
cd TikTakTaw
npm install
```

### Run (dev)

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

- `src/App.jsx` – app layout + wiring
- `src/components/` – UI components (board, toggles, status, score row)
- `src/hooks/` – game + theme hooks
- `src/logic/` – win checking + bot AI

## Troubleshooting

### PowerShell: “running scripts is disabled” when running `npm`

If Windows PowerShell blocks `npm.ps1`, either:

- Run commands via `cmd.exe`, or use `npm.cmd` (example: `npm.cmd run dev`), or
- Change your execution policy for the current user (only if you understand the impact):
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
