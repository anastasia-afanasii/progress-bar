---
name: progress-bar
description: A WeWeb custom Progress Bar component with five working modes — percent (manual value 0–100), timer (fills 0→100 over a duration), countdown (drains 100→0 over a duration), indeterminate (looping animation, no specific value), and stepped (N discrete steps). Fully styleable: track, fill (solid or gradient), striped pattern, header label and value text. Pause / resume / reset / setValue actions, and start / complete / change / pause / resume / reset events.
keywords: progress, bar, progressbar, percent, percentage, timer, countdown, loading, indeterminate, stepped, steps, wizard, gauge
---

#### Progress Bar

***Purpose:***
A universal progress bar component that handles five common patterns from a single element: a manually controlled percentage, a timer that auto-fills over a duration, a countdown that auto-drains, an indeterminate loading animation, and a stepped wizard-style indicator. Workflow actions allow start / pause / resume / reset and direct value setting.

***Features:***
- 5 working modes: `percent`, `timer`, `countdown`, `indeterminate`, `stepped`
- Smooth CSS-driven width transitions (browser-handled — no JS animation loop)
- Pause / resume that resumes from the exact point where the bar was frozen
- Auto-start toggle and loop-on-complete toggle for timer / countdown modes
- Header row with label + value, four value formats: `percent`, `time`, `step`, `custom` (token-replaced)
- Solid or gradient fill, optional striped pattern, optional animated stripes
- Full per-element style control: track color, fill colors, height, radius, label/value typography
- Six trigger events: start, complete, change, pause, resume, reset
- Eight exposed actions for full programmatic control

***Properties:***

Settings:

- `workingMode`: TextSelect — Operating mode. Options: `percent`, `timer`, `countdown`, `indeterminate`, `stepped`. Default: `percent`.
- `value`: Number — Used in `percent` mode. Bound 0–100 value. Values outside the range are clamped. Default: 0.
- `duration`: Number — Used in `timer` and `countdown` modes. Total time in milliseconds for the bar to fill (or empty). Default: 5000.
- `autoStart`: OnOff — Used in `timer` / `countdown` modes. When ON, the bar starts on mount. When OFF, call `start()` from a workflow. Default: true.
- `loop`: OnOff — Used in `timer` / `countdown` modes. When ON, the bar restarts automatically after completing. Default: false.
- `steps`: Number — Used in `stepped` mode. Total number of discrete steps. Default: 5.
- `currentStep`: Number — Used in `stepped` mode. Current step (0 = empty, equals `steps` = full). Default: 0.
- `showHeader`: OnOff — Show the label/value row above the bar. Default: true.
- `label`: Text — Text shown on the left of the header row. Default: "Progress".
- `showValue`: OnOff — Show the formatted value on the right of the header row. Default: true.
- `valueFormat`: TextSelect — How the value is displayed. Options: `percent` (43%), `time` (0:03 / 0:05), `step` (2 / 5), `custom` (token-replaced text). Default: `percent`.
- `valueCustomText`: Text — Used when `valueFormat = custom`. Tokens: `{value}`, `{percent}`, `{step}`, `{steps}`, `{seconds}`, `{ms}`. Default: `{value}%`.
- `animated`: OnOff — Smooth width transitions in `percent` and `stepped` modes. Timer/countdown always animate. Default: true.
- `transitionDuration`: Number — Length of the smooth transition for `percent`/`stepped` modes in milliseconds (ignored in `timer`/`countdown`). Default: 300.

Style:

- `height`: Number — Bar height in pixels (2–80). Default: 8.
- `radius`: Number — Bar border radius in pixels (0–999). Use 999 for a pill shape; 0 for square corners. Default: 999.
- `trackColor`: Color — Background color of the track. Default: #EDEFF3.
- `fillColor`: Color — Solid fill color (or gradient start color). Default: #2B7FFF.
- `useGradient`: OnOff — Use a left-to-right gradient from `fillColor` to `fillColorEnd`. Default: false.
- `fillColorEnd`: Color — Gradient end color, used when `useGradient` is ON. Default: #51A2FF.
- `striped`: OnOff — Diagonal stripe pattern overlay on the fill. Default: false.
- `stripeAnimated`: OnOff — Slides the stripe pattern horizontally (visible only when `striped` is ON). Default: false.
- `labelColor`: Color — Header label text color. Default: #90A1B9.
- `labelFontSize`: Number — Header label font size in pixels (10–32). Default: 14.
- `labelFontWeight`: TextSelect — Header label font weight (400, 500, 600, 700). Default: 400.
- `labelFontFamily`: Text — Header label font family. Default: empty (inherits the system font).
- `valueColor`: Color — Header value text color. Default: #2B7FFF.
- `valueFontSize`: Number — Header value font size in pixels (10–32). Default: 14.
- `valueFontWeight`: TextSelect — Header value font weight (400, 500, 600, 700). Default: 600.
- `valueFontFamily`: Text — Header value font family. Default: empty (inherits the system font).
- `headerGap`: Number — Vertical gap in pixels between the header row and the bar (0–64). Default: 8.

***Events:***

- `start`: Triggered when a timer/countdown begins. Payload: `{ mode: "", value: 0 }`
- `complete`: Triggered when the bar reaches 100% (timer / percent / stepped) or 0% (countdown). Payload: `{ mode: "", value: 100 }`
- `change`: Triggered whenever the value changes via `setValue`, `goToStep`, or external prop binding. Payload: `{ value: 0, percent: 0 }`
- `pause`: Triggered when `pause()` is called during a running timer/countdown. Payload: `{ value: 0 }`
- `resume`: Triggered when `resume()` is called after a pause. Payload: `{ value: 0 }`
- `reset`: Triggered when `reset()` is called. Payload: `{}`

***Exposed Actions:***

- `start`: Starts a timer or countdown from its initial value. Has no effect in non-timer modes.
- `pause`: Freezes a running timer/countdown at its current visual position.
- `resume`: Resumes a paused timer/countdown over the remaining duration.
- `reset`: Stops any running animation and snaps the bar back to its starting state.
- `setValue`: Imperatively set the bar to a value 0–100. Args: `value` (number).
- `nextStep`: Advance to the next step (stepped mode). No args.
- `prevStep`: Go back to the previous step (stepped mode). No args.
- `goToStep`: Jump to a specific step. Args: `step` (number, 0 to `steps`).

***Notes:***
- Timer / countdown modes use a single CSS `transition: width <duration> linear` — there is no JS animation loop, so the bar is GPU-smooth and inexpensive even on long durations.
- `pause()` reads the elapsed time from `performance.now()` and stores the remaining duration; `resume()` continues with a fresh transition over only the remaining time, so resuming after a 2s pause does not "snap forward".
- In `percent` and `stepped` modes, changing the bound `value` or `currentStep` prop triggers a smooth transition (configurable via `transitionDuration` and `animated`).
- `indeterminate` mode ignores `value` entirely and runs a CSS keyframe animation. Use it as a generic loading state when the duration is unknown.
- The `time` value format displays elapsed in `timer` mode and remaining in `countdown` mode (mapped from the current displayed percent against the configured `duration`).
- Auto-start is suppressed inside the WeWeb editor (`wwEditorState.isEditing`) so the editor preview stays static; in published apps it runs as configured.
