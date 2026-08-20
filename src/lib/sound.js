// ── Sound & haptic feedback ──────────────────────────────────────────────
// Short tones synthesized with the Web Audio API (no audio asset files
// needed) plus navigator.vibrate. Purely client-side — the on/off
// preference lives in localStorage, not the profile: it's a device
// setting, not something that needs to sync across devices.

const STORAGE_KEY = "infera_sound_enabled";

export function isSoundEnabled() {
  if (typeof localStorage === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

let audioCtx = null;
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function tone(ctx, freq, startTime, duration, gainPeak) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Short ascending two-note chime for a correct answer, a low single buzz
 * for incorrect — plus a matching vibration pattern on devices that support
 * it. Silently no-ops on autoplay-blocked/unsupported browsers or when the
 * user has muted it; never worth surfacing a failure here.
 */
export function playFeedback(correct) {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      if (correct) {
        tone(ctx, 660, now, 0.12, 0.15);
        tone(ctx, 880, now + 0.1, 0.16, 0.15);
      } else {
        tone(ctx, 180, now, 0.22, 0.12);
      }
    }
  } catch {
    // Autoplay policy / unsupported browser — never worth surfacing.
  }

  try {
    if (navigator.vibrate) navigator.vibrate(correct ? 30 : [40, 40, 40]);
  } catch {
    // Vibration API can throw or be unsupported — silently ignore.
  }
}
