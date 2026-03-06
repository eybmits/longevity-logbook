# Longevity Logbook

Minimal terminal-first training logger for bodyweight, Zone 2, Zone 5 / HIIT, and strength training.

The project is built for fast daily use. There is no backend, no account system, and no web UI. Everything runs in the terminal and is stored locally in a single JSON file.

## Features

- Rolling 7-day dashboard with weekly targets for Zone 2, Zone 5 / HIIT, strength, and a bodyweight snapshot
- Fast logging flow for:
  - Bodyweight entries in kg
  - Zone 2 sessions with fixed durations: `45`, `60`, `75` minutes
  - Zone 5 / HIIT sessions with fixed protocols
  - Strength sessions with a built-in training cycle and manual day selection for the session you are actually doing today
- Editable strength plan directly from the CLI
- Per-exercise progression tracking
- Session history, edit, and delete flows
- Local JSON storage with no cloud dependency

## Bodyweight Tracking

- Log bodyweight in kg directly from the main menu
- See the latest entry, change vs. the previous entry, and weekly entry count on the dashboard
- Edit and delete weight entries through the same session flow as training logs

## Strength Logging

- The app still suggests the next workout in the rotation
- You can manually choose which strength session you are actually doing today before logging starts
- Every exercise uses the same `2 sets x target reps` structure

## Current Default Strength Plan

- `Day 1`: Overhead Triceps Extension, Cable Triceps Pressdown, Cable Curl, Incline Dumbbell Curl, Machine Shoulder Press, Lateral Raise
- `Day 2`: Underhand Close-Grip Lat Pulldown, Straight-Arm Lat Pulldown, Joint-Friendly Shoulder Press, Cable Shoulder Raise, Lunges, Glute Machine
- `Day 3`: Chest Press, Deficit Push-Up, Y-Raise, Leg Press, Romanian Deadlift
- `Day 4`: Overhead Triceps Extension, Cable Triceps Pressdown, Single-Arm Cable Curl, Cable Curl, Machine Shoulder Press, Cross-Body Cable Y-Raise
- `Day 5`: Weighted Underhand Pull-Up, Overhand Lat Pulldown, Joint-Friendly Shoulder Press, Machine Shoulder Press, Leg Extension, Glute Machine
- `Day 6`: Dips, Incline Dumbbell Press, Cable Shoulder Raise, Rear Delt Cable Fly, Squat Machine, Glute Machine

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
- all logged bodyweight entries
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

## One-Command Launch

If you want to start the app from anywhere in the terminal with just:

```bash
gym
```

run this once inside the project:

```bash
npm link
```

After that, `gym` will be available globally on your machine and will launch this project directly.

## Commands

```bash
npm run cli
npm run build
```

## Main Menu

The CLI currently supports:

- `Log Weight`
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
