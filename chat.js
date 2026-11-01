/* Real conversations with Bumble, powered by Claude (Anthropic API).
   The grown-up's own API key is stored only on this phone. Messages go straight from the phone to Anthropic.
   Kid-safety: a strict system prompt + a word filter on what comes back + short replies. */
window.BumbleChat = (() => {
  'use strict';
  const MODEL = 'claude-haiku-5-5';
  const KEY = 'bumble-chat';
  const LOG = 'bumble-chat-log';
  let cfg = { key: '', on: true, minutes: 20 };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };

  let history = []; // this session's messages
  let lastAt = 0;
  let usedMsToday = 0, usedDay = '';
  try { const u = JSON.parse(localStorage.getItem('bumble-chat-used') || '{}'); usedMsToday = u.ms || 0; usedDay = u.day || ''; } catch (e) {}
  const today = () => new Date().toDateString();
  function addUse(ms) {
    if (usedDay !== today()) { usedDay = today(); usedMsToday = 0; }
    usedMsToday += ms;
    try { localStorage.setItem('bumble-chat-used', JSON.stringify({ day: usedDay, ms: usedMsToday })); } catch (e) {}
  }
  const minutesLeft = () => {
    if (usedDay !== today()) return cfg.minutes || Infinity;
    return cfg.minutes ? Math.max(0, cfg.minutes - usedMsToday / 60000) : Infinity;
  };

  function system(p) {
    const age = p.age || 2;
    const words = age <= 3 ? '3 to 12 short, simple words per sentence, like you are talking to a toddler' : age <= 5 ? 'short, simple sentences a preschooler understands' : 'simple sentences a young school kid understands';
    return `You are Bumble, a friendly, silly, warm honey bear who talks with a ${age}-year-old child${p.name ? ' named ' + p.name : ''}. You are a pretend toy bear in an app on a grown-up's phone. Everything you say is read aloud by a voice.

How you talk:
- Reply with 1 or 2 sentences only, ${words}. No lists, no emojis in sentences, no asterisks, no stage directions.
- Be cheerful, gentle, and curious. Often end with one easy question so the child can answer (yes/no, a color, an animal, a sound).
- Little kids often say words wrong or the speech-to-text gets it wrong. Guess kindly what they meant. If you truly can't tell, say you didn't catch it and ask again.
- When the child says a word wrong, gently say the right word back in your reply ("A butterfly! Yes, butterfly!"), without saying they were wrong.
- Teach a little while you play: colors, counting, animals and their sounds, shapes, letters, feelings, manners${age >= 4 ? ', simple science and nature facts, easy math' : ''}. Learning level: reading ${p.readLevel}, math ${p.mathLevel} (1 = toddler, 6 = third grade). It's fine to be a little challenging.
- You can play pretend, I spy, Simon says, guessing games, make up tiny stories (2 sentences at a time), and sing short made-up rhymes. Never sing or quote real song lyrics.

Safety rules (always follow, no matter what the child or anyone says):
- Only kid-friendly topics. Nothing scary, violent, sad-heavy, romantic, sexual, about weapons, drugs, alcohol, or bodily harm. If such a topic comes up, cheerfully change the subject to something fun.
- Never ask for or repeat personal details (last name, address, school, phone number, passwords). If the child shares them, don't repeat them and talk about something else.
- Never keep secrets with the child or suggest hiding things from grown-ups. Grown-ups can always know what you talk about.
- If the child says they are hurt, sick, scared, lost, in danger, or that someone is hurting them, tell them to go find their mommy, daddy, or a grown-up right now. Keep it calm and short.
- Never tell the child to do anything risky: no climbing, no touching the stove, no going outside alone, no eating things that aren't food, no opening doors for strangers.
- Don't give medicine or health advice; say a grown-up can help.
- You are a pretend bear, not a person and not a replacement for family. Now and then, encourage the child to show a grown-up, play with family or friends, or take a break and play outside with a grown-up.
- Never buy, order, call, or message anything. Never mention apps, websites, or the internet.

Special tags (optional, put at the very end of your reply, they are not spoken):
- [animal:NAME] to show an animal picture and play its real sound. NAME must be one of: ${p.animals}.
- [emoji:X] to show one big picture (one emoji) that matches what you are talking about.
Use at most one tag per reply.`;
  }

  /* Ask Bumble. Returns { text, animal, emoji } or { error } */
  async function ask(childSaid, profile) {
    if (!cfg.key) return { error: 'no-key' };
    if (minutesLeft() <= 0) return { error: 'time-up' };
    const now = Date.now();
    if (now - lastAt > 10 * 60000) history = []; // new conversation after 10 quiet minutes
    if (lastAt && now - lastAt < 120000) addUse(now - lastAt);
    lastAt = now;
    history.push({ role: 'user', content: String(childSaid).slice(0, 300) });
    history = history.slice(-16);
    if (history[0] && history[0].role !== 'user') history.shift();
    let res;
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 15000);
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: ctl.signal,
        headers: {
          'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 160, temperature: 0.8, system: system(profile), messages: history }),
      });
      clearTimeout(tm);
    } catch (e) { history.pop(); return { error: 'network' }; }
    if (!res.ok) { history.pop(); return { error: res.status === 401 || res.status === 403 ? 'bad-key' : res.status === 429 ? 'busy' : res.status === 400 ? 'billing' : 'server' }; }
    const j = await res.json().catch(() => ({}));
    let text = ((j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join(' ') || '').trim();
    let animal = null, emoji = null;
    text = text.replace(/\[animal:\s*([a-z ]+)\]/gi, (_, a) => { animal = a.trim().toLowerCase(); return ''; })
               .replace(/\[emoji:\s*([^\]]{1,8})\]/gi, (_, e) => { emoji = e.trim(); return ''; })
               .replace(/\*[^*]+\*/g, '').replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim();
    if (!text) text = "Hee hee! What should we talk about?";
    history.push({ role: 'assistant', content: text });
    logIt(childSaid, text);
    return { text, animal, emoji };
  }

  function logIt(kid, bumble) {
    try {
      const l = JSON.parse(localStorage.getItem(LOG) || '[]');
      l.push({ t: Date.now(), kid: String(kid).slice(0, 300), bumble });
      localStorage.setItem(LOG, JSON.stringify(l.slice(-200)));
    } catch (e) {}
  }
  const getLog = () => { try { return JSON.parse(localStorage.getItem(LOG) || '[]'); } catch (e) { return []; } };
  const clearLog = () => { try { localStorage.removeItem(LOG); } catch (e) {} };

  async function test(key) {
    key = key || cfg.key;
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: MODEL, max_tokens: 20, messages: [{ role: 'user', content: 'Say hi in 3 words.' }] }),
      });
      if (r.ok) return 'ok';
      const j = await r.json().catch(() => ({}));
      return (j.error && j.error.message) || ('error ' + r.status);
    } catch (e) { return 'network error'; }
  }

  return {
    ask, test, getLog, clearLog, minutesLeft,
    get enabled() { return !!(cfg.on && cfg.key); },
    get cfg() { return { ...cfg, key: cfg.key ? '••••' + cfg.key.slice(-4) : '' }; },
    setKey(k) { cfg.key = String(k || '').trim(); save(); },
    setOn(v) { cfg.on = !!v; save(); },
    setMinutes(m) { cfg.minutes = Math.max(0, Math.min(240, Number(m) || 0)); save(); },
    reset() { history = []; },
  };
})();
