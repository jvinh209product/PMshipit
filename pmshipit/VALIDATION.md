# SHIP IT! — Standalone Export Validation

## Exported version

This package represents **SHIP IT! version 2, the current updated implementation including the Office Life, Character Movement & Readability update**. It was exported from the saved source commit `bf5f51406188ea2b314451b8d82ef6432219ba07`, confirmed as the latest Site version on 7 October 2026.

The application/package version is `1.1.0`. The browser save-format version remains `1` for compatibility; neither number means this is the older initial Site implementation.

All 20 application files are included. **19 are byte-identical to the latest saved source.** The sole application-file change is `dist/index.html`: the old hosting-specific Open Graph URL was removed, and the social image now points to its included local asset. No visible design, gameplay, scenario, animation, typography, or creator content was changed. Source checksums are recorded in `EXPORT-MANIFEST.json`.

The existing hosted source checkout remained clean. No Site version was created or published, no live Site was modified, and no GitHub repository was pushed to or merged.

## Toolchain and commands actually run

| Item | Result |
| --- | --- |
| Actual framework | Static HTML/CSS with native JavaScript ES modules |
| 3D / animation libraries | Locally vendored Three.js 0.183.2 (revision 183), GSAP 3.15.0 |
| Node.js | v24.19.0 |
| npm | 11.9.0 |
| Lockfile | npm lockfile v3; no registry dependencies |
| Lockfile generation | `npm install --package-lock-only --ignore-scripts --offline --no-audit --no-fund` — passed |
| Clean install | `npm ci --offline --no-audit --no-fund` — passed |
| Production build | `npm run build` — passed |
| Application preflight | `npm run verify` — passed |
| Automated tests | `npm test` — **18 passed, 0 failed** |
| Local server script syntax | `node --check scripts/serve.mjs` — passed |
| TypeScript | Not used; no TypeScript compilation is required |
| ZIP completeness/integrity | All project files included; every member compared to its source; ZIP CRC check passed |

The execution host supplied a preexisting unsupported npm `http-proxy` environment setting. It produced a warning during `npm --version`. Validation commands were run with `npm_config_http_proxy` and `NPM_CONFIG_HTTP_PROXY` removed from the command environment. Normal setup is simply `npm ci`; there are no required application environment variables.

The production build validates JavaScript syntax, local imports/assets, UI element references, scenario data, 3D module imports, initial game state, and platform independence. It then copies `dist/` to `build/` and compares every output file with its source. This is a static validation/copy build, preserving the existing buildless architecture.

**Output:** 20 files, 3,799,189 bytes; 25 local asset/import references resolved; all 37 scenarios, five chapters, and eight stakeholder definitions loaded. The `build/` output is reproducible and excluded from the ZIP and Git; `npm run build` regenerates it.

## Automated coverage and verification limits

| Area | Verification performed |
| --- | --- |
| Full journey | 100 varied complete 30-day playthroughs; an additional 30-day playthrough with coffee, check-ins, desk work, and missed meetings |
| Required decisions | All 37 authored scenarios; chapter gates, time reserves, duplicate-decision guards, MVP scope, delayed effects, launch metrics, save restoration |
| Navigation | All 90 room-to-room routes against actual office furniture/partition geometry; movement timing at 30/60/120 FPS |
| PM controls | Simulated WASD/arrow input, release behavior, E interaction, modal/editable-field protection |
| Click / tap | Simulated mouse and touch pointer events use the same real floor ray-picking code; dragging rotates without choosing a destination |
| NPC behavior | Actual procedural model construction, idle routines, changed positions, paired overlapping meetings, incident movement to the war room |
| Activities | Coffee rewards/limits, daily check-in cooldowns/signals, desk work/time reserves, missed-meeting consequences |
| Physical meetings | Walking to a meeting emits the meeting-specific arrival interaction |
| Reduced motion | PM destination navigation and contextual actions remain usable with reduced motion enabled |
| App initialization | The actual `app.mjs` entry executes in a DOM harness; initial objectives and accessible WebGL fallback initialize |
| Major UI panels | DOM harness opens briefing/scenario, calendar, analytics, team, social, coffee, check-ins, desk work/skip, navigation, and decision timeline |
| Module / asset completeness | Native module imports and JS syntax pass; fonts, vendor modules, CSS and images are local and present |
| Readability / mobile styling | Updated CSS and responsive breakpoints are preserved byte-for-byte; touch handlers are tested with synthetic events |

**Browser verification was unavailable.** No desktop/mobile browser, real touch device, GPU-rendered screenshot, visual layout inspection, or performance benchmark was run. The DOM and geometry tests do not establish final visual quality or actual device frame rates. The local preview server was not started in this environment; its syntax was checked. This export does not claim browser visual QA passed.

## Application entry points and architecture

- HTML entry: `dist/index.html`; it loads the local styles, GSAP bundle, and `dist/app.mjs`.
- UI: `app.mjs` renders guided objectives, dialogs, calendar, prioritization board, Analytics Wall, meeting moderation, launch, incidents, social actions, result, and decision replay.
- Scenario data: `data.mjs` preserves all authored options, immediate/delayed effects, time costs, relationships, dependencies, evidence, and learning insights. `activities.mjs` adds five desk activities and informal signals for all eight stakeholders.
- Engine: `engine.mjs` owns day/time, focus, seven dimensions including energy, relationships, backlog, selected scope, flags, bugs/debt, readiness, rollout, history, deferred consequences, metrics, cooldowns, and progression. Optional actions keep a required-work time reserve.
- 3D: `office.mjs` constructs the cutaway office, rooms, furniture, screens, plants, Product Health object, and articulated characters using Three.js primitives. It uses an orthographic camera, shared materials, and floor/object raycasting. No external model files are needed.
- PM: `office-life.mjs` handles keyboard walking, destination navigation, nearby E/click/tap actions, room/meeting arrivals, positioning, and camera-follow behavior.
- Navigation: `navigation.mjs` uses a lightweight grid A* search with collision rectangles, segment checks, route smoothing, and delta-time movement. Keyboard motion includes collision sliding.
- NPCs: nine coworker actors use timed routines for desks, coffee, conversations, meetings, and event responses. Joint poses represent idle, walking, seated/typing, talking, coffee, meetings, celebration, and concern. Release/incident states gather the appropriate team.

## Persistence

Browser `localStorage` uses `ship-it-orbit-v1`. Game state and PM position are saved locally. Restore merges default Office Life fields into older compatible saves. Storage failures leave the game playable in the current tab.

NPC routes, animation phases, meeting moderation sessions, and active desk-animation timers are transient in-memory state. NPC routines restart according to restored game state; exact animation frames are not persisted. No sample user save or personal browser data is included in this package.

A different origin gets separate browser storage. Existing progress on the old hosted domain is not automatically transferred to a new Vercel domain.

## Asset inventory

| Included file / source | Bytes / purpose |
| --- | --- |
| `assets/studio-regular.ttf` | 353,824; original local regular font |
| `assets/studio-medium.ttf` | 341,324; original local medium font |
| `assets/studio-bold.ttf` | 333,612; original local bold font |
| `assets/studio-mono.ttf` | 205,748; original local mono font |
| `assets/favicon.svg` | 212; branded favicon |
| `assets/og-preview.png` | 183,325; existing social-preview image |
| `vendor/three.core.js` | 1,421,746; complete Three.js core module |
| `vendor/three.module.js` | 639,046; complete Three.js renderer/module |
| `vendor/gsap.min.js` | 72,927; complete GSAP bundle with existing license header |
| `vendor/THREE-LICENSE.txt` | 1,081; preserved Three.js license |
| `office.mjs` | Complete procedural office, character geometry, materials, screen texture generation |
| `office-life.mjs` | Complete character poses and movement/routine logic |
| `app.mjs` | Inline SVG interface icons and synthesized Web Audio tones |

All paths in the table are under `dist/`. Fonts retain their embedded Ubuntu/Canonical metadata. The original vendor license notices are included. There are no additional external models, sprites, audio files, or downloaded texture requirements to omit.

## Mobile, accessibility, and performance

The latest larger copy, dialogue, decision cards, secondary text, contrast, stacked mobile panels, and readable overlays are preserved. Mobile uses tap-to-move and large contextual controls; no virtual joystick is required. Guided shortcuts keep core gameplay available. The accessible text-office fallback remains when WebGL initialization fails.

The original keyboard controls, focus styles, dialog focus handling, Escape close, labelled buttons, textual health/clock/mood, and reduced-motion behavior remain. Meaningful state is also shown in text.

The renderer keeps the original low-power preference and pixel-ratio cap of 1.65. Low-poly geometry, shared materials, canvas-generated screens, local assets, lightweight A*, capped frame deltas, and the ambient movement cap are retained. Ambient NPC scheduling allows up to six movers; product-event gatherings can move more actors. The render loop pauses when the document is hidden. It does not add viewport-intersection pausing when the page is merely scrolled away. No new crowd AI, framework, backend, or texture/model pipeline was introduced.

## Warnings and limits

1. **Existing Three.js deprecation:** the preserved office creates `THREE.Clock`. The bundled revision 183 marks this API deprecated and can log `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` This is a retained, non-blocking notice; the export does not upgrade the gameplay/rendering implementation.
2. **Visual/device verification:** actual browser rendering, responsive visual quality, real mobile taps, and frame-rate measurements were unavailable, as detailed above.
3. **npm host warning:** a preexisting host proxy setting caused a warning during the version check; it is not an application dependency and did not affect the clean install/build/test results.
4. **Social metadata:** the exported image path is portable and local. An absolute image URL may be set after choosing the final domain for social crawlers. No old Site address remains in the application.
5. **Domain availability:** `pmshipit.vercel.app` was not checked or reserved. No Vercel deployment was created.

There were no package-install or production-build warnings after removing the host-only unsupported proxy setting. No application validation failures remain.

## Environment and runtime independence

**No environment variables are required.** `.env.example` contains documentation only, with no secrets or variable assignments.

The exported application has no ChatGPT Sites runtime, platform-only API, authentication, storage, D1, R2, hidden hosting URL, or internal service dependency. Runtime dependencies are the locally included browser code and standard browser APIs. The preserved external portfolio CTA is a user-facing link, not a runtime dependency. Hosting identity, Git metadata, credentials, user saves, and local execution artifacts are excluded.

## Vercel instructions

Upload the contents of `pmshipit/` to a new repository with `package.json` at its root. Import that new repository into Vercel as a new project named `pmshipit`.

| Setting | Value |
| --- | --- |
| Framework Preset | Other (`framework: null`) |
| Node.js | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `build` |
| Environment Variables | None |
| Root Directory | Repository root; use `pmshipit` only if the enclosing folder was uploaded |

`vercel.json` includes the install/build/output settings. Configuration references were checked against Vercel's official [vercel.json documentation](https://vercel.com/docs/project-configuration/vercel-json) and [build documentation](https://vercel.com/docs/builds/configure-a-build). The final Vercel domain is assigned by Vercel when you deploy; this task creates only the downloadable source ZIP.
