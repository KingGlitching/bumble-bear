/* Bumble's "smarter" brain: dictionary meanings, spelling any safe word, new-word lessons,
   and kid-level answers to "what is…" questions.
   Free sources: Free Dictionary API (dictionaryapi.dev, Wiktionary data, CC BY-SA)
   and Simple English Wikipedia (CC BY-SA). Everything goes through a kid-safety filter. */
window.BumbleKnow = (() => {
  'use strict';
  // Topics Bumble won't look up or say for a little kid (checked on what was asked AND on the answer).
  const BLOCK = new RegExp('\\b(' + [
    'sex\\w*', 'porn\\w*', 'nud(e|ity)', 'naked', 'boob\\w*', 'breast\\w*', 'penis', 'vagina', 'genital\\w*', 'erotic\\w*', 'condom\\w*', 'orgasm\\w*', 'prostitut\\w*', 'rape\\w*', 'molest\\w*', 'pedophil\\w*', 'incest',
    'fuck\\w*', 'shit\\w*', 'bitch\\w*', 'bastard\\w*', 'damn\\w*', 'crap\\w*', 'piss\\w*', 'ass(hole)?s?', 'dicks?', 'cocks?', 'pussy', 'cunt\\w*', 'slut\\w*', 'whore\\w*', 'hell',
    'nigg\\w*', 'fag\\w*', 'retard\\w*', 'spic', 'chink', 'kike', 'tranny',
    'kill\\w*', 'murder\\w*', 'suicide', 'die', 'dies', 'died', 'death', 'dead', 'corpse', 'blood\\w*', 'gun\\w*', 'rifle\\w*', 'pistol\\w*', 'weapon\\w*', 'bomb\\w*', 'terror\\w*', 'war', 'wars', 'nazi\\w*', 'hitler', 'genocide', 'massacre', 'shoot\\w*', 'stab\\w*', 'torture\\w*', 'abuse\\w*', 'violen\\w*',
    'drug\\w*', 'cocaine', 'heroin', 'meth\\w*', 'marijuana', 'weed', 'alcohol\\w*', 'beer', 'vodka', 'whiskey', 'drunk\\w*', 'cigarette\\w*', 'smok\\w*', 'vape\\w*',
    'devil', 'satan\\w*', 'demon\\w*', 'horror', 'zombie\\w*',
  ].join('|') + ')\\b', 'i');
  const safe = (t) => !BLOCK.test(String(t || ''));

  const clean = (s) => String(s || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  const firstSentences = (t, n) => (clean(t).match(/[^.!?]+[.!?]+/g) || [clean(t)]).slice(0, n).join(' ').trim();
  async function getJSON(url, ms = 6000) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } finally { clearTimeout(tm); }
  }

  /* ---------- dictionary ---------- */
  const cache = new Map();
  async function define(word) {
    word = String(word || '').toLowerCase().trim();
    if (!word || !safe(word) || !/^[a-z' -]{2,30}$/.test(word)) return null;
    if (cache.has(word)) return cache.get(word);
    const j = await getJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word));
    let out = null;
    if (Array.isArray(j) && j[0] && j[0].meanings) {
      // prefer a short, plain definition
      const opts = [];
      for (const m of j[0].meanings) for (const d of m.definitions || []) opts.push({ pos: m.partOfSpeech, def: clean(d.definition), ex: clean(d.example || '') });
      const good = opts.filter((o) => o.def && o.def.length < 140 && safe(o.def) && !/^\(|obsolete|archaic|slang|vulgar/i.test(o.def));
      const pick = good.sort((a, b) => a.def.length - b.def.length)[0] || null;
      if (pick) out = { word, pos: pick.pos, def: pick.def.replace(/\.$/, ''), ex: safe(pick.ex) ? pick.ex : '' };
    }
    cache.set(word, out);
    return out;
  }
  function sayDefinition(d) {
    if (!d) return null;
    const def = d.def.charAt(0).toLowerCase() + d.def.slice(1);
    if (d.pos === 'noun') return `${cap(d.word)} means ${/^(a|an|the|any|one|some)\b/.test(def) ? '' : 'a '}${def}.`;
    if (d.pos === 'verb') return `To ${d.word} means ${def.replace(/^to /, 'to ')}.`;
    return `${cap(d.word)} means ${def}.`;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- spelling ---------- */
  // Can Bumble spell this? Any real-looking word that passes the safety filter.
  function spellable(word) {
    word = String(word || '').toLowerCase().trim();
    return /^[a-z']{1,20}$/.test(word) && safe(word);
  }

  /* ---------- "what is …" answers from Simple English Wikipedia ---------- */
  async function about(topic, sentences = 2) {
    topic = String(topic || '').trim();
    if (!topic || !safe(topic) || topic.length > 60) return null;
    const title = topic.replace(/^(a|an|the)\s+/i, '');
    let j = await getJSON('https://simple.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/\s+/g, '_')) + '?redirect=true');
    if (!j || j.type !== 'standard' || !j.extract) {
      // fall back to a search for the best page
      const s = await getJSON('https://simple.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=' + encodeURIComponent(title));
      const t = s && s.query && s.query.search && s.query.search[0] && s.query.search[0].title;
      if (t && safe(t)) j = await getJSON('https://simple.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t.replace(/\s+/g, '_')) + '?redirect=true');
    }
    if (!j || j.type !== 'standard' || !j.extract) return null;
    const text = firstSentences(j.extract, sentences);
    if (!safe(text) || !safe(j.title)) return null;
    return { title: j.title, text, image: (j.thumbnail && j.thumbnail.source) || '' };
  }

  /* ---------- New Word lessons (kid-friendly meanings) ---------- */
  // [word, meaning, emoji, level]
  const NEW_WORDS = [
    ['big', 'very large, like an elephant', '🐘', 1], ['little', 'very small, like a mouse', '🐭', 1], ['hot', 'very warm, like the sun', '☀️', 1], ['cold', 'not warm, like ice', '🧊', 1],
    ['happy', 'feeling good and smiley', '😀', 1], ['sad', 'feeling like you want to cry', '😢', 1], ['soft', 'nice and squishy, like a pillow', '🧸', 1], ['loud', 'making a big noise', '📢', 1],
    ['quiet', 'making almost no noise', '🤫', 1], ['wet', 'covered in water', '💧', 1], ['fast', 'moving very quickly', '🐆', 1], ['slow', 'not fast, like a turtle', '🐢', 1],
    ['yummy', 'tasting really good', '😋', 1], ['sleepy', 'ready for a nap', '😴', 1], ['gentle', 'soft and careful, like petting a kitty', '🐱', 1], ['share', 'to let someone else have some too', '🤝', 1],
    ['gigantic', 'really, really, really big', '🦕', 2], ['tiny', 'super small, like an ant', '🐜', 2], ['delicious', 'tastes amazing', '🍓', 2], ['enormous', 'super huge, like a whale', '🐳', 2],
    ['brave', 'doing something even when you feel scared', '🦁', 2], ['curious', 'wanting to learn and find out about things', '🔍', 2], ['giggle', 'a little happy laugh', '😆', 2], ['sparkle', 'to shine with tiny flashes of light', '✨', 2],
    ['fluffy', 'soft and puffy, like a cloud', '☁️', 2], ['crunchy', 'makes a crunch sound when you bite it', '🥕', 2], ['splash', 'water jumping up when something lands in it', '💦', 2], ['wiggle', 'to move with little twisty moves', '🐛', 2],
    ['grumpy', 'feeling cranky and not happy', '😠', 2], ['excited', 'super happy about something that is coming', '🤩', 2], ['kind', 'being nice and helping others', '💛', 2], ['careful', 'being slow and watching out', '⚠️', 2],
    ['enormous', 'really, really big', '🏔️', 3], ['fragile', 'easy to break, so be gentle', '🥚', 3], ['nocturnal', 'awake at night and asleep in the day, like an owl', '🦉', 3], ['camouflage', 'colors that help an animal hide', '🦎', 3],
    ['habitat', 'the home where an animal lives', '🌳', 3], ['hibernate', 'to sleep all winter long, like a bear', '🐻', 3], ['patient', 'waiting nicely without getting upset', '⏳', 3], ['frustrated', 'upset when something is hard', '😤', 3],
    ['enormous', 'very big', '🐘', 3], ['transparent', 'clear, so you can see through it, like glass', '🪟', 3], ['predator', 'an animal that hunts other animals for food', '🦈', 3], ['astronaut', 'a person who flies into space', '🧑‍🚀', 3],
    ['vibrant', 'full of bright colors and energy', '🌈', 3], ['generous', 'happy to give and share', '🎁', 3], ['investigate', 'to look closely to find out', '🕵️', 3], ['migrate', 'when animals travel far to a new place every year', '🦢', 3],
    ['evaporate', 'when water turns into air you cannot see', '♨️', 4], ['symmetry', 'when both halves match, like a butterfly', '🦋', 4], ['magnificent', 'amazingly beautiful and grand', '👑', 4], ['persevere', 'to keep trying even when it is hard', '🧗', 4],
    ['observe', 'to watch something very carefully', '🔭', 4], ['gravity', 'the pull that makes things fall down', '🍎', 4], ['photosynthesis', 'how plants make food from sunlight', '🌱', 4], ['constellation', 'a group of stars that makes a picture', '✨', 4],
    ['extinct', 'when there are none of an animal left, like dinosaurs', '🦖', 4], ['metamorphosis', 'a big change, like a caterpillar turning into a butterfly', '🐛', 4], ['echo', 'a sound that bounces back to you', '🗣️', 4], ['empathy', 'understanding how someone else feels', '🤗', 4],
    ['hypothesis', 'a smart guess you can test', '🧪', 5], ['ecosystem', 'all the living things in a place and how they work together', '🌍', 5], ['precipitation', 'water falling from the sky, like rain or snow', '🌧️', 5], ['carnivore', 'an animal that eats meat', '🦁', 5],
    ['herbivore', 'an animal that eats only plants', '🦒', 5], ['omnivore', 'an animal that eats plants and meat, like people', '🐻', 5], ['volcano', 'a mountain that can shoot out hot melted rock', '🌋', 5], ['orbit', 'going around and around something in space', '🪐', 5],
    ['adaptation', 'a body part or habit that helps an animal live where it lives', '🐫', 5], ['dissolve', 'when something mixes into water and seems to disappear, like sugar', '🥤', 5], ['fossil', 'what is left of a plant or animal from long, long ago, in rock', '🦴', 5], ['microscope', 'a tool that makes tiny things look big', '🔬', 5],
    ['condensation', 'when water in the air turns back into drops', '💧', 6], ['vertebrate', 'an animal with a backbone', '🐟', 6], ['atmosphere', 'the air all around the Earth', '🌎', 6], ['equator', 'an imaginary line around the middle of the Earth', '🌐', 6],
    ['ambitious', 'wanting to do big things and working hard for them', '🚀', 6], ['resilient', 'able to bounce back after something hard', '🌱', 6], ['infinite', 'going on forever with no end', '♾️', 6], ['perimeter', 'the distance all the way around a shape', '⬛', 6],
  ];
  const seen = new Set();
  function newWord(level) {
    const pool = NEW_WORDS.filter((w) => w[3] <= level && w[3] >= Math.max(1, level - 1) && !seen.has(w[0]));
    const src = pool.length ? pool : NEW_WORDS.filter((w) => w[3] <= level);
    const w = src[Math.floor(Math.random() * src.length)];
    seen.add(w[0]); if (seen.size > 40) seen.clear();
    return { word: w[0], meaning: w[1], e: w[2], level: w[3] };
  }

  return { safe, define, sayDefinition, spellable, about, newWord };
})();
