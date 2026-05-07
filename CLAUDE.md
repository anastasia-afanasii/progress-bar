# Progress Bar — WeWeb Custom Component

## File Roles

| File | Owns |
|------|------|
| `ww-config.js` | Every user-facing property, trigger event, and exposed action declaration |
| `wwElement.vue` `<template>` | UI structure — header (label + value) + track + fill |
| `wwElement.vue` `<script>` | Vue Composition API: p()/pN() helpers, working-mode state machine, timer engine, computed styles, exposed actions |
| `wwElement.vue` `<style>` | Indeterminate keyframe + striped-animation keyframe only |
| `AI.md` | WeWeb AI assistant documentation — must stay in sync with ww-config.js |
| `package.json` | No runtime deps (no external libs) |

## Working modes

| Mode | Behavior | Notes |
|------|----------|-------|
| `percent` | `displayValue` mirrors the bound `value` prop, clamped 0–100. | Manual control from a workflow. |
| `timer` | Animates `displayValue` from 0 → 100 over `duration` ms via a CSS `transition: width <duration> linear`. | Auto-start respects `autoStart`; `loop` restarts after complete. |
| `countdown` | Same as `timer` but 100 → 0. | `complete` fires at value 0. |
| `indeterminate` | Width is fixed (40%) and a CSS keyframe slides the fill across the track. | Ignores `value` entirely. |
| `stepped` | `displayValue` = `(currentStep / steps) * 100`. | `nextStep` / `prevStep` / `goToStep` actions. |

## Architecture rules

### p() / pN() convention
- `p(key, fallback)` — strings, booleans, colors. Uses `??` so `0` and `""` are valid values.
- `pN(key, fallback)` — numeric sizes/durations. Uses `||` because `0` falls back.
- Every `ww-config.js` property MUST have a corresponding `p()`/`pN()` call in `setup()`.
- Booleans defaulting to ON use `computed(() => props.content?.foo !== false)` — see `showHeader`, `showValue`, `autoStart`, `animated`.

### Timer engine convention
- The bar is animated by setting an inline `width` (via Vue) WITH a CSS `transition: width <duration> linear`. No `requestAnimationFrame` loop.
- `pause()` reads elapsed = `performance.now() - segmentStart`, computes the current % from elapsed/segmentRemaining, freezes width at that %, and saves `segmentRemaining -= elapsed`.
- `resume()` kicks off a new transition over the leftover `segmentRemaining`.
- `start()` snaps to the from-value with no transition (two `requestAnimationFrame` waits ensure the snap commits before the new transition begins), then sets the to-value.
- `completionTimer` is a single `setTimeout` that fires `complete` and (optionally) loops.

### Emit convention
- Events fire via `emit("trigger-event", { name: "<eventName>", event: { ...payload } })`.
- Event names match `ww-config.js` `triggerEvents[].name` exactly.

### expose() convention
- All exposed actions are listed at the bottom of `setup()` in the `expose({})` call.
- Action function names in `expose()` match `ww-config.js` `actions[].action` values exactly.

## Change Routing

### Adding a new working mode
1. `ww-config.js` → add `{ value: "...", label: "..." }` to `workingMode.options.options`.
2. `wwElement.vue` script → branch in `staticTarget`, `start()`/`pause()`/`reset()`, and `fillStyle`/`fillTransition` if the new mode needs different rendering.
3. `wwElement.vue` script → if it has its own animation, add a class on the fill div and a keyframe in `<style>`.
4. `AI.md` → document the mode under "Working modes" and the `workingMode` property.

### Adding a style property
1. `ww-config.js` → add to `properties` with `section: "style"`, `bindable: true`, `defaultValue`.
2. `wwElement.vue` script → add `p()` or `pN()` call in the Style section.
3. `wwElement.vue` script → extend the relevant `computed()` style object (`trackStyle`, `fillStyle`, `labelStyle`, `valueStyle`, `headerStyle`).
4. `AI.md` → add to the Style properties list.

### Adding a settings/feature toggle
1. `ww-config.js` → add to `properties` with `section: "settings"`, `bindable: true`.
2. `wwElement.vue` script → add the prop reactor and any side-effect (watch / start / reset).
3. `wwElement.vue` template → add `v-if` / conditional class if needed.
4. `AI.md` → add to the Settings properties list.

### Adding a trigger event
1. `ww-config.js` → add to `triggerEvents`.
2. `wwElement.vue` script → call `emit("trigger-event", { name, event })` at the right place.
3. `AI.md` → add to Events list.

### Adding an exposed action
1. `ww-config.js` → add to `actions` array with `action`, `label`, optional `args`.
2. `wwElement.vue` script → implement the function.
3. `wwElement.vue` script → add to the `expose({})` call at bottom of `setup()`.
4. `AI.md` → add to Exposed Actions list.

## Key Locations in wwElement.vue

| What | Where |
|------|-------|
| `p()` / `pN()` settings declarations | top of `setup()` |
| Internal state (displayValue, running, segmentStart, segmentRemaining, completionTimer) | mid `setup()` |
| Timer engine (`start`, `pause`, `resume`, `reset`, `scheduleComplete`) | after state |
| Stepped helpers (`setValue`, `goToStep`, `nextStep`, `prevStep`) | after timer engine |
| Watchers (`staticTarget`, `workingMode`) | after actions |
| `formattedValue` computed | next |
| Computed styles (`containerStyle`, `headerStyle`, `labelStyle`, `valueStyle`, `trackStyle`, `fillBackground`, `fillTransition`, `fillStyle`) | after value formatting |
| `expose({})` | bottom of `setup()` |
