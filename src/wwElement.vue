<template>
  <div class="progress-bar" :style="containerStyle">

    <!-- Header (label + value) -->
    <div v-if="showHeader.value" class="pb-header" :style="headerStyle">
      <span v-if="label.value" class="pb-label" :style="labelStyle">{{ label.value }}</span>
      <span v-if="showValue.value" class="pb-value" :style="valueStyle">{{ formattedValue }}</span>
    </div>

    <!-- Track -->
    <div class="pb-track" :style="trackStyle">
      <div
        class="pb-fill"
        :class="{
          'pb-fill--indeterminate': workingMode.value === 'indeterminate',
          'pb-fill--striped':       striped.value,
          'pb-fill--striped-anim':  striped.value && stripeAnimated.value && workingMode.value !== 'indeterminate',
        }"
        :style="fillStyle"
      ></div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";

export default {
  props: {
    content:       { type: Object, required: true },
    uid:           { type: String, required: true },
    wwEditorState: { type: Object, required: false, default: () => ({ isEditing: false }) },
  },
  emits: ["trigger-event"],
  setup(props, { emit, expose }) {

    // p()  — strings, booleans, colors  (use ?? so 0 / "" are valid)
    // pN() — numeric sizes/durations    (use || so 0 falls back)
    const p  = (key, fallback) => computed(() => props.content?.[key] ?? fallback);
    const pN = (key, fallback) => computed(() => props.content?.[key] || fallback);

    // ── Settings ──────────────────────────────────────────────────────────
    const workingMode        = p("workingMode", "percent");
    const value              = pN("value", 0);
    const duration           = pN("duration", 5000);
    const autoStart          = computed(() => props.content?.autoStart !== false);
    const loop               = computed(() => props.content?.loop === true);
    const steps              = pN("steps", 5);
    const currentStep        = pN("currentStep", 0);

    const showHeader         = computed(() => props.content?.showHeader !== false);
    const label              = p("label", "Progress");
    const showValue          = computed(() => props.content?.showValue !== false);
    const valueFormat        = p("valueFormat", "percent");
    const valueCustomText    = p("valueCustomText", "{value}%");
    const animated           = computed(() => props.content?.animated !== false);
    const transitionDuration = pN("transitionDuration", 300);

    // ── Style ─────────────────────────────────────────────────────────────
    const height          = pN("height", 8);
    const radius          = pN("radius", 999);
    const trackColor      = p("trackColor", "#EDEFF3");
    const fillColor       = p("fillColor", "#2B7FFF");
    const useGradient     = computed(() => props.content?.useGradient === true);
    const fillColorEnd    = p("fillColorEnd", "#51A2FF");
    const striped         = computed(() => props.content?.striped === true);
    const stripeAnimated  = computed(() => props.content?.stripeAnimated === true);

    const labelColor      = p("labelColor", "#90A1B9");
    const labelFontSize   = pN("labelFontSize", 14);
    const labelFontWeight = p("labelFontWeight", "400");
    const labelFontFamily = p("labelFontFamily", "");
    const valueColor      = p("valueColor", "#2B7FFF");
    const valueFontSize   = pN("valueFontSize", 14);
    const valueFontWeight = p("valueFontWeight", "600");
    const valueFontFamily = p("valueFontFamily", "");
    const headerGap       = pN("headerGap", 8);

    // ── Internal state ────────────────────────────────────────────────────
    // displayValue is what the bar visually represents (0-100).
    const displayValue = ref(0);
    // running: timer/countdown is currently animating.
    const running = ref(false);
    // Per-segment animation state. A "segment" is one continuous transition
    // from segmentFrom → segmentTo over segmentDuration ms. start() creates
    // a full-duration segment from fromValue() → toValue(). pause() ends the
    // segment; resume() creates a NEW segment from the paused value to
    // toValue() over only the remaining ms. This makes pause-resume-pause-...
    // work correctly regardless of how many cycles happened.
    const segmentFrom     = ref(0);
    const segmentTo       = ref(100);
    const segmentDuration = ref(0);
    let   segmentStart    = 0;
    let   completionTimer = null;
    // pausedAt: visual value at the moment pause() ran. null when not paused.
    const pausedAt = ref(null);
    // Tracks whether we've already emitted `complete` for the current run —
    // prevents duplicate completes when a bound value transitions through
    // 100 multiple times.
    let completeEmitted = false;

    const clamp01_100 = (n) => Math.max(0, Math.min(100, Number(n) || 0));

    // ── Derived: target value for non-timer modes ─────────────────────────
    // For percent: bound value (clamped). For stepped: step ratio. Timer
    // modes drive `displayValue` themselves, so they aren't reflected here.
    const staticTarget = computed(() => {
      if (workingMode.value === "stepped") {
        const total = Math.max(1, steps.value);
        const cur   = Math.max(0, Math.min(total, currentStep.value));
        return (cur / total) * 100;
      }
      return clamp01_100(value.value);
    });

    // ── Timer / Countdown engine ──────────────────────────────────────────
    // We animate by setting the fill width inline AND a CSS transition with
    // the matching duration — the browser handles the smoothness. On pause
    // we read elapsed time, freeze at the current value, and on resume we
    // continue with a new transition over the remaining duration.

    const isTimerMode = () =>
      workingMode.value === "timer" || workingMode.value === "countdown";

    const fromValue = () => (workingMode.value === "countdown" ? 100 : 0);
    const toValue   = () => (workingMode.value === "countdown" ? 0   : 100);

    const clearCompletionTimer = () => {
      if (completionTimer) {
        clearTimeout(completionTimer);
        completionTimer = null;
      }
    };

    const scheduleComplete = (ms) => {
      clearCompletionTimer();
      completionTimer = setTimeout(() => {
        completionTimer    = null;
        running.value      = false;
        displayValue.value = toValue();
        if (!completeEmitted) {
          completeEmitted = true;
          emit("trigger-event", {
            name:  "complete",
            event: { mode: workingMode.value, value: displayValue.value },
          });
        }
        if (loop.value) {
          // Restart after a tick so the snap-to-from commits before the
          // next transition kicks in.
          setTimeout(() => start(), 16);
        }
      }, ms);
    };

    // Begins a new animated segment from `from` → `to` over `ms`. Snaps
    // displayValue to `from` with `running=false` so fillTransition is
    // "none", then on the next two animation frames flips running=true and
    // sets displayValue=to so the new transition kicks in cleanly.
    const beginSegment = (from, to, ms) => {
      segmentFrom.value     = from;
      segmentTo.value       = to;
      segmentDuration.value = ms;
      displayValue.value    = from;
      running.value         = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          running.value      = true;
          segmentStart       = performance.now();
          displayValue.value = to;
          scheduleComplete(ms);
        });
      });
    };

    const start = () => {
      if (!isTimerMode()) return;
      clearCompletionTimer();
      pausedAt.value   = null;
      completeEmitted  = false;
      const from = fromValue();
      const to   = toValue();
      beginSegment(from, to, duration.value);
      emit("trigger-event", { name: "start", event: { mode: workingMode.value, value: from } });
    };

    const pause = () => {
      if (!running.value || !isTimerMode()) return;
      // Compute the current visual value from segment progress.
      const elapsed = performance.now() - segmentStart;
      const total   = segmentDuration.value;
      // If we're already at (or past) the segment end, treat as completion —
      // skip pause to avoid divide-by-zero math and stale UI.
      if (total <= 0 || elapsed >= total) return;
      const pct = Math.max(0, Math.min(1, elapsed / total));
      const cur = segmentFrom.value + (segmentTo.value - segmentFrom.value) * pct;

      clearCompletionTimer();
      running.value      = false;
      pausedAt.value     = cur;
      displayValue.value = cur;
      // Shrink the segment to just what's left, in case resume() runs.
      segmentDuration.value = total - elapsed;
      segmentFrom.value     = cur;

      emit("trigger-event", { name: "pause", event: { value: cur } });
    };

    const resume = () => {
      if (running.value || !isTimerMode() || pausedAt.value === null) return;
      const remaining = Math.max(0, segmentDuration.value);
      if (remaining === 0) {
        displayValue.value = segmentTo.value;
        return;
      }
      const from = pausedAt.value;
      const to   = segmentTo.value;
      pausedAt.value = null;
      // Start a fresh segment at the paused position, only the remaining ms.
      beginSegment(from, to, remaining);
      emit("trigger-event", { name: "resume", event: { value: from } });
    };

    const reset = () => {
      clearCompletionTimer();
      running.value         = false;
      pausedAt.value        = null;
      segmentDuration.value = 0;
      completeEmitted       = false;
      displayValue.value    = isTimerMode() ? fromValue() : staticTarget.value;
      segmentFrom.value     = displayValue.value;
      segmentTo.value       = displayValue.value;
      emit("trigger-event", { name: "reset", event: {} });
    };

    // ── Percent / Stepped imperative actions ──────────────────────────────
    // Helper that mirrors a 0-100 target into displayValue and emits change /
    // complete with a guard so complete fires only on the rising edge.
    const applyStaticValue = (v) => {
      const wasComplete  = displayValue.value >= 100;
      displayValue.value = v;
      emit("trigger-event", { name: "change", event: { value: v, percent: v } });
      if (v >= 100 && !wasComplete) {
        emit("trigger-event", { name: "complete", event: { mode: workingMode.value, value: v } });
      }
    };

    const setValue = (n) => applyStaticValue(clamp01_100(n));

    // Internal step counter for `stepped` mode. Avoids rounding errors that
    // would accumulate if we re-derived the step from displayValue every time
    // (the displayValue can be in flight during a CSS transition).
    const currentStepInternal = ref(0);

    const goToStep = (n) => {
      const total = Math.max(1, steps.value);
      const next  = Math.max(0, Math.min(total, Math.round(Number(n) || 0)));
      currentStepInternal.value = next;
      applyStaticValue((next / total) * 100);
    };
    const nextStep = () => goToStep(currentStepInternal.value + 1);
    const prevStep = () => goToStep(currentStepInternal.value - 1);

    // ── React to prop changes ─────────────────────────────────────────────
    // For percent / stepped, mirror the bound value into displayValue.
    // For timer/countdown, prop changes do NOT auto-restart — the workflow
    // controls the lifecycle via start()/pause()/reset().
    // `flush: 'post'` makes this watcher fire AFTER any same-tick workingMode
    // watcher, avoiding a race where both fire and emit `change` spuriously.
    watch(staticTarget, (v) => {
      if (isTimerMode() || workingMode.value === "indeterminate") return;
      // Skip if displayValue is already at the target — prevents spurious
      // `change` emits when workingMode flips into a static mode.
      if (Math.abs(displayValue.value - v) < 0.01) return;
      applyStaticValue(v);
    }, { flush: "post" });

    // Keep currentStepInternal in sync with the bound currentStep / steps
    // props for `stepped` mode. Fires immediately to seed the initial value.
    watch(
      () => [workingMode.value, currentStep.value, steps.value],
      () => {
        if (workingMode.value === "stepped") {
          const total = Math.max(1, steps.value);
          currentStepInternal.value = Math.max(0, Math.min(total, currentStep.value));
        }
      },
      { immediate: true },
    );

    // When workingMode flips at runtime, reset to a sane state.
    watch(workingMode, () => {
      clearCompletionTimer();
      running.value         = false;
      pausedAt.value        = null;
      segmentDuration.value = 0;
      completeEmitted       = false;
      displayValue.value    = isTimerMode() ? fromValue() : staticTarget.value;
      if (isTimerMode() && autoStart.value && !props.wwEditorState?.isEditing) start();
    });

    // ── Mount ─────────────────────────────────────────────────────────────
    onMounted(() => {
      displayValue.value = isTimerMode() ? fromValue() : staticTarget.value;
      if (isTimerMode() && autoStart.value && !props.wwEditorState?.isEditing) {
        start();
      }
    });

    onBeforeUnmount(() => {
      clearCompletionTimer();
    });

    // ── Formatted value display ───────────────────────────────────────────
    const formattedValue = computed(() => {
      const pct = Math.round(displayValue.value);

      if (valueFormat.value === "percent") return `${pct}%`;

      if (valueFormat.value === "step") {
        const total = Math.max(1, steps.value);
        const cur   = Math.round((displayValue.value / 100) * total);
        return `${cur} / ${total}`;
      }

      if (valueFormat.value === "time") {
        // displayValue maps onto duration: in timer it counts up, in
        // countdown it counts down (because displayValue itself drains).
        const totalMs = duration.value;
        const curMs   = (displayValue.value / 100) * totalMs;
        return `${formatTime(curMs)} / ${formatTime(totalMs)}`;
      }

      // custom: token replacement
      const total = Math.max(1, steps.value);
      const cur   = Math.round((displayValue.value / 100) * total);
      return (valueCustomText.value || "")
        .replace(/\{value\}/g,   String(pct))
        .replace(/\{percent\}/g, String(pct))
        .replace(/\{step\}/g,    String(cur))
        .replace(/\{steps\}/g,   String(total))
        .replace(/\{seconds\}/g, String(Math.round((displayValue.value / 100) * duration.value / 1000)))
        .replace(/\{ms\}/g,      String(Math.round((displayValue.value / 100) * duration.value)));
    });

    function formatTime(ms) {
      const totalSec = Math.max(0, Math.round(ms / 1000));
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }

    // ── Computed styles ───────────────────────────────────────────────────
    const containerStyle = computed(() => ({ width: "100%" }));

    const headerStyle = computed(() => ({
      display:        "flex",
      flexDirection:  "row",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            "12px",
      marginBottom:   `${headerGap.value}px`,
    }));

    const labelStyle = computed(() => ({
      color:      labelColor.value,
      fontSize:   `${labelFontSize.value}px`,
      fontWeight: labelFontWeight.value,
      fontFamily: labelFontFamily.value || undefined,
      lineHeight: 1.4,
    }));

    const valueStyle = computed(() => ({
      color:      valueColor.value,
      fontSize:   `${valueFontSize.value}px`,
      fontWeight: valueFontWeight.value,
      fontFamily: valueFontFamily.value || undefined,
      lineHeight: 1.4,
      whiteSpace: "nowrap",
    }));

    const trackStyle = computed(() => ({
      width:        "100%",
      height:       `${height.value}px`,
      background:   trackColor.value,
      borderRadius: `${radius.value}px`,
      overflow:     "hidden",
      position:     "relative",
    }));

    const fillBackground = computed(() => {
      const base = useGradient.value
        ? `linear-gradient(90deg, ${fillColor.value} 0%, ${fillColorEnd.value} 100%)`
        : fillColor.value;
      if (!striped.value) return base;
      // Layer the diagonal stripe pattern ON TOP of the base color/gradient.
      const stripes = `linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.18) 75%, transparent 75%, transparent)`;
      return `${stripes}, ${base}`;
    });

    const fillBackgroundSize = computed(() => (striped.value ? "1rem 1rem, auto" : undefined));

    const fillTransition = computed(() => {
      if (workingMode.value === "indeterminate") return "none";
      if (isTimerMode()) {
        // Timer/countdown: when running, animate over the segment duration.
        // When NOT running (snap-to-from frame, paused, or pre-start),
        // transition MUST be none so the snap doesn't itself animate over
        // the static-mode duration.
        if (!running.value) return "none";
        return `width ${segmentDuration.value || duration.value}ms linear`;
      }
      // Static modes (percent / stepped): user-configured smoothness.
      if (animated.value) return `width ${transitionDuration.value}ms ease`;
      return "none";
    });

    const fillStyle = computed(() => {
      const base = {
        height:           "100%",
        background:       fillBackground.value,
        backgroundSize:   fillBackgroundSize.value,
        borderRadius:     `${radius.value}px`,
      };
      if (workingMode.value === "indeterminate") return base;
      return {
        ...base,
        width:      `${displayValue.value}%`,
        transition: fillTransition.value,
      };
    });

    expose({
      start,
      pause,
      resume,
      reset,
      setValue,
      nextStep,
      prevStep,
      goToStep,
    });

    return {
      // template refs
      workingMode,
      label,
      showHeader,
      showValue,
      striped,
      stripeAnimated,
      formattedValue,
      // styles
      containerStyle,
      headerStyle,
      labelStyle,
      valueStyle,
      trackStyle,
      fillStyle,
    };
  },
};
</script>

<style>
.progress-bar {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.pb-header {
  width: 100%;
}

.pb-label,
.pb-value {
  user-select: none;
}

.pb-track {
  box-sizing: border-box;
}

.pb-fill {
  display: block;
  will-change: width;
}

/* ── Indeterminate: looping slide ─────────────────────────────────────── */
.pb-fill--indeterminate {
  position: absolute;
  left: 0;
  top: 0;
  width: 40% !important;
  animation: pb-indeterminate 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes pb-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}

/* ── Striped pattern (background built in JS, animation lives here) ──── */
.pb-fill--striped-anim {
  animation: pb-stripe 1s linear infinite;
}

@keyframes pb-stripe {
  0%   { background-position: 0 0,    0 0; }
  100% { background-position: 1rem 0, 0 0; }
}
</style>
