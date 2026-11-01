/* Natural voice for Bumble — Piper neural voices (open source, MIT) running right on the phone
   through vits-web (ONNX Runtime). The voice downloads once (~60 MB), is saved on the phone,
   then works offline. If anything fails, Bumble falls back to the phone's built-in voice. */
const LIB = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm';
export const VOICES = {
  'en_US-hfc_female-medium': 'Warm (recommended)',
  'en_US-amy-medium': 'Bright',
  'en_US-kristin-medium': 'Soft',
  'en_US-lessac-medium': 'Clear',
};

let tts = null;
let voiceId = 'en_US-hfc_female-medium';
let ready = false;
let loading = null;
let status = 'off';
let progress = 0;
const cache = new Map(); // text -> Promise<Blob>
const audio = new Audio();
audio.preload = 'auto';
let pitch = 1.1;
let onStatus = () => {};

function setStatus(s) { status = s; try { onStatus(s, progress); } catch (e) {} }

async function lib() {
  if (!tts) tts = await import(LIB);
  return tts;
}

/* Start (or continue) downloading the voice. Safe to call many times. */
function prepare(id) {
  if (id && id !== voiceId) { voiceId = id; ready = false; loading = null; cache.clear(); }
  if (ready) return Promise.resolve(true);
  if (loading) return loading;
  loading = (async () => {
    try {
      setStatus('loading');
      const t = await lib();
      const stored = await t.stored().catch(() => []);
      if (!stored.includes(voiceId)) {
        await t.download(voiceId, (p) => {
          if (p && p.total) { progress = Math.round((p.loaded / p.total) * 100); setStatus('downloading'); }
        });
      }
      // warm up so the first real sentence is quick
      await t.predict({ text: 'Hi!', voiceId });
      ready = true; progress = 100; setStatus('ready');
      return true;
    } catch (e) {
      console.warn('Natural voice unavailable:', e);
      loading = null; setStatus('failed');
      return false;
    }
  })();
  return loading;
}

function synth(text) {
  const key = voiceId + '|' + text;
  if (!cache.has(key)) {
    const p = tts.predict({ text, voiceId });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    if (cache.size > 120) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}

/* Make the next line ahead of time so there is no pause between sentences. */
function prefetch(text) { if (ready && text) synth(text).catch(() => {}); }

let current = null;
/* Speak text. Resolves when finished (or stopped). onStart fires when sound begins. */
async function speak(text, { rate = 1, onStart } = {}) {
  if (!ready) throw new Error('not-ready');
  stop();
  const token = {}; current = token;
  const blob = await synth(text);
  if (current !== token) return;
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    const done = () => { audio.onended = audio.onerror = audio.onpause = null; URL.revokeObjectURL(url); resolve(); };
    audio.onended = done; audio.onerror = done; audio.onpause = () => { if (current !== token) done(); };
    audio.src = url;
    audio.preservesPitch = false; audio.mozPreservesPitch = false; audio.webkitPreservesPitch = false;
    audio.playbackRate = Math.max(0.6, Math.min(1.6, pitch * rate));
    audio.play().then(() => { if (onStart) onStart(); }).catch(() => done());
  });
}

function stop() { current = null; try { audio.pause(); } catch (e) {} }

/* Call inside a tap: lets the phone play sound later (needed on iPhone). */
function unlock() {
  try {
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    const p = audio.play(); if (p) p.catch(() => {});
  } catch (e) {}
}

window.BumbleVoice = {
  VOICES, prepare, speak, stop, prefetch, unlock,
  get ready() { return ready; }, get status() { return status; }, get progress() { return progress; },
  get voiceId() { return voiceId; },
  setPitch(p) { pitch = p; },
  onStatus(fn) { onStatus = fn; },
};
window.dispatchEvent(new Event('bumble-voice'));
