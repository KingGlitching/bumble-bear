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
  const DEFAULTS = { name: '', pitch: 1.6, rate: 0.9, voice: '', listen: true };
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

  function say(text, opts = {}) {
    bubble.textContent = text.replace(/\*/g, '');
    return new Promise((resolve) => {
      if (!synth) { setTimeout(resolve, Math.max(1200, text.length * 70)); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/\*/g, ''));
      const v = pickVoice(); if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-US';
      u.pitch = opts.pitch || settings.pitch;
      u.rate = opts.rate || settings.rate;
      let done = false;
      const finish = () => { if (done) return; done = true; bear.classList.remove('talking'); clearTimeout(t); resolve(); };
      u.onend = finish; u.onerror = finish;
      // Some phones never fire onend; guess a max duration.
      const t = setTimeout(finish, 2500 + text.length * 110 / (u.rate || 1));
      bear.classList.add('talking');
      setTimeout(() => synth.speak(u), 40);
    });
  }
  async function sayAll(lines, id) {
    for (const l of lines) { if (!alive(id)) return false; await say(l); }
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
  function listen(seconds = 6) {
    return new Promise((resolve) => {
      if (!SR || micDenied) { resolve(null); return; }
      let rec;
      try { rec = new SR(); } catch (e) { resolve(null); return; }
      activeRec = rec;
      rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 4; rec.continuous = false;
      const heard = [];
      let done = false;
      const finish = () => {
        if (done) return; done = true; clearTimeout(t); setListening(false); activeRec = null;
        try { rec.abort(); } catch (e) {}
        resolve(heard.length ? heard : null);
      };
      rec.onresult = (e) => {
        for (const r of e.results) for (const a of r) if (a.transcript) heard.push(a.transcript.toLowerCase().trim());
        finish();
      };
      rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') micDenied = true; finish(); };
      rec.onend = finish;
      const t = setTimeout(finish, seconds * 1000);
      setListening(true);
      try { rec.start(); } catch (e) { finish(); }
    });
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
    card.classList.remove('hidden'); cardClose.classList.remove('hidden');
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    bearWrap.classList.add('small');
  }
  function hideCard() {
    card.classList.add('hidden'); cardClose.classList.add('hidden');
    bearWrap.classList.remove('small');
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
    count: { list: () => shuffle([1, 2, 3, 4, 5, 2, 3, 4, 5, 3]).map((n) => ({ n, t: rand(COUNT_THINGS) })), async play(o, id) {
      const items = Array.from({ length: o.n }, () => `<span>${o.t.e}</span>`).join('');
      showCard(`<div class="items">${items}</div><div class="num" id="num"></div>`);
      if (!(await say(`Let's count the ${o.t.many}!`)) && !alive(id)) return;
      const spans = card.querySelectorAll('.items span');
      for (let i = 1; i <= o.n; i++) {
        if (!alive(id)) return;
        spans[i - 1].classList.add('on');
        const num = card.querySelector('#num'); if (num) num.textContent = i;
        await say(cap(NUMS[i]) + '!');
      }
      if (!alive(id)) return;
      stars(); pose('happy', 1000);
      await say(`${cap(NUMS[o.n])} ${o.n === 1 ? o.t.one : o.t.many}! Yay!`);
    } },
    abc: { list: () => ABC.map((x) => x), async play(l, id) {
      showCard(`<div class="huge-letter">${l[0]}${l[0].toLowerCase()}</div><div class="big" style="font-size:min(18vw,80px)">${l[2]}</div><div class="word">${l[1]}</div>`);
      const line = l[0] === 'X' ? 'X! X is in fox!' : `${l[0]}! ${l[0]} is for ${l[1]}!`;
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
      showCard(bigEmoji('🎵', 'dance!'));
      await sing(id);
    } },
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  async function startGame(name) {
    const id = ++run; stopListening(); if (synth) synth.cancel(); clearPoses();
    document.querySelectorAll('.games button').forEach((b) => b.classList.toggle('active', b.dataset.game === name));
    game = { name, list: GAMES[name].list(), i: 0 };
    await GAMES[name].play(game.list[0], id);
  }
  async function nextInGame() {
    if (!game) return;
    const id = ++run; stopListening(); if (synth) synth.cancel(); clearPoses();
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

    if (has(t, ['i love you', 'love you', 'love bumble', 'love'])) { hearts(); pose('hug', 900); return say(`Aww! Bumble loves you too, ${name}! Big bear hug!`); }
    if (has(t, ['sad', 'cry', 'crying', 'owie', 'ouchie', 'ouch', 'hurt', 'boo boo', 'scared'])) { pose('hug', 900); hearts(); return say("Oh, sweetie. Bumble is here. Here's a gentle bear hug. Let's go find a grown-up for a hug too!"); }
    if (has(t, ['hug', 'cuddle', 'squeeze'])) { pose('hug', 900); hearts(); return say('Squeeeeeze! Big bear hug!'); }
    if (has(t, ['peekaboo', 'peek a boo', 'peek'])) return peekaboo(id);
    if (has(t, ['bye', 'bye bye', 'goodbye', 'see you', 'night night', 'goodnight'])) { pose('wave', 1800); return say(`Bye bye, ${name}! Come play with Bumble again soon!`); }
    if (has(t, ['sleep', 'sleepy', 'tired', 'nap', 'bed', 'night'])) return sleepy(id);
    if (has(t, ['hi', 'hello', 'hey', 'hiya', 'good morning', 'morning'])) { pose('wave', 1800); return say(rand([`Hi hi, ${name}! Bumble is so happy to see you!`, `Hello, ${name}! You make Bumble smile!`])); }
    if (has(t, ['thank you', 'thanks', 'thank'])) { pose('happy', 900); return say("You're welcome! You have such good manners!"); }
    if (has(t, ['your name', 'who are you', 'bumble', 'bear', 'teddy bear'])) { pose('happy', 900); return say("That's me! I'm Bumble the bear! Buzz buzz!"); }
    if (has(t, ['sing', 'song', 'music', 'singing'])) return sing(id);
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
    const id = ++run; if (synth) synth.cancel(); clearPoses();
    if (!SR) { await say("Bumble can't hear on this phone, but tap the pictures to play!"); return; }
    if (micDenied) { await say('Ask a grown-up to let Bumble use the microphone!'); return; }
    bubble.textContent = '👂 Bumble is listening...';
    const heard = await listen(7);
    if (!alive(id)) return;
    if (micDenied) { await say('Ask a grown-up to let Bumble use the microphone!'); return; }
    if (!heard) { await say(rand(["Hmm? Bumble didn't hear you. Tap and talk again!", 'Say that again? Tap the button and talk!'])); return; }
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
  card.addEventListener('click', () => { if (game) nextInGame(); else { hideCard(); } });
  cardClose.addEventListener('click', (e) => { e.stopPropagation(); ++run; stopListening(); if (synth) synth.cancel(); clearPoses(); hideCard(); bubble.textContent = 'Tap the microphone and talk to Bumble!'; });
  document.querySelectorAll('.games button').forEach((b) => b.addEventListener('click', () => startGame(b.dataset.game)));

  $('#start').addEventListener('click', async () => {
    $('#splash').classList.add('gone');
    // unlock audio on iOS with a silent utterance
    if (synth) { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) {} }
    loadVoices();
    const id = ++run;
    pose('wave', 1800);
    await wait(300);
    await sayAll([`Hi${settings.name ? ', ' + kid() : ''}! I'm Bumble the bear!`, 'Tap the big red button and talk to me!'], id);
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
    $('#micNote').textContent = SR
      ? (micDenied ? 'Microphone is blocked. Allow it in your browser settings for this site, then reload.' : 'Bumble uses your phone\'s built-in speech recognition to hear words.')
      : 'This browser can\'t listen. On Android use Chrome; on iPhone use Safari. Games still work by tapping.';
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  $('#setPitch').addEventListener('input', (e) => { $('#pitchOut').textContent = e.target.value; });
  $('#setRate').addEventListener('input', (e) => { $('#rateOut').textContent = e.target.value; });
  function readForm() {
    settings.name = $('#setName').value.trim().slice(0, 20);
    settings.pitch = parseFloat($('#setPitch').value); settings.rate = parseFloat($('#setRate').value);
    settings.voice = $('#setVoice').value; settings.listen = $('#setListen').checked;
  }
  $('#testVoice').addEventListener('click', () => { readForm(); say(`Hi${settings.name ? ' ' + kid() : ''}! I'm Bumble!`); });
  $('#settings').addEventListener('close', () => { if ($('#settings').returnValue === 'save') { readForm(); saveSettings(); bubble.textContent = 'Saved!'; } });

  // stop talking when the app goes to the background
  document.addEventListener('visibilitychange', () => { if (document.hidden) { ++run; stopListening(); if (synth) synth.cancel(); clearPoses(); } });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
