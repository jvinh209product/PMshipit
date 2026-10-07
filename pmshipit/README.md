# SHIP IT! — A Product Manager Simulator

**30 days. One product. Too many decisions.**

A complete client-side simulation by Vinh Nguyen: Discover → Define → Build → Launch → Learn. This export comes from the current updated **version 2**, including Office Life, Character Movement, and Readability. All 37 authored scenarios, 3D office geometry, stakeholder relationships, delayed consequences, prioritization, meetings, launch decisions, incidents, and debriefs are included.

## Quick start

Use Node.js 22 or later; this package was validated with Node.js 24.19.0 and npm 11.9.0. `.nvmrc` selects Node 24.

```sh
cd pmshipit
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Serve the application over HTTP; opening `index.html` directly as a file does not reliably load browser modules. The local server uses only Node built-ins. It serves the current files without compiling them. Refresh after editing.

```sh
npm test
npm run verify
npm run build
npm run preview
```

The production preview uses `http://127.0.0.1:4173`. To choose a port, run `npm run dev -- --port 3000`. For a container or Codespaces, use `npm run dev -- --host 0.0.0.0` and open its forwarded port.

## Stack and build

The current implementation uses HTML, CSS, native JavaScript ES modules, locally vendored Three.js **0.183.2**, and GSAP **3.15.0**. This preserves the working architecture. There is no framework migration, transpilation, package download for runtime assets, or external backend.

`dist/` contains the actual editable application source, matching the original project structure. `npm run build` validates module syntax, imports, assets, scenario data, and portability, then copies these files byte-for-byte into `build/`. Deploy **only `build/`**. The ZIP omits this reproducible output folder; the complete source and all assets are included.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move the PM | WASD or arrow keys | Tap an open floor destination |
| Choose a destination | Click the floor, a room label, or “Walk to…” | Tap the floor or “Walk to…” |
| Nearby interaction | E, or click the contextual action | Tap the contextual action |
| Check in with someone | Click a coworker, walk over, then interact | Tap a coworker, then the action |
| Camera | Drag to rotate; scroll to zoom | Drag to rotate; use zoom buttons |
| Reset view | Office overview / reset button | Office overview / reset button |
| Fast actions | Guided objectives, desk, coffee, room shortcuts | The same large action buttons |
| Desk animation | Skip animation / Fast forward | The same buttons |
| Dialogs | Tab / Shift+Tab, Escape | Tap buttons or outside the dialog |

Walking consumes no simulated workday time. Actions do. Coffee gives +8 focus and +4 energy for five minutes, with two cups per day. Informal check-ins and desk activities have daily cooldowns. Required decisions keep a time reserve. Overlapping meetings continue without the PM. NPC routines remain active while reading dialogs and doing desk work. Reduced motion preserves accessible actions and navigation.

## Project structure

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Page, branded loading, daily objectives, creator section |
| `dist/app.mjs` | UI, dialogs, controls, activities, journal export, persistence wiring |
| `dist/data.mjs` | All 37 scenarios, five chapters, features, people, rooms, social events |
| `dist/engine.mjs` | Game state, resources, decisions, delayed effects, metrics, progression |
| `dist/activities.mjs` | Desk work and informal stakeholder signals |
| `dist/office.mjs` | Procedural office and character geometry, renderer, camera, input |
| `dist/office-life.mjs` | PM controls, NPC routines, poses, meeting movement, proximity actions |
| `dist/navigation.mjs` | Collision-aware A* routes and frame-independent movement |
| `dist/style.css`, `dist/readability.css` | Current responsive design and larger readable details |
| `dist/assets/` | All four local fonts, favicon, and social preview image |
| `dist/vendor/` | Complete local Three.js modules and GSAP bundle |
| `scripts/` | Dependency-free verification, static build, and local HTTP server |
| `tests/` | Simulation, movement, routines, activities, and standalone checks |
| `vercel.json` | Independent Vercel static deployment configuration |
| `EXPORT-MANIFEST.json` | Version provenance and per-file source checksums |
| `VALIDATION.md` | Commands actually run, results, architecture, and verification limits |

## State and assets

The application keeps game progress in browser `localStorage` using the original key, `ship-it-orbit-v1`. Saves include day, time spent, focus, dimensions/energy, relationships, backlog, flags, decisions, delayed consequences, activity cooldowns, and PM position. Existing version-1 saves merge the additional Office Life fields. Storage failures leave the simulation playable in the current tab.

NPC routes and poses are generated in memory from routines and game events. They resume from the appropriate day/event state rather than storing every animation frame. Meeting moderation and a pending desk animation are transient interface state. A new deployment domain has separate browser storage: progress from the old domain is not automatically copied.

The full office and characters are generated from the included Three.js geometry code. There are no missing external model/texture downloads. Screens use generated canvas textures; character motions use articulated joints. Audio is synthesized with Web Audio and starts off. Three.js license text and the existing GSAP license header are preserved. Local fonts retain their embedded license/copyright metadata.

## Deploy your new repository to Vercel

1. Extract the ZIP. Put the **contents of `pmshipit/`** at the root of your new GitHub repository, so `package.json` and `vercel.json` are at the repository root. Include `dist/`, the lockfile, scripts, tests, and assets. There is no need to upload `node_modules/` or `build/`.
2. In Vercel, import that new repository and use project name **pmshipit**. Leave Root Directory at the repository root. If you uploaded the enclosing folder too, set Root Directory to `pmshipit` instead.
3. Choose Framework Preset **Other**. The included configuration sets Install Command `npm ci`, Build Command `npm run build`, and Output Directory `build`.
4. Choose Node.js 24.x. Add **no environment variables**. Deploy when you are ready.
5. Vercel assigns the final address. `pmshipit.vercel.app` is your preferred name; availability was not checked or reserved.

Any static host can serve the generated `build/` directory with JavaScript module and font MIME types. There are no server functions or platform-specific APIs. Open Graph metadata uses a portable local image path; after choosing your final domain, you can optionally make that image URL absolute for social crawlers.

Vercel references: [project configuration](https://vercel.com/docs/project-configuration/vercel-json) and [build settings](https://vercel.com/docs/builds/configure-a-build).

## Environment and verification

No environment variables or secrets are needed. `.env.example` documents this. See `VALIDATION.md` for the actual build/test results and the browser visual-verification limits.

Built by **Vinh Nguyen** · [View my Portfolio](https://vinh-nguyen-portfolio-three.vercel.app/)
