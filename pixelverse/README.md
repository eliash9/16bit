# PIXELVERSE

A mobile-first, playable 16-bit digital agency profile. Built with Vue 3 Composition API, TypeScript, Vite, Phaser **3.90**, Pinia and Vue Router. All graphics, fonts and sounds run locally; there are no CDN or external asset requirements.

## Setup

Use Node.js **24.11+** (or a supported newer LTS). The current Vite/Vue toolchain requires this version.

```sh
cd pixelverse
npm ci
npm run dev
```

Open the Local URL printed by Vite (normally http://localhost:5173).

```sh
npm run build
npm run preview
```

The build runs Vue/TypeScript checks, produces a lazy-loaded static application in `dist/`, then prerenders `/agency`, `/services`, `/portfolio` and `/contact` into complete HTML pages with route-specific titles and descriptions. Deploy `dist/` on a static host that serves directory index files and falls back to `index.html` for client routes. A Netlify-compatible `_redirects` file is included. No server runtime is required. Prerendered pages include semantic content before JavaScript; the client mounts the interactive application on load.

## Play

- Click or Tab to focus the town, then walk with **WASD** or **arrow keys**.
- **Click or tap ground** to follow a collision-safe grid path. Unreachable ground/buildings are ignored; tap the path in front of a building.
- On touch devices, drag the **virtual joystick**. Its pointer capture supports movement outside the control and resets on release/cancel.
- Approach an entrance, then press **E** or **Space**, or use the Vue **Enter** button.
- Use the crosshair to return to the square, or expand the world with fullscreen where supported.
- Tab leaves gameplay normally. Header links, the adventure directory and quick links open all business content without playing.
- The sound button toggles a short procedural interaction chime. Sound starts muted. Muting and player position persist through localStorage; unavailable or malformed storage is handled safely.

## Content

- **Agency HQ** — agency introduction and approach.
- **Portfolio Castle** — three expandable concept projects.
- **Service Workshop** — brand strategy, product design and development.
- **Contact Portal** — accessible validated contact form with an editable local preview.

PIXELVERSE and its projects are illustrative demo content. The form **does not send or save messages**; it has no backend, analytics, authentication, payments, CMS or multiplayer.

## Architecture

```text
src/
  game/
    BootScene.ts       Procedural player textures and walk animations
    WorldScene.ts      Town, player, Arcade collision, camera and interactions
    pathfinding.ts     Collision-aware breadth-first grid routing
    bridge.ts          Typed event payloads and unsubscribe functions
  components/
    GameWorld.vue      Lazy Phaser lifecycle, resize observer and Vue HUD
    VirtualJoystick.vue  Pointer capture and normalized movement vectors
  stores/app.ts        Pinia settings, discovery state and safe persistence
  data/locations.ts    Typed destination data and entrance positions
  views/
    TownView.vue       World, adventure directory and help
    ContentView.vue    Routed agency content and form
  router.ts            Lazy routes and client metadata
  prerender.ts         Build-only Vue renderer
scripts/prerender.mjs  Static content route generation
```

Phaser owns only the world. Vue owns navigation, HUD, instructions, content and forms. Events such as `position`, `nearby`, `enter`, `move`, `pause` and `mute` are type checked. Subscriptions return cleanup functions. Route unmount snapshots the exact player position, disconnects the observer, removes DOM listeners, and destroys the Phaser instance; scene shutdown releases bridge listeners, keyboard handlers and the optional audio context. Async game imports check for disposal before creating an instance.

Textures use stable `player-{direction}-{frame}` names, so `BootScene` can later load an atlas with the same keys. Replace the procedural building/tree painters in `WorldScene` with sprites while retaining `locations`, collision rectangles and interaction points. No image generator, paid assets or runtime image requests are needed.

## Rendering & accessibility

- Nearest-neighbor canvas filtering, pixel-art textures and round-pixel positioning. A logical 1:1 backing buffer avoids unnecessary devicePixelRatio multiplication; responsive resize and camera zoom adapt the view to available space. Fractional overview zoom uses nearest-neighbor sampling.
- Phaser AUTO uses Canvas if WebGL is unavailable. If game initialization fails entirely, Vue displays a fallback and all direct content navigation remains available.
- Portrait-first layout with coarse-pointer joystick and landscape/fullscreen support.
- Reduced-motion preference stops walk-frame animation and CSS transitions/spinners while keeping movement usable.
- Gameplay captures movement only while its canvas is focused. Navigation, forms and Enter buttons remain keyboard-accessible, with visible focus, a skip link and semantic labels.
- Scene pauses when the document is hidden; movement resets on window blur.
- Phaser is a separate lazy chunk (roughly 320 KB gzipped) and is never fetched on direct business routes. Its large-chunk build notice is expected.

## Browser checks

```sh
npm test
```

Playwright uses installed Google Chrome and starts/stops a local Vite server. If Chrome is unavailable, install a Playwright Chromium browser and remove `channel: 'chrome'` in `playwright.config.ts`. Tests cover keyboard movement, tap navigation and entry, route teardown/recreation, direct routes, mute persistence, project expansion, form validation/preview, mobile pointer controls, landscape overflow, and Canvas rendering with WebGL disabled. Test screenshots are written under ignored `test-results/`.
