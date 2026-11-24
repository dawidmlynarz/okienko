# Smoczy Domek

A pretend computer in the browser where a 7-year-old learns to use a computer. This is the PoC:
she logs in with two steps (types her name, then picks her picture-PIN) and lands in Smoczek's house.
There she chats with Smoczek, plays six games and writes in **Notatnik**. Every finished round
earns 1 to 3 stars. Stars are pocket money: in **Szafa Smoczka** (Smoczek's changing room) she spends them
on gadgets for Smoczek, from a bow tie for 3 stars to a crown for 25. Gadgets live in `src/wardrobe/`.
Every game and level is open from the start.

| Game | Teaches |
| --- | --- |
| **Balonowy Las** | Letters on the keyboard, including Polish letters |
| **Obrazkowe Słowa** | Spelling short words from a picture |
| **Łap Biedronki** | Pointing and clicking with the mouse |
| **Smocze Memory** | Clicking, memory, finding pairs |
| **Liczymy Jabłka** | Counting and the number row |
| **Konik wraca do stajni** | Arrow keys, left and right, and planning steps like a tiny program |

Target: Chrome on a MacBook (Polish Pro layout) or a Windows PC (Polish programmer's layout), physical keyboard.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # keyboard module + game content tests
npm run build    # static site in dist/
```

The first screen is a one-minute setup for the parent (her name and Smoczek's colour).
Parent settings later: **Dla rodzica** on the login screen (behind a small times-table question).

## Deploy

Every push to this repo deploys to GitHub Pages: https://dawidmlynarz.github.io/okienko/
(`.github/workflows/pages.yml`). `dist/` is a plain static site with relative paths, so any static host works.

- **Vercel**: Import the repo at vercel.com/new. It detects Vite; no settings needed.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`.

Every push gets a preview URL on either host.

## How it is built

| Piece | Where | Notes |
| --- | --- | --- |
| Design tokens | `src/styles/tokens.css`, `src/styles/index.css` | Pastel ramps, every text pair WCAG AA. Tailwind's default palette is removed, so only tokens can be used. Apps get their accent from `data-app`. |
| Fonts | `@fontsource/andika`, `@fontsource-variable/figtree` | Self-hosted, Latin + Latin Extended. Andika for anything she reads or types, Figtree for titles and buttons (Fredoka was dropped: it has no ą ć ę ń ś ź ż). |
| Strings | `src/i18n/pl.ts` | Every word on screen and every spoken line. |
| State | `src/store/useDomek.ts`, `src/store/storage.ts` | Zustand + persist to localStorage, `schemaVersion` + `migrate`. Storage is one adapter, so IndexedDB later is one file. Export/import JSON in the parent panel. |
| Keyboard | `src/keyboard/polish.ts` (+ tests) | Reads `KeyboardEvent.key`; handles Option (Mac) and AltGr (Windows, reported as Ctrl+Alt), ignores shortcuts, rescues a Mac on the wrong layout. Drives the glowing on-screen keyboard. |
| Apps | `src/apps/registry.ts`, `src/apps/AppFrame.tsx` | Each app is one registry entry. Every app renders in `AppFrame` (full screen now, a window when windows unlock). |
| Games | `src/apps/<game>/`, `src/apps/shared/GameKit.tsx` | Every game shares the level picker, HUD and star result from `GameKit`. A game is its levels plus one `Round` component. |
| Game content | `src/content/*.json` | Levels, words, speeds and hint timing for each game. Tune without code. |
| Smoczek | `src/components/Smoczek.tsx`, `src/styles/smoczek.css` | PoC drawing. His eyes follow the mouse. Each body part is a layer with a fixed class name; one class per pose (`idle`, `happy`, `cheer`, `thinking`, plus `talking`). The final art replaces the shapes and keeps the class names. |
| Voice | `src/lib/speak.ts` | One `speak()` on Web Speech. Ranks installed Polish voices (Premium/Enhanced on macOS, Google polski in Chrome) and speaks sentence by sentence for natural pauses. Swap for recorded lines later. |
| Sound | `src/lib/sound.ts` | Small synthesised kit (Web Audio), no audio files. |
| Pictures | `src/assets/pictures.ts` | Fluent Emoji Flat (MIT, Microsoft), extracted by `scripts/extract-pictures.mjs`. |

Dashboard chatter (jokes, facts, petting, game tips) lives in `pl.smoczek` in `src/i18n/pl.ts`.

Upgrade threshold: `UPGRADE_STARS` in `src/store/useDomek.ts` (5 stars, about two good rounds).
