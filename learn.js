/* Bumble's learning engine: random questions that grow with your child.
   Levels follow free public guides:
   - Math: Common Core State Standards (K.CC, K.OA, 1.OA, 1.NBT, 2.OA, 2.NBT, 3.OA, 3.NBT) — free to use.
   - Reading: Dolch sight-word lists (1936, public domain), letter sounds, rhyming word families,
     and early-learning milestones (naming pictures, colors, shapes) for toddlers.
   Every question is generated fresh, so it is never the same set twice. */
window.BumbleLearn = (() => {
  'use strict';
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LEVELS = [
    null,
    { name: 'Toddler (age 2–3)' },
    { name: 'Preschool (age 3–4)' },
    { name: 'Pre-K / Kindergarten (age 4–6)' },
    { name: '1st grade (age 6–7)' },
    { name: '2nd grade (age 7–8)' },
    { name: '3rd grade (age 8–9)' },
  ];
  function levelForAge(age) {
    age = Number(age) || 2;
    if (age < 3) return 1; if (age < 4) return 2; if (age < 6) return 3; if (age < 7) return 4; if (age < 8) return 5; return 6;
  }

  /* ---------- words & numbers ---------- */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function numWord(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numWord(n % 100) : '');
    return String(n);
  }
  // Speech recognisers mishear little numbers as words ("to", "for", "won").
  const SOUNDALIKE = { won: 1, to: 2, too: 2, tu: 2, tree: 3, for: 4, fore: 4, ate: 8, hate: 8, tin: 10, oh: 0, none: 0, nothing: 0 };
  function parseNumber(text) {
    if (!text) return null;
    const t = String(text).toLowerCase().replace(/-/g, ' ');
    const d = /\b(\d{1,4})\b/.exec(t); if (d) return Number(d[1]);
    const words = t.split(/[^a-z]+/).filter(Boolean);
    let total = null, cur = 0, seen = false;
    for (const w of words) {
      const o = ONES.indexOf(w), te = TENS.indexOf(w);
      if (o >= 0) { cur += o; seen = true; }
      else if (te >= 2) { cur += te * 10; seen = true; }
      else if (w === 'hundred' && seen) { cur *= 100; }
      else if (seen) break;
    }
    if (seen) total = cur;
    if (total === null) for (const w of words) if (w in SOUNDALIKE) return SOUNDALIKE[w];
    return total;
  }
  // "what is 5 plus 3" / "7 - 2" / "3 times 4" / "12 divided by 3"
  function parseMath(text) {
    let t = ' ' + String(text).toLowerCase() + ' ';
    t = t.replace(/(\d)\s*x\s*(\d)/g, '$1 times $2').replace(/[×*]/g, ' times ').replace(/[÷/]/g, ' divided by ').replace(/\+/g, ' plus ').replace(/(\d)\s*-\s*(\d)/g, '$1 minus $2');
    const ops = [['plus', '+'], ['add', '+'], ['and', '+'], ['minus', '-'], ['take away', '-'], ['subtract', '-'], ['times', '×'], ['multiplied by', '×'], ['divided by', '÷'], ['divide', '÷']];
    for (const [w, op] of ops) {
      const i = t.indexOf(' ' + w + ' ');
      if (i < 0) continue;
      const a = parseNumber(lastNumberChunk(t.slice(0, i))), b = parseNumber(t.slice(i + w.length + 2));
      if (a === null || b === null) continue;
      if (w === 'and' && !/\b(what|how much|is|plus|add)\b/.test(t)) continue;
      return { a, b, op };
    }
    return null;
  }
  function lastNumberChunk(s) {
    const m = /(\d+|(?:(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)[\s-]*)+)\s*$/.exec(s.trim());
    return m ? m[1] : '';
  }
  function solve({ a, b, op }) {
    if (op === '+') return { ans: a + b, said: `${a} plus ${b} is ${a + b}!` };
    if (op === '-') return a >= b ? { ans: a - b, said: `${a} minus ${b} is ${a - b}!` } : { ans: a - b, said: `${a} minus ${b} is negative ${b - a}. That's a number below zero!` };
    if (op === '×') return { ans: a * b, said: `${a} times ${b} is ${a * b}!` };
    if (b === 0) return { ans: null, said: "Ooh, tricky! You can't share into zero groups." };
    const q = Math.floor(a / b), r = a % b;
    return { ans: a / b, said: r ? `${a} divided by ${b} is ${q}, with ${r} left over!` : `${a} divided by ${b} is ${q}!` };
  }

  /* ---------- word banks ---------- */
  const PICS = {
    cat: '🐱', dog: '🐶', pig: '🐷', hen: '🐔', bug: '🐛', sun: '☀️', bus: '🚌', cup: '🥤', hat: '🎩', bed: '🛏️', fox: '🦊',
    box: '📦', fish: '🐟', frog: '🐸', duck: '🦆', bee: '🐝', car: '🚗', star: '⭐', moon: '🌙', tree: '🌳', cake: '🎂',
    ball: '⚽', book: '📖', apple: '🍎', egg: '🥚', ant: '🐜', owl: '🦉', goat: '🐐', cow: '🐮', bat: '🦇', snake: '🐍',
    milk: '🥛', shoe: '👟', boat: '⛵', kite: '🪁', ring: '💍', sock: '🧦', lamp: '💡', hand: '✋', nose: '👃', bear: '🐻',
    horse: '🐴', lion: '🦁', mouse: '🐭', sheep: '🐑', train: '🚂', house: '🏠', banana: '🍌', rain: '🌧️', key: '🔑', jam: '🍓',
  };
  const TODDLER_PICS = ['cat', 'dog', 'pig', 'duck', 'bee', 'car', 'ball', 'apple', 'fish', 'cow', 'bear', 'moon', 'shoe', 'banana', 'book', 'house', 'train', 'cake'];
  const CVC = ['cat', 'dog', 'pig', 'hen', 'bug', 'sun', 'bus', 'cup', 'hat', 'bed', 'fox', 'box', 'bat', 'ant', 'jam', 'egg'];
  const LONGER = ['fish', 'frog', 'duck', 'star', 'moon', 'tree', 'cake', 'ball', 'book', 'milk', 'shoe', 'boat', 'kite', 'ring', 'sock', 'lamp', 'hand', 'nose', 'goat', 'snake', 'train', 'house', 'horse', 'mouse', 'sheep', 'rain'];
  const FAMILIES = [
    ['cat', 'hat', 'bat', 'mat', 'rat', 'sat'], ['dog', 'frog', 'log', 'jog'], ['pig', 'wig', 'big', 'dig'], ['sun', 'bun', 'run', 'fun'],
    ['bug', 'rug', 'hug', 'mug'], ['hen', 'pen', 'ten', 'men'], ['fox', 'box', 'socks'], ['bee', 'tree', 'three', 'see'],
    ['car', 'star', 'jar', 'far'], ['cake', 'snake', 'rake', 'lake'], ['moon', 'spoon', 'soon', 'noon'], ['boat', 'goat', 'coat', 'float'],
  ];
  // Dolch sight words (public domain, 1936)
  const DOLCH = {
    preprimer: 'a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you'.split(' '),
    primer: 'all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes'.split(' '),
    grade1: 'after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when'.split(' '),
    grade2: "always around because been before best both buy call cold does don't fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your".split(' '),
    grade3: 'about better bring carry clean cut done draw drink eight fall far full got grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six small start ten today together try warm'.split(' '),
  };
  const SIGHT_BY_LEVEL = { 3: [...DOLCH.preprimer, ...DOLCH.primer], 4: [...DOLCH.primer, ...DOLCH.grade1], 5: [...DOLCH.grade1, ...DOLCH.grade2], 6: [...DOLCH.grade2, ...DOLCH.grade3] };
  const SOUNDS = { A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'fff', G: 'guh', H: 'huh', I: 'ih', J: 'juh', K: 'kuh', L: 'lll', M: 'mmm', N: 'nnn', O: 'aw', P: 'puh', Q: 'kwuh', R: 'rrr', S: 'sss', T: 'tuh', U: 'uh', V: 'vvv', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zzz' };
  const OPPOSITES = [['big', 'little', '🐘', '🐭'], ['hot', 'cold', '🔥', '🧊'], ['up', 'down', '⬆️', '⬇️'], ['happy', 'sad', '😀', '😢'], ['fast', 'slow', '🐇', '🐢'], ['day', 'night', '☀️', '🌙'], ['wet', 'dry', '💧', '🏜️'], ['loud', 'quiet', '📢', '🤫'], ['open', 'closed', '📖', '📕'], ['full', 'empty', '🥛', '🥤']];
  const SENTENCES = [
    ['The ___ says woof.', 'dog', ['cat', 'fish']], ['The ___ is in the sky.', 'sun', ['cup', 'bed']], ['I sleep in my ___.', 'bed', ['hat', 'box']],
    ['The ___ can swim.', 'fish', ['car', 'cake']], ['I drink ___ from a cup.', 'milk', ['ball', 'shoe']], ['A ___ says moo.', 'cow', ['bee', 'boat']],
    ['I put a ___ on my foot.', 'shoe', ['moon', 'egg']], ['The ___ hops on a log.', 'frog', ['house', 'lamp']], ['We eat ___ on my birthday.', 'cake', ['rain', 'key']],
    ['The ___ goes choo choo.', 'train', ['goat', 'ring']], ['A ___ makes honey.', 'bee', ['fox', 'sock']], ['I read a ___ at night.', 'book', ['bus', 'egg']],
  ];
  const NAMES = ['Bumble', 'Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Max', 'Lily', 'Ben', 'Nora'];
  const THINGS = [['🍎', 'apple', 'apples'], ['🎈', 'balloon', 'balloons'], ['🍪', 'cookie', 'cookies'], ['🦆', 'duck', 'ducks'], ['⭐', 'star', 'stars'], ['🚗', 'car', 'cars'], ['🍓', 'strawberry', 'strawberries'], ['🐟', 'fish', 'fish'], ['🌸', 'flower', 'flowers'], ['🧁', 'cupcake', 'cupcakes']];
  const COLORS = [['red', '#E8333A'], ['blue', '#2E7CF6'], ['yellow', '#FFD23F'], ['green', '#3DBE5A'], ['orange', '#FF8A1F'], ['purple', '#9B4DE0'], ['pink', '#FF77B7']];
  const SPELLABLE = new Set([...Object.keys(PICS), ...Object.values(DOLCH).flat().map((w) => w.toLowerCase()), ...FAMILIES.flat(),
    'mom', 'mama', 'dad', 'dada', 'baby', 'love', 'bumble', 'red', 'blue', 'green', 'pink', 'purple', 'orange', 'yellow', 'happy', 'sad', 'hello', 'bye']);

  /* ---------- helpers to build questions ---------- */
  const items = (e, n) => Array.from({ length: n }, () => `<span class="on">${e}</span>`).join('');
  const numChoices = (ans, spread, min = 0) => {
    const s = new Set([ans]);
    let guard = 0;
    while (s.size < 3 && guard++ < 50) { const c = ans + ri(-spread, spread); if (c >= min && c !== ans) s.add(c); }
    while (s.size < 3) s.add(ans + s.size);
    return shuffle([...s]).map((v) => ({ label: String(v), value: v }));
  };
  const wordChoices = (ans, pool) => shuffle([ans, ...shuffle(pool.filter((w) => w !== ans)).slice(0, 2)]).map((w) => ({ label: w, value: w }));
  const plural = (n, t) => (n === 1 ? t[1] : t[2]);

  /* ---------- MATH ---------- */
  const MATH = {
    1: [() => { // how many? (1–3, then up to 5)
      const t = rand(THINGS), n = ri(1, rand([3, 5]));
      return { say: [`How many ${t[2]}?`], html: `<div class="items">${items(t[0], n)}</div>`, answer: n, choices: numChoices(n, 2, 1), count: { n, thing: t }, explain: `${numWord(n)} ${plural(n, t)}!` };
    }],
    2: [() => {
      const t = rand(THINGS), n = ri(1, 10);
      return { say: [`Let's count! How many ${t[2]}?`], html: `<div class="items">${items(t[0], n)}</div>`, answer: n, choices: numChoices(n, 2, 1), count: { n, thing: t }, explain: `${numWord(n)} ${plural(n, t)}!` };
    }, () => {
      const n = ri(1, 9);
      return { say: [`What number comes after ${n}?`], html: `<div class="huge-letter">${n} → ?</div>`, answer: n + 1, choices: numChoices(n + 1, 2, 1), explain: `${numWord(n + 1)} comes after ${numWord(n)}!` };
    }, () => {
      const t = rand(THINGS); let a = ri(1, 6), b = ri(1, 6); while (a === b) b = ri(1, 6);
      return { say: ['Which side has more?'], html: `<div class="items">${items(t[0], a)}</div><hr style="width:80%"><div class="items">${items(t[0], b)}</div>`, answer: a > b ? 'top' : 'bottom', choices: [{ label: '⬆️ Top', value: 'top' }, { label: '⬇️ Bottom', value: 'bottom' }], explain: `${a > b ? 'The top' : 'The bottom'} has ${numWord(Math.max(a, b))}. That's more!` };
    }],
    3: [() => addPics(5), () => addPics(10), () => subPics(5), () => subPics(10), () => {
      const n = ri(5, 19);
      return { say: [`What number comes after ${n}?`], html: `<div class="huge-letter">${n} → ?</div>`, answer: n + 1, choices: numChoices(n + 1, 2, 1), explain: `${numWord(n + 1)}!` };
    }],
    4: [() => addNum(20), () => subNum(20), () => missingAddend(10), () => wordProblem(20), () => {
      const a = ri(10, 99); let b = ri(10, 99); while (a === b) b = ri(10, 99);
      return { say: [`Which number is bigger, ${a} or ${b}?`], html: `<div class="huge-letter" style="font-size:min(16vw,70px)">${a} ? ${b}</div>`, answer: Math.max(a, b), choices: shuffle([{ label: String(a), value: a }, { label: String(b), value: b }]), explain: `${Math.max(a, b)} is bigger!` };
    }, () => {
      const n = ri(11, 99);
      return { say: [`How many tens are in ${n}?`], html: `<div class="huge-letter" style="font-size:min(18vw,80px)">${n}</div>`, answer: Math.floor(n / 10), choices: numChoices(Math.floor(n / 10), 2, 1), explain: `${n} has ${Math.floor(n / 10)} tens and ${n % 10} ones!` };
    }],
    5: [() => addNum(100), () => subNum(100), () => wordProblem(100), () => {
      const step = rand([2, 5, 10]), start = step * ri(1, 6), seq = [start, start + step, start + 2 * step];
      return { say: [`Count by ${step}s. What comes next? ${seq.join(', ')}...`], html: `<div class="huge-letter" style="font-size:min(12vw,54px)">${seq.join(', ')}, ?</div>`, answer: start + 3 * step, choices: numChoices(start + 3 * step, step, 0), explain: `${start + 3 * step}! Counting by ${step}s!` };
    }, () => {
      const n = ri(1, 20);
      return { say: [`Is ${n} odd or even?`], html: `<div class="huge-letter">${n}</div>`, answer: n % 2 ? 'odd' : 'even', choices: [{ label: 'odd', value: 'odd' }, { label: 'even', value: 'even' }], explain: `${n} is ${n % 2 ? 'odd' : 'even'}!` };
    }, () => {
      const r = ri(2, 4), c = ri(2, 5), t = rand(THINGS);
      const grid = Array.from({ length: r }, () => `<div>${Array.from({ length: c }, () => t[0]).join('')}</div>`).join('');
      return { say: [`${r} rows of ${c}. How many in all?`], html: `<div style="font-size:min(9vw,40px);line-height:1.2">${grid}</div>`, answer: r * c, choices: numChoices(r * c, 3, 1), explain: `${r} rows of ${c} is ${r * c}!` };
    }],
    6: [() => {
      const a = ri(2, 10), b = ri(2, 10);
      return { say: [`What is ${a} times ${b}?`], html: `<div class="huge-letter" style="font-size:min(16vw,70px)">${a} × ${b}</div>`, answer: a * b, choices: numChoices(a * b, Math.max(a, b), 1), explain: `${a} times ${b} is ${a * b}!` };
    }, () => {
      const b = ri(2, 10), q = ri(2, 10);
      return { say: [`What is ${b * q} divided by ${b}?`], html: `<div class="huge-letter" style="font-size:min(16vw,70px)">${b * q} ÷ ${b}</div>`, answer: q, choices: numChoices(q, 3, 1), explain: `${b * q} divided by ${b} is ${q}!` };
    }, () => {
      let n = ri(11, 98); if (n % 10 === 0) n++; const r = Math.round(n / 10) * 10;
      return { say: [`Round ${n} to the nearest ten.`], html: `<div class="huge-letter">${n}</div>`, answer: r, choices: shuffle([{ label: String(Math.floor(n / 10) * 10), value: Math.floor(n / 10) * 10 }, { label: String(Math.ceil(n / 10) * 10), value: Math.ceil(n / 10) * 10 }].filter((x, i, a) => a.findIndex((y) => y.value === x.value) === i)), explain: `${n} rounds to ${r}!` };
    }, () => addNum(1000), () => subNum(1000), () => {
      const name = rand(NAMES), t = rand(THINGS), g = ri(2, 6), each = ri(2, 8);
      return { say: [`${name} has ${g} bags with ${each} ${t[2]} in each bag. How many ${t[2]} in all?`], html: `<div class="big" style="font-size:min(16vw,70px)">🛍️ ${t[0]}</div>`, answer: g * each, choices: numChoices(g * each, 6, 1), explain: `${g} times ${each} is ${g * each}!` };
    }],
  };
  function addPics(max) {
    const t = rand(THINGS), a = ri(1, max - 1), b = ri(1, max - a);
    return { say: [`${a} ${plural(a, t)} and ${b} more. How many in all?`], html: `<div class="items">${items(t[0], a)}</div><div class="num">+</div><div class="items">${items(t[0], b)}</div>`, answer: a + b, choices: numChoices(a + b, 2, 1), explain: `${a} plus ${b} is ${a + b}!` };
  }
  function subPics(max) {
    const t = rand(THINGS), a = ri(2, max), b = ri(1, a - 1);
    const pics = Array.from({ length: a }, (_, i) => `<span class="${i < a - b ? 'on' : 'gone'}">${t[0]}</span>`).join('');
    return { say: [`There are ${a} ${t[2]}. ${b} go away. How many are left?`], html: `<div class="items">${pics}</div>`, answer: a - b, choices: numChoices(a - b, 2, 0), explain: `${a} minus ${b} is ${a - b}!` };
  }
  function addNum(max) {
    const a = ri(1, Math.floor(max * 0.7)), b = ri(1, max - a);
    return { say: [`What is ${a} plus ${b}?`], html: `<div class="huge-letter" style="font-size:min(15vw,66px)">${a} + ${b}</div>`, answer: a + b, choices: numChoices(a + b, max > 20 ? 10 : 3, 0), explain: `${a} plus ${b} is ${a + b}!` };
  }
  function subNum(max) {
    const a = ri(2, max), b = ri(1, a - 1);
    return { say: [`What is ${a} minus ${b}?`], html: `<div class="huge-letter" style="font-size:min(15vw,66px)">${a} − ${b}</div>`, answer: a - b, choices: numChoices(a - b, max > 20 ? 10 : 3, 0), explain: `${a} minus ${b} is ${a - b}!` };
  }
  function missingAddend(max) {
    const a = ri(1, max - 1), b = ri(1, max - a);
    return { say: [`${a} plus what makes ${a + b}?`], html: `<div class="huge-letter" style="font-size:min(15vw,66px)">${a} + ? = ${a + b}</div>`, answer: b, choices: numChoices(b, 3, 1), explain: `${a} plus ${b} makes ${a + b}!` };
  }
  function wordProblem(max) {
    const name = rand(NAMES), t = rand(THINGS);
    if (Math.random() < 0.5) {
      const a = ri(1, Math.floor(max / 2)), b = ri(1, max - a);
      return { say: [`${name} has ${a} ${plural(a, t)}. ${name} gets ${b} more. How many ${t[2]} now?`], html: `<div class="big" style="font-size:min(16vw,70px)">${t[0]}</div><div class="word" style="font-size:20px">${a} + ${b} = ?</div>`, answer: a + b, choices: numChoices(a + b, max > 20 ? 10 : 3, 1), explain: `${a} plus ${b} is ${a + b}!` };
    }
    const a = ri(3, max), b = ri(1, a - 1);
    return { say: [`${name} has ${a} ${t[2]}. ${name} gives away ${b}. How many are left?`], html: `<div class="big" style="font-size:min(16vw,70px)">${t[0]}</div><div class="word" style="font-size:20px">${a} − ${b} = ?</div>`, answer: a - b, choices: numChoices(a - b, max > 20 ? 10 : 3, 0), explain: `${a} minus ${b} is ${a - b}!` };
  }

  /* ---------- READING ---------- */
  const picCard = (w) => `<div class="big">${PICS[w] || '❓'}</div>`;
  const READING = {
    1: [() => { // which one is the ___? (point to the picture)
      const pool = shuffle(TODDLER_PICS).slice(0, 3), ans = pool[0];
      return { say: [`Where is the ${ans}? Tap the ${ans}!`], html: '', answer: ans, choices: shuffle(pool).map((w) => ({ label: PICS[w], value: w, big: true })), explain: `That's the ${ans}!`, words: pool };
    }, () => {
      const c = shuffle(COLORS).slice(0, 3), ans = c[0];
      return { say: [`Which one is ${ans[0]}?`], html: '', answer: ans[0], choices: shuffle(c).map(([n, hex]) => ({ label: '', value: n, swatch: hex })), explain: `That's ${ans[0]}!`, words: c.map((x) => x[0]) };
    }],
    2: [() => READING[1][0](), () => {
      const L = shuffle(Object.keys(SOUNDS)).slice(0, 3), ans = L[0];
      return { say: [`Find the letter ${ans}!`], html: '', answer: ans, choices: shuffle(L).map((l) => ({ label: l, value: l })), explain: `That's ${ans}! ${ans} says ${SOUNDS[ans]}.`, words: L.map((l) => l.toLowerCase()) };
    }, () => {
      const fam = rand(FAMILIES), w = fam[0], rhyme = rand(fam.slice(1)), other = rand(rand(FAMILIES.filter((f) => f !== fam)));
      return { say: [`Which word rhymes with ${w}? ${rhyme}, or ${other}?`], html: picCard(w) + `<div class="word">${w}</div>`, answer: rhyme, choices: shuffle([rhyme, other]).map((x) => ({ label: x, value: x })), explain: `${w}, ${rhyme}! They rhyme!` };
    }, () => {
      const o = rand(OPPOSITES);
      return { say: [`What is the opposite of ${o[0]}?`], html: `<div class="big">${o[2]}</div><div class="word">${o[0]}</div>`, answer: o[1], choices: shuffle([o[1], rand(OPPOSITES.filter((x) => x !== o))[1]]).map((x) => ({ label: x, value: x })), explain: `The opposite of ${o[0]} is ${o[1]}!` };
    }],
    3: [() => beginningSound(CVC.concat(LONGER)), () => sight(3), () => sight(3), () => READING[2][2](), () => {
      const L = rand(Object.keys(SOUNDS));
      return { say: [`Which letter says ${SOUNDS[L]}?`], html: '<div class="big">🔤</div>', answer: L, choices: shuffle([L, ...shuffle(Object.keys(SOUNDS).filter((x) => x !== L)).slice(0, 2)]).map((l) => ({ label: l, value: l })), explain: `${L} says ${SOUNDS[L]}!` };
    }],
    4: [() => sight(4), () => sight(4), () => missingLetter(CVC), () => READING[2][2](), () => sentence()],
    5: [() => sight(5), () => missingLetter(LONGER), () => sentence(), () => READING[2][3](), () => spellCount(LONGER)],
    6: [() => sight(6), () => missingLetter(LONGER), () => sentence(), () => spellCount(LONGER.concat(DOLCH.grade3.filter((w) => w.length > 4)))],
  };
  function beginningSound(pool) {
    const w = rand(pool.filter((x) => PICS[x])), L = w[0].toUpperCase();
    return { say: [`What letter does ${w} start with?`], html: picCard(w), answer: L, choices: shuffle([L, ...shuffle(Object.keys(SOUNDS).filter((x) => x !== L)).slice(0, 2)]).map((l) => ({ label: l, value: l })), explain: `${w} starts with ${L}! ${L} says ${SOUNDS[L]}.` };
  }
  function sight(level) {
    const pool = SIGHT_BY_LEVEL[level], ans = rand(pool);
    return { say: [`Find the word: ${ans}.`], html: '<div class="big">👀</div>', answer: ans, choices: wordChoices(ans, pool), explain: `${ans}! Great reading!`, words: [ans] };
  }
  function missingLetter(pool) {
    const w = rand(pool.filter((x) => PICS[x])), i = ri(0, w.length - 1), L = w[i];
    const shown = w.split('').map((c, k) => (k === i ? '_' : c)).join('');
    const letters = shuffle([L, ...shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter((x) => x !== L)).slice(0, 2)]);
    return { say: [`What letter is missing in ${w}?`], html: picCard(w) + `<div class="word" style="letter-spacing:6px;text-transform:none">${shown}</div>`, answer: L, choices: letters.map((l) => ({ label: l, value: l })), explain: `${w.split('').join(', ')}. ${w}!` };
  }
  function sentence() {
    const [s, ans, others] = rand(SENTENCES);
    return { say: [s.replace('___', 'blank'), 'Which word fits?'], html: `<div class="word" style="font-size:22px;text-transform:none">${esc(s)}</div>`, answer: ans, choices: shuffle([ans, ...others]).map((x) => ({ label: x, value: x })), explain: s.replace('___', ans) };
  }
  function spellCount(pool) {
    const w = rand(pool), n = w.length;
    return { say: [`How many letters are in the word ${w}?`], html: `<div class="word" style="font-size:34px;text-transform:none">${esc(w)}</div>`, answer: n, choices: numChoices(n, 2, 2), explain: `${w.split('').join(', ')}. ${numWord(n)} letters!` };
  }

  function mathQuestion(level) { const L = Math.min(6, Math.max(1, level)); return rand(MATH[L])(); }
  function readingQuestion(level) { const L = Math.min(6, Math.max(1, level)); return rand(READING[L])(); }

  /* Does what the child said match the answer? */
  function matches(q, heardList) {
    const t = heardList.join(' | ');
    if (typeof q.answer === 'number') return heardList.some((h) => parseNumber(h) === q.answer);
    const a = String(q.answer).toLowerCase();
    if (q.answer === 'top' || q.answer === 'bottom') return new RegExp('\\b' + (a === 'top' ? '(top|up|first)' : '(bottom|down|second)') + '\\b').test(t);
    if (a.length === 1) return new RegExp('\\b' + a + '\\b').test(t);
    return new RegExp('\\b' + a.replace(/[^a-z']/g, '') + '\\b').test(t);
  }

  return { LEVELS, levelForAge, numWord, parseNumber, parseMath, solve, mathQuestion, readingQuestion, matches, SPELLABLE, SOUNDS, esc };
})();
