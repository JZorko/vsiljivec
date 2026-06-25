# Refactor plan: single-file React → Astro

## Current state

The whole app is one file, [index.html](index.html) (~1300 lines):

- React 18 + ReactDOM loaded from `unpkg` CDN.
- `@babel/standalone` transpiles a single inline `<script type="text/babel">` in the browser.
- Tailwind loaded from the `cdn.tailwindcss.com` runtime (no build step).
- One `App` component holding all game state and UI.
- 11 word-pair themes (`WORD_THEMES`), each with `pairs` and `hardPairs`.
- Inline SVG icon components, a handful of pure helpers (`shuffleArray`,
  `parseCountInput`, `getAvailableWordPairs`, …), keyboard handling, and
  pointer/drag player reordering.
- Deployed as a static page (GitHub Pages).

It's a fully client-side game (no backend, no persistence beyond in-memory
state). Astro is a good fit: ship a static site, keep the interactive game as a
single client island.

## Goals

- Keep behaviour and visuals identical — this is a refactor, not a redesign.
- Replace browser-time Babel + CDN React + CDN Tailwind with a real build.
- Split the monolith into maintainable modules (themes as data, icons,
  helpers, components).
- Stay deployable as a static site to GitHub Pages.

## Non-goals

- No gameplay changes, no new features, no visual redesign.
- No backend / server rendering of game logic — it stays a client island.

## Phases

### Phase 0 — Dev environment (devcontainer) ✅ first step

- [x] Add [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)
      on the official **`oven/bun:latest`** image (no Node runtime), plus the
      `common-utils` + `git` features for in-container tooling.
- [x] Handle SELinux on openSUSE: Docker's `--mount` syntax can't relabel
      (no `z` / `relabel=`), so disable container SELinux labeling via
      `runArgs: --security-opt label=disable` to keep the bind mount accessible.
- [x] Forward port `4321` (Astro dev server) and wire `postCreateCommand`
      (`bun install`, guarded until `package.json` exists).

Verify: container builds, opens the workspace read-write, `bun --version` works.

### Phase 1 — Scaffold Astro alongside the existing app ✅

- [x] Installed Astro 7, `@astrojs/react`, `@astrojs/tailwind` (Tailwind v3.4.17),
      TypeScript, React 18 via `bun add`.
- [x] Created `astro.config.mjs` with `output: 'static'`, React + Tailwind
      integrations, GitHub Pages `site`/`base`.
- [x] Created `tsconfig.json`, `tailwind.config.mjs`, placeholder
      `src/pages/index.astro`.
- [x] `package.json` + `bun.lock` committed; devcontainer `postCreateCommand`
      simplified to `bun install`.

Verified: `bunx astro dev` serves a working Astro page on `:4321`.

### Phase 2 — Extract data and pure logic ✅

- [x] `src/data/themes.ts` — `WORD_THEMES` with `Theme`, `WordPair`,
      `Difficulty` types; `getSafeWordPairs`, `getAvailableWordPairs`,
      `ALL_THEMES_ID`.
- [x] `src/lib/game.ts` — `shuffleArray`, `clampCount`, `parseCountInput`,
      `preventInvalidNumberInput`, `calculateMaxImpostorCount`,
      `calculateMaxConfusedCount`, `FOCUSABLE_SELECTOR`, `INITIAL_PLAYERS`,
      and game-related types (`Player`, `AssignedPlayer`, `GamePhase`,
      `RoleType`).

### Phase 3 — Componentize the React island ✅

- [x] `src/components/icons/` — `UsersIcon`, `SettingsIcon`,
      `ChevronDownIcon`, `SmartphoneIcon`, `HelpCircleIcon`.
- [x] `src/components/Game.tsx` — full App transplanted as a single React
      component with proper imports from extracted modules. All game logic,
      drag/keyboard reorder, help dialog, config panel preserved verbatim.

### Phase 4 — Wire the Astro page ✅

- [x] `src/pages/index.astro` renders `<Game client:load />`.
- [x] Keyframe animations and scrollbar styles in a global `<style>` block.
- [x] Build succeeds, all Tailwind classes resolve (including arbitrary values
      like `tracking-[0.3em]`).

### Phase 5 — Parity check & cleanup ✅

- [x] Code-level parity confirmed: all state, refs, helpers, event handlers,
      drag/keyboard reorder, keyboard shortcuts, difficulty toggle, theme
      selection (incl. "all"), help dialog, and JSX match the original.
- [x] `PlayIcon` was defined but unused in original — correctly omitted.
- [x] Removed old `index.html`.
- [x] Updated [README.md](README.md) with `bun dev` / `bun run build` /
      `bun preview` instructions.
- [x] Added `scripts` to `package.json`.

### Phase 6 — Deployment ✅

- [x] `.github/workflows/deploy.yml` — builds Astro on push to `main`,
      deploys to `gh-pages` branch via `JamesIves/github-pages-deploy-action`
      (preserves `pr-preview/` subdirectory with `clean-exclude`).
- [x] `.github/workflows/preview.yml` — builds Astro with a per-PR base path
      on PR open/sync/reopen, deploys preview via `rossjrw/pr-preview-action`;
      auto-cleans on PR close.
- [x] `astro.config.mjs` reads `ASTRO_BASE` env var (defaults to `/vsiljivec`)
      so preview builds use `/vsiljivec/pr-preview/pr-{number}`.
- [ ] Configure GitHub Pages to serve from the `gh-pages` branch (repo
      Settings → Pages → Source → "Deploy from a branch" → `gh-pages`).

## Open questions

- Tailwind v3 (match current pinned version, lowest risk) vs v4 (newer, config
  differs). Default: **v3** to minimize visual drift, upgrade later.
- Keep Slovenian UI strings inline vs extract to a messages file. Default:
  keep inline for now (out of scope for the refactor).
