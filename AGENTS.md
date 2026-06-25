# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vsiljivec ("Impostor") is a Slovenian-language social deduction party game. Players pass a single phone around — most see the same secret word, but impostors get no word and "confused" players get a similar-but-different word. The group then gives one-word associations and votes to find the impostor.

All UI text is in **Slovenian**. Maintain this when adding or modifying user-facing strings.

## Commands

```bash
bun install          # install dependencies
bun dev              # dev server at http://localhost:4321
bun run build        # static build to dist/
bun preview          # preview the built site
```

Requires [Bun](https://bun.sh/). A devcontainer config is included.

There are no tests or linting configured.

## Architecture

Astro static site with a single React island. Tailwind CSS v4 via Vite plugin.

- `src/pages/index.astro` — sole page, renders `<Game client:load />`
- `src/components/Game.tsx` — the entire game UI as one component, managing all state and phases
- `src/lib/game.ts` — pure utility functions (shuffle, clamping, role math) and shared types (`Player`, `AssignedPlayer`, `GamePhase`, `RoleType`)
- `src/data/themes.ts` — word pair data organized by theme, each with `pairs` (normal) and `hardPairs` (hard difficulty)
- `src/styles/global.css` — Tailwind import plus custom animations
- `src/components/icons/` — small inline SVG icon components

## Game Flow (state machine)

`GamePhase` drives the UI: `SETUP` → `PASS` → `REVEAL` → (loops per player) → `END` → back to `SETUP`.

Roles are shuffled and assigned at game start in `startGame()`. The main/similar word from a pair is randomly swapped so neither position is predictable.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `deploy.yml`. PRs get preview deploys via `preview.yml`. The base path is configurable via `ASTRO_BASE` env var (defaults to `/vsiljivec`).
