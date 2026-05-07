# Progress Bar — WeWeb Custom Component

Universal progress bar for [WeWeb](https://www.weweb.io/) with **5 working modes** in a single element:

| Mode | What it does |
|---|---|
| `percent` | Bind a 0–100 value, smooth transitions on change |
| `timer` | Auto-fill 0 → 100 over a duration (ms) |
| `countdown` | Auto-drain 100 → 0 over a duration (ms) |
| `indeterminate` | Looping animation (loading state, no value) |
| `stepped` | N discrete steps (wizard / onboarding indicator) |

Pause / resume / reset / setValue / step actions, six trigger events, full per-element styling.

## Features

- 5 working modes from one component
- Smooth CSS-driven `width` transitions — no JS animation loop, GPU-friendly
- `pause()` / `resume()` resume from the exact frozen position (not a restart)
- `loop` toggle for repeating timer/countdown animations
- Header row with 4 value formats: `percent`, `time` (`0:03 / 0:05`), `step` (`2 / 5`), `custom` (token-replaced)
- Solid or gradient fill, optional striped + animated stripe overlays
- Six trigger events: `start`, `complete`, `change`, `pause`, `resume`, `reset`
- Eight exposed actions: `start`, `pause`, `resume`, `reset`, `setValue`, `nextStep`, `prevStep`, `goToStep`
- Zero runtime dependencies — vanilla Vue 3 Composition API + CSS

## Installation in WeWeb

1. Open your WeWeb project → **Editor → Custom code → Add custom element**.
2. Upload (or paste) these three files:
   - [`ww-config.js`](./ww-config.js)
   - [`wwElement.vue`](./wwElement.vue)
   - [`AI.md`](./AI.md)
3. Drop the **Progress Bar** element onto a page from the left panel.
4. Configure properties from the right panel (Settings + Style sections).

No npm dependencies — the component works as-is.

## Quick examples

**Percent (bound to a state variable):**
- `Working Mode` = `percent`
- `Value` = bind to `myUploadProgress` (0–100)

**Timer (5-second splash screen):**
- `Working Mode` = `timer`
- `Duration` = `5000`
- `Auto-start` = ON
- On `complete` → workflow → navigate to next page

**Countdown (OTP / session expiring):**
- `Working Mode` = `countdown`
- `Duration` = `60000`
- `Value Format` = `time` → displays `1:00 / 1:00` counting down
- `Loop` = OFF, on `complete` → workflow → show "Code expired"

**Stepped (5-step onboarding):**
- `Working Mode` = `stepped`
- `Total Steps` = `5`
- `Current Step` = bind to your wizard state (0–5)
- `Value Format` = `step` → displays `3 / 5`

## Properties / Events / Actions

The full list of properties, default values, events and actions is in [`AI.md`](./AI.md) — that file is also the WeWeb AI assistant's reference for this component.

## Architecture & contributing

See [`CLAUDE.md`](./CLAUDE.md) for the architecture guide (file roles, `p()` / `pN()` convention, the timer-segment engine, change-routing rules for adding new properties / modes / events).

## License

MIT — see [`LICENSE`](./LICENSE).
