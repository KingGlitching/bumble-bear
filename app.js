/* Bumble Bear — a talking bear for little ones.
   Everything runs on the phone: speech recognition + speech synthesis
   built into the browser. No accounts, no ads, no data sent anywhere
   except what the phone's own speech service does to recognise words. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const bear = $('#bear');
  const bearWrap = $('#bearWrap');
  const bubble = $('#bubble');
  const card = $('#card');
  const cardClose = $('#cardClose');
  const mic = $('#mic');
  const fx = $('#fx');

  /* ---------------- settings ---------------- */
  const DEFAULTS = { name: '', pitch: 1.3, rate: 0.9, voice: '', listen: true, natural: true, naturalVoice: 'en_US-hfc_female-medium', age: 2, readLevel: 0, mathLevel: 0 };
  let settings = { ...DEFAULTS };
  try { Object.assign(settings, JSON.parse(localStorage.getItem('bumble-settings') || '{}')); } catch (e) {}
  const saveSettings = () => { try { localStorage.setItem('bumble-settings', JSON.stringify(settings)); } catch (e) {} };
  const kid = () => (settings.name ? settings.name.trim() : 'friend');

  /* ---------------- helpers ---------------- */
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  let run = 0; // every new action bumps this so older async flows stop
  const alive = (id) => id === run;

  function pose(cls, ms) {
    bear.classList.remove(cls); void bear.getBoundingClientRect(); bear.classList.add(cls);
    if (ms) setTimeout(() => bear.classList.remove(cls), ms);
  }
  function clearPoses() {
    ['happy', 'giggle', 'dance', 'wave', 'hug', 'peek', 'sleep', 'talking', 'listening'].forEach((c) => bear.classList.remove(c));
    bearWrap.classList.remove('sleeping', 'listening');
  }
  function burst(chars, n = 12) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = Array.isArray(chars) ? rand(chars) : chars;
      s.style.left = (5 + Math.random() * 90) + '%';
      s.style.animationDelay = (Math.random() * 0.5) + 's';
      s.style.fontSize = (26 + Math.random() * 26) + 'px';
      fx.appendChild(s);
      setTimeout(() => s.remove(), 2600);
    }
  }
  const stars = () => burst(['⭐', '🌟', '✨', '🎉'], 14);
  const hearts = () => burst(['❤️', '💛', '💖', '🧡'], 14);

  /* ---------------- voice (talking) ---------------- */
  const synth = window.speechSynthesis;
  let voices = [];
  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter((v) => /^en/i.test(v.lang));
    fillVoiceSelect();
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
  function pickVoice() {
    if (!voices.length) return null;
    if (settings.voice) { const v = voices.find((x) => x.name === settings.voice); if (v) return v; }
    const prefs = [/samantha/i, /google us english/i, /karen/i, /moira/i, /tessa/i, /female/i, /zira/i, /aria/i, /jenny/i];
    for (const p of prefs) { const v = voices.find((x) => p.test(x.name)); if (v) return v; }
    return voices.find((v) => /en-US/i.test(v.lang)) || voices[0];
  }

  const soundTip = $('#soundTip');
  let tipT = null;
  const showTip = () => { soundTip.classList.remove('hidden'); clearTimeout(tipT); tipT = setTimeout(() => soundTip.classList.add('hidden'), 7000); };
  let soundWorked = false;
  let lastSoundError = '';
  const V = () => (settings.natural !== false && window.BumbleVoice && window.BumbleVoice.ready) ? window.BumbleVoice : null;
  function stopSpeech() {
    if (window.BumbleVoice) window.BumbleVoice.stop();
    if (synth && (synth.speaking || synth.pending)) synth.cancel();
    bear.classList.remove('talking');
  }
  // Natural voice when it's downloaded; otherwise the phone's own voice.
  function say(text, opts = {}) {
    const clean = text.replace(/\*/g, '');
    bubble.textContent = clean;
    const nv = V();
    if (nv) {
      if (synth && (synth.speaking || synth.pending)) synth.cancel();
      nv.setPitch(1 + (settings.pitch - 1) * 0.3);
      const rate = (opts.rate || settings.rate) / 0.9;
      return nv.speak(clean, { rate, onStart: () => { bear.classList.add('talking'); soundWorked = true; soundTip.classList.add('hidden'); } })
        .catch(() => {}).then(() => bear.classList.remove('talking'));
    }
    return sayBuiltIn(clean, opts);
  }
  // Built-in voice: speak right away (no delay) so it happens inside the tap — phones only allow sound that a tap started.
  function sayBuiltIn(clean, opts = {}) {
    return new Promise((resolve) => {
      if (!synth) { lastSoundError = 'no speech engine'; showTip(); setTimeout(resolve, Math.max(1200, clean.length * 70)); return; }
      if (synth.speaking || synth.pending) synth.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      window.__bumbleUtterance = u; // keep a reference so Chrome doesn't drop it mid-sentence
      const v = pickVoice(); if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-US';
      u.pitch = Math.min(1.4, opts.pitch || settings.pitch); // very high pitch makes built-in voices sound robotic
      u.rate = opts.rate || settings.rate;
      u.volume = 1;
      let done = false, started = false;
      const finish = () => { if (done) return; done = true; bear.classList.remove('talking'); clearTimeout(t); clearTimeout(st); resolve(); };
      u.onstart = () => { started = true; soundWorked = true; lastSoundError = ''; soundTip.classList.add('hidden'); };
      u.onend = finish;
      u.onerror = (e) => { if (e && e.error && e.error !== 'interrupted' && e.error !== 'canceled') { lastSoundError = e.error; showTip(); } finish(); };
      // Some phones never fire onend; guess a max duration.
      const t = setTimeout(finish, 2500 + clean.length * 110 / (u.rate || 1));
      const st = setTimeout(() => { if (!started && !done) { lastSoundError = lastSoundError || 'speech never started'; showTip(); } }, 3000);
      bear.classList.add('talking');
      try { synth.resume(); } catch (e) {}
      synth.speak(u);
    });
  }
  async function sayAll(lines, id) {
    for (let i = 0; i < lines.length; i++) {
      if (!alive(id)) return false;
      const nv = V(); if (nv && lines[i + 1]) nv.prefetch(lines[i + 1].replace(/\*/g, ''));
      await say(lines[i]);
    }
    return alive(id);
  }

  /* ---------------- ears (listening) ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let micDenied = false;
  let activeRec = null;
  function setListening(on) {
    mic.classList.toggle('on', on);
    bear.classList.toggle('listening', on);
    bearWrap.classList.toggle('listening', on);
    mic.querySelector('.mic-label').textContent = on ? 'Listening' : 'Talk';
  }
  let lastMicError = '';
  const isStandalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Resolves with an array of what was heard, or null. lastMicError says why when null.
  function listen(seconds = 6) {
    return new Promise((resolve) => {
      lastMicError = '';
      if (!SR) { lastMicError = 'unsupported'; resolve(null); return; }
      let rec;
      try { rec = new SR(); } catch (e) { lastMicError = 'unsupported'; resolve(null); return; }
      activeRec = rec;
      rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 4; rec.continuous = false;
      const heard = [];
      let done = false;
      const finish = () => {
        if (done) return; done = true; clearTimeout(t); setListening(false); activeRec = null;
        try { rec.abort(); } catch (e) {}
        if (!heard.length && !lastMicError) lastMicError = 'no-speech';
        resolve(heard.length ? heard : null);
      };
      rec.onresult = (e) => {
        for (const r of e.results) for (const a of r) if (a.transcript) heard.push(a.transcript.toLowerCase().trim());
        finish();
      };
      rec.onerror = (e) => {
        lastMicError = e.error || 'error';
        micDenied = (e.error === 'not-allowed' || e.error === 'service-not-allowed');
        finish();
      };
      rec.onend = finish;
      const t = setTimeout(finish, seconds * 1000);
      setListening(true);
      try { rec.start(); micDenied = false; } catch (e) { lastMicError = 'start-failed'; finish(); }
    });
  }
  // Ask the phone for microphone permission directly (shows the Allow prompt).
  async function askMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((tr) => tr.stop());
      await wait(300);
      return true;
    } catch (e) { lastMicError = e.name || 'denied'; return false; }
  }
  function micProblemLine() {
    switch (lastMicError) {
      case 'unsupported': return "Bumble can't hear in this browser. Use Chrome on Android, or Safari on iPhone.";
      case 'not-allowed': case 'NotAllowedError': case 'denied':
        return 'Bumble needs the microphone. Ask a grown-up to tap Allow.';
      case 'service-not-allowed':
        return isIOS() ? 'Ask a grown-up to turn on Siri and Dictation, so Bumble can hear.' : 'Ask a grown-up to turn on voice typing, so Bumble can hear.';
      case 'audio-capture': case 'NotFoundError': return "Bumble can't find a microphone.";
      case 'network': return 'Bumble needs the internet to hear you.';
      default: return null;
    }
  }
  function stopListening() { if (activeRec) { try { activeRec.abort(); } catch (e) {} } }

  /* ---------------- data ---------------- */
  const COLORS = [
    { n: 'red', hex: '#E8333A', like: "like Bumble's bow" },
    { n: 'blue', hex: '#2E7CF6', like: 'like the sky' },
    { n: 'yellow', hex: '#FFD23F', like: 'like the sun' },
    { n: 'green', hex: '#3DBE5A', like: 'like the grass' },
    { n: 'orange', hex: '#FF8A1F', like: 'like an orange' },
    { n: 'purple', hex: '#9B4DE0', like: 'like grapes' },
    { n: 'pink', hex: '#FF77B7', like: 'like a flower' },
    { n: 'brown', hex: '#8B5A2B', like: 'like Bumble the bear' },
    { n: 'black', hex: '#222222', like: 'like the night' },
    { n: 'white', hex: '#FFFFFF', like: 'like snow' },
  ];
  const ANIMALS = [
    { e: '🐶', n: 'dog', s: 'woof woof', w: ['woof', 'puppy', 'doggy', 'doggie'] },
    { e: '🐱', n: 'cat', s: 'meow', w: ['meow', 'kitty', 'kitten'] },
    { e: '🐮', n: 'cow', s: 'moo', w: ['moo'] },
    { e: '🦆', n: 'duck', s: 'quack quack', w: ['quack', 'ducky'] },
    { e: '🐷', n: 'pig', s: 'oink oink', w: ['oink', 'piggy'] },
    { e: '🐑', n: 'sheep', s: 'baa baa', w: ['baa', 'lamb'] },
    { e: '🐴', n: 'horse', s: 'neigh', w: ['neigh', 'pony'] },
    { e: '🦁', n: 'lion', s: 'roar', w: ['roar'] },
    { e: '🐸', n: 'frog', s: 'ribbit', w: ['ribbit', 'froggy'] },
    { e: '🦉', n: 'owl', s: 'hoo hoo', w: ['hoo'] },
    { e: '🐤', n: 'chick', s: 'peep peep', w: ['peep', 'chicken', 'bird', 'birdie', 'tweet'] },
    { e: '🐵', n: 'monkey', s: 'ooh ooh ah ah', w: [] },
    { e: '🐝', n: 'bee', s: 'buzz buzz', w: ['buzz'] },
    { e: '🐍', n: 'snake', s: 'hiss', w: ['hiss'] },
    { e: '🐭', n: 'mouse', s: 'squeak squeak', w: ['squeak'] },
    { e: '🐘', n: 'elephant', s: 'pawoo', w: [] },
    { e: '🐟', n: 'fish', s: 'blub blub', w: ['fishy'] },
  ];
  const COUNT_THINGS = [
    { e: '🍎', one: 'apple', many: 'apples' }, { e: '🍌', one: 'banana', many: 'bananas' },
    { e: '⭐', one: 'star', many: 'stars' }, { e: '🎈', one: 'balloon', many: 'balloons' },
    { e: '🐟', one: 'fish', many: 'fish' }, { e: '🍓', one: 'strawberry', many: 'strawberries' },
    { e: '🚗', one: 'car', many: 'cars' }, { e: '🌸', one: 'flower', many: 'flowers' },
    { e: '🦆', one: 'duck', many: 'ducks' }, { e: '🧸', one: 'teddy', many: 'teddies' },
  ];
  const NUMS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const ABC = [
    ['A', 'apple', '🍎'], ['B', 'ball', '⚽'], ['C', 'cat', '🐱'], ['D', 'dog', '🐶'], ['E', 'elephant', '🐘'],
    ['F', 'fish', '🐟'], ['G', 'grapes', '🍇'], ['H', 'hat', '🎩'], ['I', 'ice cream', '🍦'], ['J', 'juice', '🧃'],
    ['K', 'kite', '🪁'], ['L', 'lion', '🦁'], ['M', 'moon', '🌙'], ['N', 'nose', '👃'], ['O', 'orange', '🍊'],
    ['P', 'pig', '🐷'], ['Q', 'queen', '👸'], ['R', 'rainbow', '🌈'], ['S', 'sun', '☀️'], ['T', 'turtle', '🐢'],
    ['U', 'umbrella', '☂️'], ['V', 'van', '🚐'], ['W', 'whale', '🐳'], ['X', 'fox', '🦊'], ['Y', 'yo-yo', '🪀'], ['Z', 'zebra', '🦓'],
  ];
  const SHAPES = [
    { n: 'circle', c: '#2E7CF6', svg: '<circle cx="50" cy="50" r="42"/>', line: 'Round and round!' },
    { n: 'square', c: '#3DBE5A', svg: '<rect x="10" y="10" width="80" height="80" rx="6"/>', line: 'Four sides, all the same!' },
    { n: 'triangle', c: '#FF8A1F', svg: '<polygon points="50,8 94,90 6,90"/>', line: 'One, two, three pointy corners!' },
    { n: 'star', c: '#FFD23F', svg: '<polygon points="50,5 61,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 39,38"/>', line: 'Twinkle twinkle!' },
    { n: 'heart', c: '#FF4F7B', svg: '<path d="M50 90 C20 66 4 46 17 26 C29 10 45 14 50 30 C55 14 71 10 83 26 C96 46 80 66 50 90 Z"/>', line: 'A heart means love!' },
    { n: 'diamond', c: '#9B4DE0', svg: '<polygon points="50,5 93,50 50,95 7,50"/>', line: 'Sparkly and pointy!' },
    { n: 'oval', c: '#FF77B7', svg: '<ellipse cx="50" cy="50" rx="44" ry="30"/>', line: 'Like an egg!' },
  ];
  const BODY = [
    { e: '👃', n: 'nose', w: ['nose'] }, { e: '👀', n: 'eyes', w: ['eye', 'eyes'] }, { e: '👂', n: 'ears', w: ['ear', 'ears'] },
    { e: '👄', n: 'mouth', w: ['mouth'] }, { e: '👐', n: 'hands', w: ['hand', 'hands'] }, { e: '🦶', n: 'feet', w: ['foot', 'feet', 'toes'] },
    { e: '💪', n: 'arms', w: ['arm', 'arms'] }, { e: '😊', n: 'cheeks', w: ['cheek', 'cheeks'] }, { e: '🧠', n: 'head', w: ['head'] },
    { e: '🫃', n: 'tummy', w: ['tummy', 'belly'] },
  ];
  const THINGS = {
    ball: ['⚽', 'A ball! Bounce, bounce, bounce!'], car: ['🚗', 'A car! Vroom vroom!'], truck: ['🚚', 'A big truck! Beep beep!'],
    train: ['🚂', 'A train! Choo choo!'], bus: ['🚌', 'The bus! Beep beep!'], plane: ['✈️', 'An airplane! Zoooom in the sky!'],
    airplane: ['✈️', 'An airplane! Zoooom in the sky!'], book: ['📚', 'A book! Bumble loves stories!'], boat: ['⛵', 'A boat! Splish splash!'],
    shoes: ['👟', 'Shoes! Stomp stomp stomp!'], shoe: ['👟', 'A shoe! Stomp stomp!'], baby: ['👶', 'A baby! Shh, gentle and soft.'],
    moon: ['🌙', 'The moon! Hello moon!'], sun: ['☀️', 'The sun! Warm and bright!'], star: ['⭐', 'A star! Twinkle twinkle!'],
    rain: ['🌧️', 'Rain! Pitter patter!'], flower: ['🌸', 'A flower! Sniff sniff. Mmm!'], tree: ['🌳', 'A tree! So tall!'],
    bath: ['🛁', 'Bath time! Splash splash!'], bubbles: ['🫧', 'Bubbles! Pop pop pop!'], balloon: ['🎈', 'A balloon! Up, up, up!'],
    cake: ['🎂', 'Cake! Happy birthday!'], birthday: ['🎂', 'Happy birthday! Bumble loves birthdays!'], teddy: ['🧸', 'A teddy bear! Just like Bumble!'],
    phone: ['📱', 'Ring ring! Hello?'], hat: ['🧢', 'A hat! On your head!'], outside: ['🌳', 'Outside! Let\'s go play!'], park: ['🛝', 'The park! Wheee down the slide!'],
  };
  const FAMILY = ['mama', 'mommy', 'mom', 'mum', 'mummy', 'dada', 'daddy', 'dad', 'papa', 'grandma', 'nana', 'grandpa', 'granny', 'abuela', 'abuelo', 'brother', 'sister', 'auntie', 'uncle'];
  const FOODS = { apple: '🍎', banana: '🍌', cookie: '🍪', cookies: '🍪', milk: '🥛', juice: '🧃', pizza: '🍕', cheese: '🧀', grapes: '🍇', strawberry: '🍓', crackers: '🍘', yogurt: '🥣', cereal: '🥣', pancakes: '🥞', honey: '🍯', water: '💧', carrot: '🥕', bread: '🍞', egg: '🥚', chicken: '🍗', rice: '🍚', ice: '🍦', cake: '🎂' };

  /* ---------------- card helpers ---------------- */
  let game = null; // { name, list, i }
  function showCard(html) {
    card.innerHTML = html + '<div class="tap">👉</div>';
    card.classList.remove('quiz');
    card.classList.remove('hidden'); cardClose.classList.remove('hidden');
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    bearWrap.classList.add('small');
  }
  function hideCard() {
    card.classList.add('hidden'); card.classList.remove('quiz'); cardClose.classList.add('hidden');
    bearWrap.classList.remove('small'); quizAnswer = null;
    document.querySelectorAll('.games button').forEach((b) => b.classList.remove('active'));
    game = null;
  }
  const bigEmoji = (e, word) => `<div class="big">${e}</div><div class="word">${word}</div>`;

  /* listen for an answer and cheer */
  async function cheerAnswer(id, words) {
    if (!settings.listen || !SR || micDenied) return;
    const heard = await listen(5);
    if (!alive(id)) return;
    if (heard) {
      const t = heard.join(' | ');
      const matched = words && words.some((w) => new RegExp('\\b' + w + '\\b').test(t));
      stars(); pose('happy', 1000);
      await say(matched ? rand(['Yes! You said it! Great job!', 'Wow! Perfect!', 'Hooray! You did it!', 'Super talking!'])
                        : rand(['Good try! Yay!', 'I heard you! Great job!', 'Nice talking!', 'Yay! You are so smart!']));
    }
  }

  /* ---------------- games ---------------- */
  const GAMES = {
    colors: { list: () => shuffle(COLORS), async play(c, id) {
      showCard(`<div class="swatch" style="background:${c.hex}"></div><div class="word">${c.n}</div>`);
      if (!(await sayAll([`${cap(c.n)}! ${cap(c.n)}, ${c.like}!`, `Can you say ${c.n}?`], id))) return;
      await cheerAnswer(id, [c.n]);
    } },
    animals: { list: () => shuffle(ANIMALS), async play(a, id) {
      showCard(bigEmoji(a.e, a.n));
      if (!(await sayAll([`It's a ${a.n}!`, `The ${a.n} says ${a.s}!`, `What does the ${a.n} say?`], id))) return;
      await cheerAnswer(id, [a.n, ...a.s.split(' '), ...a.w]);
    } },
    count: { list: () => { const max = [0, 5, 10, 20, 20, 20, 20][Math.min(6, mathLevel())]; return Array.from({ length: 10 }, () => ({ n: 1 + Math.floor(Math.random() * max), t: rand(COUNT_THINGS) })); }, async play(o, id) {
      const items = Array.from({ length: o.n }, () => `<span>${o.t.e}</span>`).join('');
      showCard(`<div class="items">${items}</div><div class="num" id="num"></div>`);
      if (!(await say(`Let's count the ${o.t.many}!`)) && !alive(id)) return;
      const spans = card.querySelectorAll('.items span');
      for (let i = 1; i <= o.n; i++) {
        if (!alive(id)) return;
        spans[i - 1].classList.add('on');
        const num = card.querySelector('#num'); if (num) num.textContent = i;
        await say(cap(LN.numWord(i)) + '!');
      }
      if (!alive(id)) return;
      stars(); pose('happy', 1000);
      await say(`${cap(LN.numWord(o.n))} ${o.n === 1 ? o.t.one : o.t.many}! Yay!`);
    } },
    abc: { list: () => ABC.map((x) => x), async play(l, id) {
      showCard(`<div class="huge-letter">${l[0]}${l[0].toLowerCase()}</div><div class="big" style="font-size:min(18vw,80px)">${l[2]}</div><div class="word">${l[1]}</div>`);
      const snd = readLevel() >= 2 ? ` ${l[0]} says ${LN.SOUNDS[l[0]]}.` : '';
      const line = (l[0] === 'X' ? 'X! X is in fox!' : `${l[0]}! ${l[0]} is for ${l[1]}!`) + snd;
      if (!(await sayAll([line, `Can you say ${l[1]}?`], id))) return;
      await cheerAnswer(id, [l[1].split(' ')[0], l[0].toLowerCase()]);
    } },
    shapes: { list: () => shuffle(SHAPES), async play(s, id) {
      showCard(`<svg class="shape" viewBox="0 0 100 100" fill="${s.c}">${s.svg}</svg><div class="word">${s.n}</div>`);
      if (!(await sayAll([`A ${s.n}! ${s.line}`, `Can you say ${s.n}?`], id))) return;
      await cheerAnswer(id, [s.n]);
    } },
    body: { list: () => shuffle(BODY), async play(b, id) {
      showCard(bigEmoji(b.e, b.n));
      if (!(await say(`Where ${b.n.endsWith('s') || b.n === 'feet' ? 'are' : 'is'} your ${b.n}? Touch your ${b.n}!`))) return;
      await wait(2500);
      if (!alive(id)) return;
      stars(); pose('happy', 1000);
      await say(rand(['Yay! You found it!', 'There it is! Great job!', 'Good job! Hooray!']));
    } },
    song: { list: () => [0], async play(_, id) {
      showCard(bigEmoji('💃', 'dance!'));
      await sing(id);
    } },
    math: { list: () => [0], play: (_, id) => quizLoop('math', id) },
    words: { list: () => [0], play: (_, id) => quizLoop('words', id) },
    quiz: { list: () => [0], play: (_, id) => quizLoop('quiz', id) },
    music: { list: () => [0], async play(_, id) {
      showMusicPicker();
      await say('What song do you want? Tell Bumble, or tap a picture!');
      if (!alive(id)) return;
      if (!SR || !settings.listen) return;
      const heard = await listen(6);
      if (!alive(id) || !heard) return;
      const q = songQuery(heard[0]) || heard[0];
      await playSong(q, id);
    } },
  };

  /* ---------------- learning questions (Math / Words / Surprise) ---------------- */
  const LN = window.BumbleLearn;
  const readLevel = () => Number(settings.readLevel) || LN.levelForAge(settings.age);
  const mathLevel = () => Number(settings.mathLevel) || LN.levelForAge(settings.age);
  let stats = { math: [], words: [] };
  try { Object.assign(stats, JSON.parse(localStorage.getItem('bumble-stats') || '{}')); } catch (e) {}
  function record(kind, ok) {
    stats[kind] = (stats[kind] || []).concat(ok ? 1 : 0).slice(-20);
    try { localStorage.setItem('bumble-stats', JSON.stringify(stats)); } catch (e) {}
  }
  let quizAnswer = null; // resolver for the current question
  let streak = 0;

  function showQuiz(q) {
    const ch = q.choices.map((c, i) => {
      const cls = c.swatch ? 'sw' : c.big ? 'pic' : (String(c.label).length > 2 ? 'word' : '');
      const style = c.swatch ? ` style="background:${c.swatch}"` : '';
      return `<button type="button" class="${cls}" data-choice="${i}"${style} aria-label="${LN.esc(c.value)}">${LN.esc(c.label)}</button>`;
    }).join('');
    card.innerHTML = `<div class="q-html">${q.html}</div><div class="choices">${ch}</div>`;
    card.classList.remove('hidden'); card.classList.add('quiz'); cardClose.classList.remove('hidden');
    bearWrap.classList.add('small');
  }
  function markChoices(q, picked) {
    card.querySelectorAll('[data-choice]').forEach((b) => {
      const c = q.choices[Number(b.dataset.choice)];
      if (c.value === q.answer) b.classList.add('right');
      else if (c.value === picked) b.classList.add('wrong');
    });
  }
  // Ask one question; resolves true/false (or null if stopped)
  async function askQuestion(q, kind, id) {
    lastQ = q;
    showQuiz(q);
    let answered = new Promise((res) => { quizAnswer = res; });
    await sayAll(q.say, id);
    if (!alive(id)) return null;
    let tries = 0;
    const lvl = kind === 'math' ? mathLevel() : readLevel();
    while (alive(id)) {
      // listen while waiting for a tap (speech answers count too)
      let fromVoice = null;
      if (settings.listen && SR) {
        listen(7).then((heard) => {
          if (!heard || !alive(id) || !quizAnswer) return;
          if (LN.matches(q, heard)) quizAnswer({ value: q.answer, voice: true });
          else if (typeof q.answer === 'number') { const n = LN.parseNumber(heard[0]); if (n !== null) quizAnswer({ value: n, voice: true }); }
        });
      }
      const pick = await answered.then((v) => v);
      stopListening();
      if (!alive(id) || !pick) return null;
      quizAnswer = null;
      const ok = pick.value === q.answer;
      if (ok) {
        markChoices(q, pick.value); stars(); pose('happy', 1000); streak++;
        if (q.count) await say(`Let's count! ${Array.from({ length: q.count.n }, (_, i) => LN.numWord(i + 1)).join(', ')}!`);
        if (!alive(id)) return null;
        await say(`${rand(['Yes!', 'You got it!', 'Great job!', 'Hooray!', 'Super smart!', 'Wow!'])} ${q.explain}`);
        if (streak % 5 === 0 && alive(id)) { stars(); hearts(); pose('dance'); await say(`${numWord5(streak)} in a row! You are a superstar, ${kid()}!`); bear.classList.remove('dance'); }
        record(kind, true);
        return true;
      }
      tries++; streak = 0;
      if (lvl >= 3 && tries < 2) {
        // one more try for bigger kids
        await say(rand(['Almost! Try again!', 'Good try! Try one more time!', 'Ooh, close! Try again!']));
        if (!alive(id)) return null;
        answered = new Promise((res) => { quizAnswer = res; });
        continue;
      }
      markChoices(q, pick.value);
      await say(`Good try! ${q.explain}`);
      record(kind, false);
      return false;
    }
    return null;
  }
  let lastQ = null;
  const currentChoices = () => (lastQ ? lastQ.choices.map((c) => c.value) : []);
  const numWord5 = (n) => LN.numWord(n).replace(/^./, (c) => c.toUpperCase());

  async function quizLoop(kind, id) {
    while (alive(id)) {
      const k = kind === 'quiz' ? rand(['math', 'words']) : kind;
      const q = k === 'math' ? LN.mathQuestion(mathLevel()) : LN.readingQuestion(readLevel());
      const r = await askQuestion(q, k, id);
      if (r === null || !alive(id)) return;
      await wait(900);
    }
  }

  /* ---------------- music (Spotify) ---------------- */
  const PICKS = [
    ['🦈', 'Baby Shark', 'baby shark pinkfong'],
    ['🚌', 'Wheels on the Bus', 'wheels on the bus super simple songs'],
    ['⭐', 'Twinkle Twinkle', 'twinkle twinkle little star super simple songs'],
    ['🐮', 'Old MacDonald', 'old macdonald had a farm super simple songs'],
    ['🕷️', 'Itsy Bitsy Spider', 'itsy bitsy spider super simple songs'],
    ['🔤', 'ABC Song', 'abc song super simple songs'],
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function showMusicPicker() {
    showCard(`<div class="big" style="font-size:min(16vw,70px)">🎵</div>
      <div class="music-picks">${PICKS.map(([e, label, q]) => `<button type="button" data-q="${esc(q)}"><span>${e}</span>${esc(label)}</button>`).join('')}</div>`);
    card.querySelector('.tap')?.remove();
  }
  function showNowPlaying(track) {
    const cover = /^https:\/\/i\.scdn\.co\//.test(track.image) ? `<img class="cover" alt="" src="${esc(track.image)}">` : '<div class="big">🎶</div>';
    const id = /^[A-Za-z0-9]+$/.test(track.id) ? track.id : '';
    showCard(`${cover}<div class="now"></div><div class="artist"></div>
      <div><button type="button" class="stop-btn" data-stop="1">⏹ Stop</button>
      ${id ? `<a class="stop-btn" style="background:#1DB954;text-decoration:none;display:inline-block" href="https://open.spotify.com/track/${id}" target="_blank" rel="noopener">▶ Spotify</a>` : ''}</div>`);
    card.querySelector('.now').textContent = track.name;
    card.querySelector('.artist').textContent = track.artist;
    card.querySelector('.tap')?.remove();
  }
  // "play baby shark" -> "baby shark"
  function songQuery(text) {
    const m = /\b(?:play|put on|listen to|sing|i want)\b(?:\s+(?:me|us))?(?:\s+(?:the|a))?(?:\s+song)?\s+(.+)/.exec(text);
    if (!m) return null;
    const q = m[1].replace(/\b(please|bumble|song)\b/g, '').trim();
    if (!q || /^(a )?(game|games|with me|with you|peekaboo|peek a boo|hide|outside|ball|music)\b/.test(q)) return null;
    return q.slice(0, 80);
  }
  async function playSong(q, id) {
    const S = window.BumbleSpotify;
    if (!S || !S.connected()) {
      await say("Ask a grown-up to connect music! Here's Bumble's song instead!");
      if (alive(id)) { showCard(bigEmoji('💃', 'dance!')); await sing(id); }
      return;
    }
    bubble.textContent = '🎵 Finding your song...';
    let track;
    try { track = await S.search(q); } catch (e) { track = undefined; }
    if (!alive(id)) return;
    if (track === undefined) { await say("Uh oh! Bumble can't reach the music right now. Ask a grown-up to check Spotify."); return; }
    if (!track) { await say("Hmm, Bumble couldn't find that one. Try another song!"); return; }
    showNowPlaying(track);
    await say("Here's your song! Let's dance!");
    if (!alive(id)) return;
    const res = await S.play(track).catch(() => 'error');
    if (!alive(id)) return;
    if (res === 'playing') { stars(); pose('dance'); setTimeout(() => bear.classList.remove('dance'), 10000); bubble.textContent = '🎶 ' + track.name; return; }
    if (res === 'premium') { await say('Spotify needs Premium to play songs from Bumble.'); return; }
    await say('Open the Spotify app once, then try again. Or tap the green button!');
  }
  async function stopMusic() {
    ++run; bear.classList.remove('dance');
    const S = window.BumbleSpotify;
    if (S && S.connected()) await S.pause();
    await say('Music off!');
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  async function startGame(name) {
    const id = ++run; stopListening(); stopSpeech(); clearPoses();
    document.querySelectorAll('.games button').forEach((b) => b.classList.toggle('active', b.dataset.game === name));
    game = { name, list: GAMES[name].list(), i: 0 };
    await GAMES[name].play(game.list[0], id);
  }
  async function nextInGame() {
    if (!game) return;
    const id = ++run; stopListening(); stopSpeech(); clearPoses();
    game.i = (game.i + 1) % game.list.length;
    if (game.i === 0 && game.name !== 'abc' && game.name !== 'song') game.list = GAMES[game.name].list();
    await GAMES[game.name].play(game.list[game.i], id);
  }

  /* ---------------- actions ---------------- */
  async function sing(id) {
    pose('dance');
    const lines = [
      'Buzz buzz, here comes Bumble,',
      'rolling in a happy tumble!',
      'Clap your hands and stomp your feet,',
      `Bumble thinks you're super sweet!`,
      'Wiggle high and wiggle low,',
      'round and round and round we go!',
    ];
    for (const l of lines) { if (!alive(id)) break; await say(l, { pitch: Math.min(2, settings.pitch + 0.15), rate: settings.rate * 0.95 }); }
    bear.classList.remove('dance');
    if (alive(id)) { stars(); await say('Yay! Great dancing!'); }
  }
  async function peekaboo(id) {
    await say("Let's play peekaboo!");
    for (let k = 0; k < 2; k++) {
      if (!alive(id)) return;
      bear.classList.add('peek'); await say('Where is Bumble?'); await wait(700);
      if (!alive(id)) return;
      bear.classList.remove('peek'); pose('happy', 900); await say('Peekaboo!');
    }
    if (alive(id)) await say('Hee hee hee!');
  }
  async function sleepy(id) {
    bear.classList.add('sleep'); bearWrap.classList.add('sleeping');
    await say('Yaaawn... Night night...', { rate: settings.rate * 0.8 });
    await wait(1800);
    bear.classList.remove('sleep'); bearWrap.classList.remove('sleeping');
    if (!alive(id)) return;
    pose('happy', 900);
    await say("Surprise! Bumble is awake! Let's play!");
  }

  /* ---------------- conversation ---------------- */
  const has = (t, words) => words.some((w) => new RegExp('\\b' + w.replace(/[-]/g, '\\$&') + '\\b').test(t));
  const find = (t, words) => words.find((w) => new RegExp('\\b' + w + '\\b').test(t));

  async function respond(heardList, id) {
    const t = heardList.join(' | ');
    const name = kid();
    let w;

    const sp = window.BumbleSpotify;
    if (sp && sp.connected() && has(t, ['stop', 'stop music', 'pause', 'turn it off', 'too loud', 'quiet'])) return stopMusic();
    const sq = heardList.map(songQuery).find(Boolean);
    if (sq) return playSong(sq, id);
    if (has(t, ['sing', 'singing'])) return sing(id);
    if (has(t, ['music', 'song', 'songs'])) return startGame('music');

    // math questions: "what is 5 plus 3", "7 - 2", "3 times 4"
    for (const h of heardList) {
      const m = LN.parseMath(h);
      if (m && m.a <= 10000 && m.b <= 10000) {
        const r = LN.solve(m);
        const dots = (n) => (n >= 0 && n <= 10 ? `<div class="items">${Array.from({ length: n }, () => '<span class="on">🔵</span>').join('')}</div>` : '');
        showCard(`<div class="huge-letter" style="font-size:min(14vw,60px)">${m.a} ${m.op} ${m.b}</div>` +
          (m.op === '+' && m.a + m.b <= 10 ? dots(m.a) + '<div class="num">+</div>' + dots(m.b) : '') +
          `<div class="num">= ${r.ans === null ? '?' : Number.isInteger(r.ans) ? r.ans : r.ans.toFixed(2)}</div>`);
        stars(); pose('happy', 900);
        return say(r.said);
      }
    }
    if (has(t, ['quiz', 'ask me', 'question', 'questions', 'test me'])) return startGame('quiz');
    if (has(t, ['math', 'maths', 'adding', 'add', 'plus', 'minus', 'take away', 'times'])) return startGame('math');
    if (has(t, ['read', 'reading', 'words', 'spelling', 'rhyme', 'rhymes'])) return startGame('words');
    // "how do you spell cat"
    let sm = /\bspell\s+(?:the word\s+)?([a-z']+)/.exec(heardList[0] || '');
    if (sm && LN.SPELLABLE.has(sm[1])) {
      const w = sm[1];
      showCard(`<div class="word" style="font-size:44px;letter-spacing:8px;text-transform:none">${LN.esc(w)}</div>`);
      return say(`${w}. ${w.toUpperCase().split('').join(', ')}. ${w}!`);
    }
    // "count to 20"
    sm = /\bcount (?:to|up to|2)\s+(.+)/.exec(heardList[0] || '');
    if (sm) {
      const n = Math.min(100, Math.max(1, LN.parseNumber(sm[1]) || 10));
      showCard(`<div class="huge-letter">1 → ${n}</div>`);
      const nums = Array.from({ length: n }, (_, i) => LN.numWord(i + 1));
      for (let i = 0; i < nums.length && alive(id); i += 10) await say(nums.slice(i, i + 10).join(', ') + (i + 10 >= nums.length ? '!' : ','));
      if (alive(id)) { stars(); await say('Yay! We counted to ' + n + '!'); }
      return;
    }

    if (has(t, ['i love you', 'love you', 'love bumble', 'love'])) { hearts(); pose('hug', 900); return say(`Aww! Bumble loves you too, ${name}! Big bear hug!`); }
    if (has(t, ['sad', 'cry', 'crying', 'owie', 'ouchie', 'ouch', 'hurt', 'boo boo', 'scared'])) { pose('hug', 900); hearts(); return say("Oh, sweetie. Bumble is here. Here's a gentle bear hug. Let's go find a grown-up for a hug too!"); }
    if (has(t, ['hug', 'cuddle', 'squeeze'])) { pose('hug', 900); hearts(); return say('Squeeeeeze! Big bear hug!'); }
    if (has(t, ['peekaboo', 'peek a boo', 'peek'])) return peekaboo(id);
    if (has(t, ['bye', 'bye bye', 'goodbye', 'see you', 'night night', 'goodnight'])) { pose('wave', 1800); return say(`Bye bye, ${name}! Come play with Bumble again soon!`); }
    if (has(t, ['sleep', 'sleepy', 'tired', 'nap', 'bed', 'night'])) return sleepy(id);
    if (has(t, ['hi', 'hello', 'hey', 'hiya', 'good morning', 'morning'])) { pose('wave', 1800); return say(rand([`Hi hi, ${name}! Bumble is so happy to see you!`, `Hello, ${name}! You make Bumble smile!`])); }
    if (has(t, ['thank you', 'thanks', 'thank'])) { pose('happy', 900); return say("You're welcome! You have such good manners!"); }
    if (has(t, ['your name', 'who are you', 'bumble', 'bear', 'teddy bear'])) { pose('happy', 900); return say("That's me! I'm Bumble the bear! Buzz buzz!"); }
    if (has(t, ['sing', 'singing'])) return sing(id);
    if (has(t, ['dance', 'dancing', 'wiggle', 'jump', 'shake'])) { pose('dance'); await say('Wiggle wiggle wiggle! Dance with Bumble!'); await wait(1500); bear.classList.remove('dance'); return; }
    if (has(t, ['tickle', 'silly', 'funny', 'laugh'])) { pose('giggle', 1000); return say('Hee hee hee! That tickles!'); }
    if (has(t, ['abc', 'abcs', 'letters', 'alphabet'])) return startGame('abc');
    if (has(t, ['count', 'counting', 'numbers'])) return startGame('count');
    if (has(t, ['shape', 'shapes'])) return startGame('shapes');
    if (has(t, ['colors', 'colours', 'color', 'colour'])) return startGame('colors');
    if (has(t, ['animal', 'animals', 'farm', 'zoo'])) return startGame('animals');
    if (has(t, ['play', 'game', 'games'])) return startGame(rand(['colors', 'animals', 'count', 'shapes']));

    if ((w = find(t, COLORS.map((c) => c.n)))) {
      const c = COLORS.find((x) => x.n === w);
      showCard(`<div class="swatch" style="background:${c.hex}"></div><div class="word">${c.n}</div>`); stars();
      return say(`${cap(c.n)}! ${cap(c.n)}, ${c.like}! What a great color!`);
    }
    for (const a of ANIMALS) {
      if (has(t, [a.n, a.n + 's', ...a.w, ...a.s.split(' ')])) {
        showCard(bigEmoji(a.e, a.n)); pose('happy', 900);
        return say(`A ${a.n}! The ${a.n} says ${a.s}!`);
      }
    }
    const numIdx = NUMS.findIndex((n, i) => i > 0 && (has(t, [n]) || new RegExp('\\b' + i + '\\b').test(t)));
    if (numIdx > 0) {
      const th = rand(COUNT_THINGS);
      showCard(`<div class="items">${Array.from({ length: numIdx }, () => `<span class="on">${th.e}</span>`).join('')}</div><div class="num">${numIdx}</div>`);
      stars();
      return say(`${cap(NUMS[numIdx])}! ${cap(NUMS[numIdx])} ${numIdx === 1 ? th.one : th.many}!`);
    }
    if ((w = find(t, FAMILY))) { hearts(); return say(`${cap(w)}! Your ${w} loves you so, so much!`); }
    if ((w = find(t, Object.keys(FOODS))) || has(t, ['hungry', 'eat', 'food', 'snack', 'yummy', 'yum'])) {
      if (w) { showCard(bigEmoji(FOODS[w], w)); return say(`Yum yum! ${cap(w)}! Bumble loves honey. Mmm!`); }
      return say("Yum yum! Bumble loves honey! What's your favorite snack?");
    }
    if ((w = find(t, Object.keys(THINGS)))) { showCard(bigEmoji(THINGS[w][0], w)); pose('happy', 900); return say(THINGS[w][1]); }
    if (has(t, ['yes', 'yeah', 'yay', 'yep', 'okay', 'ok'])) { stars(); pose('happy', 900); return say('Yay! Hooray!'); }
    if (has(t, ['no', 'nope', 'no no'])) { pose('giggle', 900); return say('No? Okay! Silly bear!'); }

    if (has(t, ['what', 'why', 'how', 'where', 'who'])) {
      pose('happy', 900);
      await say(rand(["Ooh, good question! Bumble isn't sure. Let's ask a grown-up!", "Hmm! That's a big question. Want to do a quiz instead?"]));
      return;
    }
    pose('happy', 900);
    return say(rand([
      `Wow! You are such a good talker, ${name}!`,
      'Ooh! Tell Bumble more!',
      'Hee hee! I love talking with you!',
      'Really? Wow!',
      'You are so smart! Want to play a game? Tap a picture!',
      "That's so cool! Can you say bear?",
    ]));
  }

  async function talk() {
    if (mic.classList.contains('on')) { stopListening(); return; }
    const id = ++run; stopSpeech(); clearPoses();
    if (!SR) { lastMicError = 'unsupported'; await say(micProblemLine()); return; }
    bubble.textContent = '👂 Bumble is listening...';
    let heard = await listen(7);
    if (!alive(id)) return;
    if (!heard && (lastMicError === 'not-allowed' || lastMicError === 'service-not-allowed')) {
      // Permission prompt may have been missed — ask for it directly, then try once more.
      bubble.textContent = '🎤 Tap Allow so Bumble can hear you!';
      if (await askMicPermission() && alive(id)) {
        bubble.textContent = '👂 Bumble is listening...';
        heard = await listen(7);
        if (!alive(id)) return;
      }
    }
    if (!heard) {
      const problem = micProblemLine();
      await say(problem || rand(["Hmm? Bumble didn't hear you. Tap and talk again!", 'Say that again? Tap the button and talk!']));
      return;
    }
    await respond(heard, id);
  }

  /* ---------------- bear taps ---------------- */
  const TAPS = [
    ['giggle', 'Hee hee! That tickles!'], ['happy', 'Boing boing!'], ['giggle', 'Ha ha! Silly!'],
    ['wave', 'Hi there!'], ['hug', 'Bear hug!'], ['happy', 'Buzz buzz! Bumble loves you!'],
  ];
  async function tapBear() {
    const id = ++run; stopListening(); clearPoses();
    const [p, line] = rand(TAPS);
    pose(p, 1000); if (p === 'hug') hearts();
    if (alive(id)) await say(line);
  }

  /* ---------------- wiring ---------------- */
  mic.addEventListener('click', talk);
  bear.addEventListener('click', tapBear);
  card.addEventListener('click', (e) => {
    const ch = e.target.closest('[data-choice]');
    if (ch) { if (quizAnswer && !ch.classList.contains('wrong')) { const qa = quizAnswer; quizAnswer = null; qa({ value: currentChoices()[Number(ch.dataset.choice)] }); } return; }
    if (card.classList.contains('quiz')) return;
    const pick = e.target.closest('[data-q]');
    if (pick) { const id = ++run; stopListening(); playSong(pick.dataset.q, id); return; }
    if (e.target.closest('[data-stop]')) { stopMusic(); return; }
    if (e.target.closest('a')) return;
    if (game && game.name === 'music') return;
    if (game) nextInGame(); else { hideCard(); }
  });
  cardClose.addEventListener('click', (e) => { e.stopPropagation(); ++run; stopListening(); stopSpeech(); clearPoses(); hideCard(); bubble.textContent = 'Tap the microphone and talk to Bumble!'; });
  document.querySelectorAll('.games button').forEach((b) => b.addEventListener('click', () => startGame(b.dataset.game)));

  $('#start').addEventListener('click', () => {
    $('#splash').classList.add('gone');
    loadVoices();
    if (window.BumbleVoice) window.BumbleVoice.unlock();
    prepareNaturalVoice();
    const id = ++run;
    pose('wave', 1800);
    // first words are spoken immediately inside the tap — this is what unlocks sound on phones
    sayAll([`Hi${settings.name ? ', ' + kid() : ''}! I'm Bumble the bear!`, 'Tap the big red button and talk to me!'], id);
  });

  /* grown-up settings: press and hold the gear */
  const gear = $('#gear'); let holdT = null;
  const startHold = (e) => { e.preventDefault(); gear.classList.add('holding'); holdT = setTimeout(openSettings, 1500); };
  const endHold = () => { gear.classList.remove('holding'); clearTimeout(holdT); };
  gear.addEventListener('pointerdown', startHold);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => gear.addEventListener(ev, endHold));
  gear.addEventListener('contextmenu', (e) => e.preventDefault());
  gear.addEventListener('click', () => { if (!$('#settings').open) { bubble.textContent = 'Grown-ups: press and hold ⚙️'; } });

  function fillVoiceSelect() {
    const sel = $('#setVoice'); if (!sel) return;
    sel.innerHTML = '<option value="">Automatic</option>' + voices.map((v) => `<option>${v.name.replace(/</g, '')}</option>`).join('');
    sel.value = settings.voice || '';
  }
  function openSettings() {
    endHold();
    const d = $('#settings');
    $('#setName').value = settings.name; $('#setPitch').value = settings.pitch; $('#setRate').value = settings.rate;
    $('#setListen').checked = settings.listen; fillVoiceSelect();
    $('#pitchOut').textContent = settings.pitch; $('#rateOut').textContent = settings.rate;
    $('#micNote').textContent = diagnostics();
    $('#setAge').value = settings.age;
    const lvlOpts = (sel) => '<option value="0">Match age (auto)</option>' + LN.LEVELS.map((l, i) => (l ? `<option value="${i}">${l.name}</option>` : '')).join('');
    $('#setReadLevel').innerHTML = lvlOpts(); $('#setReadLevel').value = String(settings.readLevel || 0);
    $('#setMathLevel').innerHTML = lvlOpts(); $('#setMathLevel').value = String(settings.mathLevel || 0);
    const pct = (a) => (a && a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) + '% right (last ' + a.length + ')' : 'no answers yet');
    $('#setMathLevel').closest('label').nextElementSibling.textContent =
      `Now: reading = ${LN.LEVELS[readLevel()].name}, math = ${LN.LEVELS[mathLevel()].name}. Recent: math ${pct(stats.math)}, words ${pct(stats.words)}. If she's getting almost everything right, try the next level up. "Match age" follows free school standards (Common Core math, Dolch sight words). Every question is made up fresh.`;
    $('#setNatural').checked = settings.natural !== false;
    const nvs = (window.BumbleVoice && window.BumbleVoice.VOICES) || { 'en_US-hfc_female-medium': 'Warm (recommended)' };
    $('#setNaturalVoice').innerHTML = Object.entries(nvs).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    $('#setNaturalVoice').value = settings.naturalVoice;
    showVoiceStatus(window.BumbleVoice ? window.BumbleVoice.status : 'off', window.BumbleVoice ? window.BumbleVoice.progress : 0);
    $('#setSpotifyId').value = window.BumbleSpotify ? window.BumbleSpotify.clientId() : '';
    $('#redirectUri').textContent = window.BumbleSpotify ? window.BumbleSpotify.redirectUri() : '';
    updateSpotifyStatus();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function diagnostics() {
    const parts = [];
    parts.push(SR ? 'Speech recognition: available.' : "Speech recognition: NOT available in this browser — use Chrome on Android or Safari on iPhone.");
    if (!synth) parts.push('Voice: NOT available in this browser.');
    else parts.push('Voice: ' + (voices.length ? voices.length + ' English voices found.' : 'no voices loaded yet.') + (lastSoundError ? ' Last problem: ' + lastSoundError + '.' : ''));
    if (lastMicError && lastMicError !== 'no-speech') parts.push('Last mic problem: ' + lastMicError + '.');
    if (lastMicError === 'not-allowed' || lastMicError === 'NotAllowedError') parts.push(isIOS() ? 'Fix: iPhone Settings → Safari → Microphone → Allow (or tap aA in the address bar → Website Settings).' : 'Fix: tap the lock/tune icon by the web address → Permissions → Microphone → Allow. Or Android Settings → Apps → Chrome → Permissions → Microphone.');
    if (lastMicError === 'service-not-allowed') parts.push(isIOS() ? 'Fix: iPhone Settings → Siri → turn on Siri, and Settings → General → Keyboard → Enable Dictation.' + (isStandalone() ? ' If it still fails, open Bumble in Safari instead of the home screen icon.' : '') : 'Fix: make sure the Google app is installed and up to date.');
    if (lastMicError === 'network') parts.push('Fix: check Wi-Fi or data — the phone sends speech to its own speech service to understand words.');
    return parts.join(' ');
  }
  function updateSpotifyStatus() {
    const S = window.BumbleSpotify; const el = $('#spStatus');
    if (!S) { el.textContent = ''; return; }
    el.textContent = S.connected() ? '✅ Spotify connected. Open the Spotify app once on this phone so Bumble can find it.' : (S.clientId() ? 'Not connected yet — tap Connect Spotify.' : 'Paste your Client ID, then tap Connect Spotify.');
  }
  $('#testMic').addEventListener('click', async () => {
    $('#micNote').textContent = '🎤 Say something now...';
    let heard = await listen(5);
    if (!heard && (lastMicError === 'not-allowed' || lastMicError === 'service-not-allowed')) {
      if (await askMicPermission()) { $('#micNote').textContent = '🎤 Say something now...'; heard = await listen(5); }
    }
    $('#micNote').textContent = heard ? '✅ Mic works! Heard: "' + heard[0] + '". ' : '❌ Heard nothing. ' + diagnostics();
  });
  $('#spConnect').addEventListener('click', async () => {
    const S = window.BumbleSpotify; if (!S) return;
    const idv = $('#setSpotifyId').value.trim();
    if (!/^[0-9a-f]{32}$/i.test(idv)) { $('#spStatus').textContent = 'That Client ID looks wrong — it should be 32 letters and numbers.'; return; }
    S.setClientId(idv); readForm(); saveSettings();
    $('#spStatus').textContent = 'Opening Spotify...';
    try { await S.login(); } catch (e) { $('#spStatus').textContent = 'Could not start Spotify login.'; }
  });
  $('#spDisconnect').addEventListener('click', () => { if (window.BumbleSpotify) { window.BumbleSpotify.disconnect(); updateSpotifyStatus(); } });
  $('#setPitch').addEventListener('input', (e) => { $('#pitchOut').textContent = e.target.value; });
  $('#setRate').addEventListener('input', (e) => { $('#rateOut').textContent = e.target.value; });
  function readForm() {
    settings.name = $('#setName').value.trim().slice(0, 20);
    settings.pitch = parseFloat($('#setPitch').value); settings.rate = parseFloat($('#setRate').value);
    settings.voice = $('#setVoice').value; settings.listen = $('#setListen').checked;
    settings.age = Math.min(12, Math.max(1, parseInt($('#setAge').value, 10) || settings.age || 2));
    settings.readLevel = parseInt($('#setReadLevel').value, 10) || 0;
    settings.mathLevel = parseInt($('#setMathLevel').value, 10) || 0;
    const wasNatural = settings.natural !== false, oldVoice = settings.naturalVoice;
    settings.natural = $('#setNatural').checked;
    settings.naturalVoice = $('#setNaturalVoice').value || settings.naturalVoice;
    if (settings.natural && (!wasNatural || oldVoice !== settings.naturalVoice)) prepareNaturalVoice();
  }
  $('#testVoice').addEventListener('click', () => { readForm(); if (window.BumbleVoice) window.BumbleVoice.unlock(); say(`Hi${settings.name ? ' ' + kid() : ''}! I'm Bumble!`); });
  $('#settings').addEventListener('close', () => { if ($('#settings').returnValue === 'save') { readForm(); saveSettings(); bubble.textContent = 'Saved!'; } });

  // stop talking when the app goes to the background
  document.addEventListener('visibilitychange', () => { if (document.hidden) { ++run; stopListening(); stopSpeech(); clearPoses(); } });

  /* ---------------- natural voice download ---------------- */
  const voiceStatus = $('#voiceStatus');
  function showVoiceStatus(s, pct) {
    const txt = { loading: '🗣️ Getting voice ready…', downloading: `🗣️ Downloading voice ${pct || 0}%`, ready: '', failed: '', off: '' }[s] || '';
    voiceStatus.textContent = txt;
    const n = $('#naturalNote');
    if (n) n.textContent = s === 'ready' ? '✅ Natural voice ready (saved on this phone, works offline).'
      : s === 'failed' ? '⚠️ Natural voice could not load on this phone — using the built-in voice. Check internet and try again.'
      : s === 'downloading' ? `Downloading… ${pct}% (about 60 MB, one time only — Wi-Fi recommended)`
      : s === 'loading' ? 'Getting the voice ready…' : 'Natural voice downloads once (about 60 MB).';
  }
  function prepareNaturalVoice() {
    const go = () => {
      if (settings.natural === false || !window.BumbleVoice) return;
      window.BumbleVoice.onStatus(showVoiceStatus);
      window.BumbleVoice.prepare(settings.naturalVoice);
    };
    if (window.BumbleVoice) go(); else window.addEventListener('bumble-voice', go, { once: true });
  }

  // finish Spotify login if we just came back from Spotify
  if (window.BumbleSpotify) {
    window.BumbleSpotify.handleRedirect().then((r) => {
      const tip = document.querySelector('.splash .tip');
      if (!r || !tip) return;
      tip.textContent = r === 'connected' ? '🎵 Spotify connected! Tap Music and pick a song.' : '⚠️ Spotify did not connect. Hold ⚙️ to try again.';
    });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
