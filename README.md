# Longevity Logbook

Minimal terminal-first training logger for Zone 2, Zone 5 / HIIT, and strength training.

The project is built for fast daily use. There is no backend, no account system, and no web UI. Everything runs in the terminal and is stored locally in a single JSON file.

## Features

- Rolling 7-day dashboard with weekly targets for Zone 2, Zone 5 / HIIT, and strength
- Fast logging flow for:
  - Zone 2 sessions with fixed durations: `45`, `60`, `75` minutes
  - Zone 5 / HIIT sessions with fixed protocols
  - Strength sessions with a built-in training cycle
- Editable strength plan directly from the CLI
- Per-exercise progression tracking
- Session history, edit, and delete flows
- Local JSON storage with no cloud dependency

## Strength Progression

The current rep target is `6-12`.

Each exercise progresses independently:

- If you complete the target reps, the next session moves up by one rep
- If you complete `12` reps, the next session increases the weight by the exercise increment and resets to `6` reps
- If you do **not** complete the target reps, the next session stays at the same weight and the same rep target

## Strength Plan Editing

From the main menu, open `Edit Strength Plan`.

You can:

- Rename a workout
- Edit the workout focus
- Rename an exercise
- Change the starting weight
- Change the weight increment
- Add an exercise
- Remove an exercise
- Reset one workout to the default template
- Reset the full strength plan to the default template

## Data Storage

All logs are stored locally in:

`data/logbook.json`

The data file includes:

- all logged Zone 2 sessions
- all logged Zone 5 / HIIT sessions
- all logged strength sessions
- the current editable program definition

The file is intentionally ignored by Git so personal training data does not get committed by default.

## Requirements

- Node.js `22+`
- npm

## Quick Start

```bash
npm install
npm run cli
```

## Commands

```bash
npm run cli
npm run build
```

## Main Menu

The CLI currently supports:

- `Log Zone 2`
- `Log Zone 5 / HIIT`
- `Log Strength`
- `View Strength Plan`
- `Edit Strength Plan`
- `View Current Week`
- `View History`
- `Edit Session`
- `Delete Session`
- `Exit`

## Project Structure

```text
src/cli.ts              Interactive CLI entrypoint
src/data/program.ts     Default program + active program state
src/lib/training.ts     Progression, summaries, and history logic
src/lib/storage.ts      JSON persistence
src/lib/terminal.ts     Terminal rendering helpers
src/types.ts            Shared TypeScript types
```

## Philosophy

This is intentionally small:

- fast to open
- fast to log
- easy to inspect
- easy to modify

The goal is compliance and clarity, not feature bloat.

## License

MIT
