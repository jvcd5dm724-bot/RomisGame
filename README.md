# Romi's English Adventure 🦝🕵️

A cozy TV-themed web app that helps Romi (age 9, Hebrew-speaking, English
beginner) learn English through a raccoon detective's mystery quests, acting,
singing, dancing, painting and writing. Built as an offline-first Progressive
Web App — no backend, no accounts, no ads, no analytics. All progress lives
on the device.

Currently built: **Mystery Channel** (episodic riddle quests). Stage, Move,
Art and Story Journal show as "coming soon" TV static and switch on later.

## Tech stack

- Vite + TypeScript (strict), no UI framework
- Vanilla DOM components (`src/ui/`) — no React/Vue/etc.
- `vite-plugin-pwa` for the manifest + offline service worker
- `vitest` for unit tests, `@playwright/test` (WebKit, iPhone 12 profile) for
  end-to-end smoke tests
- All learning content lives in JSON under `src/content/` — never hard-coded
  in components
- Progress (stars, streak, spaced-repetition boxes, collectibles, parent
  settings) is stored in `localStorage`; voice recordings are stored in
  IndexedDB. Nothing leaves the device.

## Running locally

```bash
npm install
npm run dev          # http://localhost:5173/RomisGame/
```

## Testing

```bash
npm test             # unit tests (Leitner spaced repetition, streak, stars, content validation)
npm run validate-content   # fails if any content item is missing required Hebrew hints
npm run lint          # tsc --noEmit
npm run test:e2e      # Playwright, iPhone 12 device profile
```

`npm run test:e2e` uses Playwright's WebKit engine (closest match to iPhone
Safari). If WebKit isn't installed yet, run `npx playwright install webkit`
first — CI does this automatically. Screenshots from each e2e run are saved
to `test-results/screenshots/`.

## Adding words

Add an entry to a file under `src/content/words/` (or create a new category
file and import it in `src/content/index.ts`). Every word needs:

```json
{
  "id": "color-purple",
  "en": "purple",
  "category": "colors",
  "emoji": "🟣",
  "he": "סגול",
  "he_help": "מצאי את הצבע הסגול.",
  "he_reviewed": false
}
```

- `he` is the short Hebrew meaning (tap 1 on the hint button).
- `he_help` is a short Hebrew instruction, required on episode steps
  (clues/riddles/instructions), optional on plain vocabulary words.
- `he_reviewed` must start `false`. A parent approves it from the Parent
  screen (hold the ⚙️ icon on the home screen for 3 seconds), which stores
  the approval/edit on-device and overrides the bundled text at runtime.
- `image` (png/svg path) can be added later to override the emoji.
- `audio` (a recorded audio file path) can be added later to override
  `speechSynthesis`.

Run `npm run validate-content` after adding content — it fails the build if
any word, episode, or step is missing its required Hebrew hint(s).

## Adding a Mystery Channel episode

Add a JSON file under `src/content/episodes/` (see `episode-01.json` for a
full example) and import it into the `episodes` array in
`src/content/index.ts`. An episode is a chain of steps:

- `intro` — teaches one new word (hear it, see it, say it into the mic,
  continue).
- `choice` — a clue: pick the right word among 2 decoys. Keep the English
  prompt to 6 words or fewer.
- `riddle` — the final riddle of the episode, same shape as `choice`.
- `unlock` — the win screen: reward text + a cliffhanger for the next
  episode, awards the episode's collectible.

Every step needs `he` and `he_help`. Episodes should be short: 5–7 steps,
always ending on a win.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes `dist/` to GitHub Pages. `.github/workflows/ci.yml` runs
type-checking, content validation, unit tests, and the Playwright e2e smoke
test on every push and pull request.

The site is served from `/RomisGame/` (the repo name) — see `base` in
`vite.config.ts` and `start_url`/`scope` in the PWA manifest config if the
repo is ever renamed.

## Installing on Romi's iPhone

1. Open the deployed GitHub Pages URL in **Safari** (must be Safari, not
   another browser, for "Add to Home Screen" to install a proper PWA).
2. Tap the Share button → **Add to Home Screen**.
3. Open it once while online so the service worker caches everything; after
   that it works fully offline.

## Project structure

```
src/
  content/       JSON content (words, episodes, collectibles) + types + validation
  progress/      Leitner spaced repetition, streak, stars, localStorage persistence
  audio/         speechSynthesis wiring, iOS audio unlock, record-and-compare mic,
                 looping background music with ducking during speech
  state/         app-wide store on top of progress/storage.ts
  ui/            home screen, Mystery Channel player, hint button, parent screen,
                 the persistent music mute/unmute toggle
  styles/        theme (Streetwear Pop palette), fonts, per-screen CSS
tests/           vitest unit tests
tests/e2e/       Playwright smoke tests
scripts/         validate-content.ts (CI + tests), generate-icons.mjs (placeholder
                 app icons), generate-bg-music.py (synthesizes the background loop)
```

## Design notes

- **Palette**: Streetwear Pop — off-black background, electric purple / hot
  pink / lime-green accents (`src/styles/theme.css`).
- **Hebrew hints**: every activity screen has one hint button (bottom
  corner, 56px+). Tap 1 = meaning, tap 2 = help text, tap 3 = spoken aloud.
  Hint mode (always / after first try / off) is set from the Parent screen.
  Using a hint counts as a partial miss in the spaced-repetition schedule.
- **Spaced repetition**: a 5-box Leitner system (`src/progress/leitner.ts`).
  Correct answers move a word up a box (comes back later); a wrong answer or
  a hint drops it down (comes back sooner).
- **Streak**: one free "rest day" per week; a missed day never erases stars,
  collectibles, or word progress.
- **Background music**: a short, original, seamless loop (synthesized with
  `scripts/generate-bg-music.py`, no external audio assets or licensing
  concerns) plays on a first tap, on by default, with a visible 🔊/🔇 toggle
  (top-right, persistent across screens) that's remembered across sessions.
  It automatically ducks to a low volume while a word or hint is being
  spoken, then fades back up.
- **Original content only**: no Bluey or Billie Eilish characters, names,
  music, or likenesses anywhere in code or content — only tone inspiration,
  with original characters and chants.

## Credits

- Raccoon illustration (`src/assets/images/raccoon.svg`, used for the "raccoon"
  word card, the home-screen guide, and the app icons/favicon): "raccoon"
  (U+1F99D) from [OpenMoji](https://openmoji.org/library/emoji-1F99D/) — the
  open-source emoji and icon project — licensed under
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/#).
