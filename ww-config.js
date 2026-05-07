export default {
  options: { displayAllowedValues: ["flex", "inline-flex", "block"] },
  inherit: { type: "ww-layout" },
  editor: { label: { en: "Progress Bar" }, icon: "progress" },

  properties: {
    // ── Working mode ───────────────────────────────────────────────────────
    workingMode: {
      label: { en: "Working Mode" },
      type: "TextSelect",
      section: "settings",
      bindable: true,
      defaultValue: "percent",
      options: {
        options: [
          { value: "percent",       label: "Percent (manual value)" },
          { value: "timer",         label: "Timer (0 → 100 in duration)" },
          { value: "countdown",     label: "Countdown (100 → 0 in duration)" },
          { value: "indeterminate", label: "Indeterminate (loading loop)" },
          { value: "stepped",       label: "Stepped (N discrete steps)" },
        ],
      },
      /* wwEditor:start */
      propertyHelp: { tooltip: "How the progress bar advances. percent: bind value 0-100 yourself. timer/countdown: animate over duration. indeterminate: looping animation. stepped: N steps." },
      /* wwEditor:end */
    },

    // ── Percent mode ───────────────────────────────────────────────────────
    value: {
      label: { en: "Value (0–100)" },
      type: "Number",
      section: "settings",
      bindable: true,
      defaultValue: 0,
      options: { min: 0, max: 100, step: 1, defaultValue: 0 },
      /* wwEditor:start */
      bindingValidation: { type: "number", tooltip: "Number between 0 and 100" },
      propertyHelp: { tooltip: "Used in 'percent' mode. Bind any number 0-100. Values outside the range are clamped." },
      /* wwEditor:end */
    },

    // ── Timer / Countdown mode ─────────────────────────────────────────────
    duration: {
      label: { en: "Duration (ms)" },
      type: "Number",
      section: "settings",
      bindable: true,
      defaultValue: 5000,
      options: { min: 100, max: 600000, step: 100, defaultValue: 5000 },
      /* wwEditor:start */
      propertyHelp: { tooltip: "Used in 'timer' and 'countdown' modes. Total time in milliseconds for the bar to fill (or empty)." },
      /* wwEditor:end */
    },

    autoStart: {
      label: { en: "Auto-start Timer" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Used in 'timer' and 'countdown' modes. When ON, the bar starts on mount. When OFF, call the start() action from a workflow." },
      /* wwEditor:end */
    },

    loop: {
      label: { en: "Loop on Complete" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: false,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Used in 'timer' and 'countdown' modes. When ON, the bar restarts automatically after completing." },
      /* wwEditor:end */
    },

    // ── Stepped mode ───────────────────────────────────────────────────────
    steps: {
      label: { en: "Total Steps" },
      type: "Number",
      section: "settings",
      bindable: true,
      defaultValue: 5,
      options: { min: 1, max: 100, step: 1, defaultValue: 5 },
      /* wwEditor:start */
      propertyHelp: { tooltip: "Used in 'stepped' mode. Total number of discrete steps." },
      /* wwEditor:end */
    },

    currentStep: {
      label: { en: "Current Step" },
      type: "Number",
      section: "settings",
      bindable: true,
      defaultValue: 0,
      options: { min: 0, max: 100, step: 1, defaultValue: 0 },
      /* wwEditor:start */
      propertyHelp: { tooltip: "Used in 'stepped' mode. Current step (0 = empty, equals 'Total Steps' = full)." },
      /* wwEditor:end */
    },

    // ── Header (label + value) ─────────────────────────────────────────────
    showHeader: {
      label: { en: "Show Header" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Show the label/value row above the bar." },
      /* wwEditor:end */
    },

    label: {
      label: { en: "Label" },
      type: "Text",
      section: "settings",
      bindable: true,
      defaultValue: "Progress",
      /* wwEditor:start */
      options: { placeholder: "Progress" },
      /* wwEditor:end */
    },

    showValue: {
      label: { en: "Show Value" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
    },

    valueFormat: {
      label: { en: "Value Format" },
      type: "TextSelect",
      section: "settings",
      bindable: true,
      defaultValue: "percent",
      options: {
        options: [
          { value: "percent", label: "Percent (43%)" },
          { value: "time",    label: "Time (0:03 / 0:05)" },
          { value: "step",    label: "Step (2 / 5)" },
          { value: "custom",  label: "Custom text" },
        ],
      },
      /* wwEditor:start */
      propertyHelp: { tooltip: "How the value is displayed in the header. 'time' is most useful in timer/countdown modes. 'step' in stepped mode." },
      /* wwEditor:end */
    },

    valueCustomText: {
      label: { en: "Custom Value Text" },
      type: "Text",
      section: "settings",
      bindable: true,
      defaultValue: "{value}%",
      /* wwEditor:start */
      options: { placeholder: "{value}% — {step}/{steps} — {seconds}s" },
      propertyHelp: { tooltip: "Used when Value Format = custom. Tokens: {value}, {percent}, {step}, {steps}, {seconds}, {ms}." },
      /* wwEditor:end */
    },

    // ── Behavior ───────────────────────────────────────────────────────────
    animated: {
      label: { en: "Animate Transitions" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Smooth width transitions in 'percent' and 'stepped' modes. Timer/countdown always animate." },
      /* wwEditor:end */
    },

    transitionDuration: {
      label: { en: "Transition Duration (ms)" },
      type: "Number",
      section: "settings",
      bindable: true,
      defaultValue: 300,
      options: { min: 0, max: 2000, step: 50, defaultValue: 300 },
      /* wwEditor:start */
      propertyHelp: { tooltip: "Length of the smooth transition for percent/stepped modes (ignored in timer/countdown — those use 'Duration')." },
      /* wwEditor:end */
    },

    // ── Style: track ───────────────────────────────────────────────────────
    height: {
      label: { en: "Bar Height (px)" },
      type: "Number",
      section: "style",
      bindable: true,
      defaultValue: 8,
      options: { min: 2, max: 80, step: 1, defaultValue: 8 },
    },

    radius: {
      label: { en: "Bar Border Radius (px)" },
      type: "Number",
      section: "style",
      bindable: true,
      defaultValue: 999,
      options: { min: 0, max: 999, step: 1, defaultValue: 999 },
      /* wwEditor:start */
      propertyHelp: { tooltip: "Use 999 for a pill shape; 0 for square corners." },
      /* wwEditor:end */
    },

    trackColor: {
      label: { en: "Track Color" },
      type: "Color",
      section: "style",
      bindable: true,
      defaultValue: "#EDEFF3",
    },

    // ── Style: fill ────────────────────────────────────────────────────────
    fillColor: {
      label: { en: "Fill Color" },
      type: "Color",
      section: "style",
      bindable: true,
      defaultValue: "#2B7FFF",
    },

    useGradient: {
      label: { en: "Gradient Fill" },
      type: "OnOff",
      section: "style",
      bindable: true,
      defaultValue: false,
    },

    fillColorEnd: {
      label: { en: "Gradient End Color" },
      type: "Color",
      section: "style",
      bindable: true,
      defaultValue: "#51A2FF",
      /* wwEditor:start */
      propertyHelp: { tooltip: "Used when Gradient Fill is ON. Linear left → right gradient from Fill Color to this color." },
      /* wwEditor:end */
    },

    striped: {
      label: { en: "Striped Pattern" },
      type: "OnOff",
      section: "style",
      bindable: true,
      defaultValue: false,
    },

    stripeAnimated: {
      label: { en: "Animate Stripes" },
      type: "OnOff",
      section: "style",
      bindable: true,
      defaultValue: false,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Slides the stripe pattern horizontally. Visible only when Striped Pattern is ON." },
      /* wwEditor:end */
    },

    // ── Style: header text ─────────────────────────────────────────────────
    labelColor: {
      label: { en: "Label Color" },
      type: "Color",
      section: "style",
      bindable: true,
      defaultValue: "#90A1B9",
    },

    labelFontSize: {
      label: { en: "Label Font Size (px)" },
      type: "Number",
      section: "style",
      bindable: true,
      defaultValue: 14,
      options: { min: 10, max: 32, step: 1, defaultValue: 14 },
    },

    labelFontWeight: {
      label: { en: "Label Font Weight" },
      type: "TextSelect",
      section: "style",
      bindable: true,
      defaultValue: "400",
      options: {
        options: [
          { value: "400", label: "Normal (400)" },
          { value: "500", label: "Medium (500)" },
          { value: "600", label: "Semi-bold (600)" },
          { value: "700", label: "Bold (700)" },
        ],
      },
    },

    labelFontFamily: {
      label: { en: "Label Font Family" },
      type: "Text",
      section: "style",
      bindable: true,
      defaultValue: "",
      /* wwEditor:start */
      options: { placeholder: "Inter, sans-serif" },
      propertyHelp: { tooltip: "Leave empty to inherit the system font." },
      /* wwEditor:end */
    },

    valueColor: {
      label: { en: "Value Color" },
      type: "Color",
      section: "style",
      bindable: true,
      defaultValue: "#2B7FFF",
    },

    valueFontSize: {
      label: { en: "Value Font Size (px)" },
      type: "Number",
      section: "style",
      bindable: true,
      defaultValue: 14,
      options: { min: 10, max: 32, step: 1, defaultValue: 14 },
    },

    valueFontWeight: {
      label: { en: "Value Font Weight" },
      type: "TextSelect",
      section: "style",
      bindable: true,
      defaultValue: "600",
      options: {
        options: [
          { value: "400", label: "Normal (400)" },
          { value: "500", label: "Medium (500)" },
          { value: "600", label: "Semi-bold (600)" },
          { value: "700", label: "Bold (700)" },
        ],
      },
    },

    valueFontFamily: {
      label: { en: "Value Font Family" },
      type: "Text",
      section: "style",
      bindable: true,
      defaultValue: "",
      /* wwEditor:start */
      options: { placeholder: "Inter, sans-serif" },
      /* wwEditor:end */
    },

    headerGap: {
      label: { en: "Header → Bar Gap (px)" },
      type: "Number",
      section: "style",
      bindable: true,
      defaultValue: 8,
      options: { min: 0, max: 64, step: 1, defaultValue: 8 },
    },
  },

  triggerEvents: [
    { name: "start",    label: { en: "On start" },    event: { mode: "", value: 0 } },
    { name: "complete", label: { en: "On complete" }, event: { mode: "", value: 100 } },
    { name: "change",   label: { en: "On change" },   event: { value: 0, percent: 0 } },
    { name: "pause",    label: { en: "On pause" },    event: { value: 0 } },
    { name: "resume",   label: { en: "On resume" },   event: { value: 0 } },
    { name: "reset",    label: { en: "On reset" },    event: {} },
  ],

  actions: [
    { action: "start",     label: { en: "Start" } },
    { action: "pause",     label: { en: "Pause" } },
    { action: "resume",    label: { en: "Resume" } },
    { action: "reset",     label: { en: "Reset" } },
    { action: "setValue",  label: { en: "Set value" }, args: [{ name: "value", type: "number", label: { en: "Value (0-100)" } }] },
    { action: "nextStep",  label: { en: "Next step" } },
    { action: "prevStep",  label: { en: "Previous step" } },
    { action: "goToStep",  label: { en: "Go to step" }, args: [{ name: "step", type: "number", label: { en: "Step number" } }] },
  ],
};
