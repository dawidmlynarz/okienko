# Okienko

A pretend computer in the browser where a 7-year-old learns to type. This is the PoC:
she logs in with two steps (types her name, then picks her picture-PIN), meets Smoczek,
pops letter balloons in **Balonowy Las**, writes in **Notatnik**, and earns her
computer an upgrade from **Okienko 1.0 to 1.1**.

Target: Chrome on a MacBook (Polish Pro layout) or a Windows PC (Polish programmer's layout), physical keyboard.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # keyboard module + game content tests
npm run build    # static site in dist/
```

The first screen is a one-minute setup for the parent (her name, Smoczek's name and colour).
Parent settings later: **Dla rodzica** on the login screen (behind a small times-table question).

## Deploy

`dist/` is a plain static site with relative paths, so any static host works.

- **Vercel**: Import the repo at vercel.com/new. It detects Vite; no settings needed.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`.

Every push gets a preview URL on either host.

## How it is built

| Piece | Where | Notes |
| --- | --- | --- |
| Design tokens | `src/styles/tokens.css`, `src/styles/index.css` | Pastel ramps, every text pair WCAG AA. Tailwind's default palette is removed, so only tokens can be used. Apps get their accent from `data-app`. |
| Fonts | `@fontsource/andika`, `@fontsource/fredoka` | Self-hosted, Latin + Latin Extended. Andika for anything she reads or types, Fredoka for titles and buttons. |
| Strings | `src/i18n/pl.ts` | Every word on screen and every spoken line. |
| State | `src/store/useOkienko.ts`, `src/store/storage.ts` | Zustand + persist to localStorage, `schemaVersion` + `migrate`. Storage is one adapter, so IndexedDB later is one file. Export/import JSON in the parent panel. |
| Keyboard | `src/keyboard/polish.ts` (+ tests) | Reads `KeyboardEvent.key`; handles Option (Mac) and AltGr (Windows, reported as Ctrl+Alt), ignores shortcuts, rescues a Mac on the wrong layout. Drives the glowing on-screen keyboard. |
| Apps | `src/apps/registry.ts`, `src/apps/AppFrame.tsx` | Each app is one registry entry. Every app renders in `AppFrame` (full screen now, a window when windows unlock). |
| Game content | `src/content/balonowy-las.json` | Levels, letters, speed and hint timing. Tune without code. |
| Smoczek | `src/components/Smoczek.tsx`, `src/styles/smoczek.css` | PoC drawing. Each body part is a layer with a fixed class name; one class per pose (`idle`, `happy`, `cheer`, `thinking`, plus `talking`). The final art replaces the shapes and keeps the class names. |
| Voice | `src/lib/speak.ts` | One `speak()` on Web Speech, preferring Polish voices (Zosia on macOS, Paulina on Windows, Google polski). Swap for recorded lines later. |
| Sound | `src/lib/sound.ts` | Small synthesised kit (Web Audio), no audio files. |
| Pictures | `src/assets/pictures.ts` | Fluent Emoji Flat (MIT, Microsoft), extracted by `scripts/extract-pictures.mjs`. |

Upgrade threshold: `UPGRADE_STARS` in `src/store/useOkienko.ts` (5 stars, about two good rounds).
