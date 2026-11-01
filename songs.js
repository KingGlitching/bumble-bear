/* Bumble's Music Box — plays inside the app, no Spotify needed, works offline.
   All songs are traditional nursery songs in the public domain (published before 1929).
   Each line: [lyric, [[note, beats], ...]] — notes like 'C4', 'G4', rests as 'R'. */
window.BumbleSongs = (() => {
  'use strict';
  const SONGS = [
    { id: 'twinkle', title: 'Twinkle Twinkle', emoji: '⭐', bpm: 104, words: ['twinkle', 'star', 'little star'], lines: [
      ['Twinkle, twinkle, little star,', [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2]]],
      ['How I wonder what you are!', [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]]],
      ['Up above the world so high,', [['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['Like a diamond in the sky.', [['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['Twinkle, twinkle, little star,', [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2]]],
      ['How I wonder what you are!', [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]]],
    ] },
    { id: 'abc', title: 'ABC Song', emoji: '🔤', bpm: 104, words: ['abc', 'abcs', 'alphabet', 'a b c'], lines: [
      ['A, B, C, D, E, F, G,', [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2]]],
      ['H, I, J, K, L-M-N-O-P,', [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 0.5], ['D4', 0.5], ['D4', 0.5], ['D4', 0.5], ['C4', 2]]],
      ['Q, R, S,  T, U, V,', [['G4', 1], ['G4', 1], ['F4', 2], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['W, X,  Y and Z.', [['G4', 1.5], ['G4', 0.5], ['F4', 2], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['Now I know my A B C\'s,', [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2]]],
      ['Next time won\'t you sing with me?', [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]]],
    ] },
    { id: 'mary', title: 'Mary Had a Little Lamb', emoji: '🐑', bpm: 112, words: ['mary', 'lamb', 'little lamb'], lines: [
      ['Mary had a little lamb,', [['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 2]]],
      ['little lamb, little lamb,', [['D4', 1], ['D4', 1], ['D4', 2], ['E4', 1], ['G4', 1], ['G4', 2]]],
      ['Mary had a little lamb, its', [['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 1], ['E4', 1]]],
      ['fleece was white as snow.', [['D4', 1], ['D4', 1], ['E4', 1], ['D4', 1], ['C4', 4]]],
    ] },
    { id: 'macdonald', title: 'Old MacDonald', emoji: '🐮', bpm: 120, words: ['old macdonald', 'macdonald', 'mcdonald', 'farm', 'e i e i o'], lines: [
      ['Old MacDonald had a farm,', [['G4', 1], ['G4', 1], ['G4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['E - I - E - I - O!', [['B4', 1], ['B4', 1], ['A4', 1], ['A4', 1], ['G4', 3], ['R', 1]]],
      ['And on that farm he had a cow,', [['D4', 1], ['G4', 1], ['G4', 1], ['G4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['E - I - E - I - O!', [['B4', 1], ['B4', 1], ['A4', 1], ['A4', 1], ['G4', 3], ['R', 1]]],
      ['With a moo moo here, and a moo moo there,', [['D4', 0.5], ['D4', 0.5], ['G4', 1], ['G4', 1], ['G4', 1], ['D4', 0.5], ['D4', 0.5], ['G4', 1], ['G4', 1], ['G4', 2]]],
      ['Here a moo, there a moo, everywhere a moo moo!', [['G4', 0.5], ['G4', 0.5], ['G4', 1], ['G4', 0.5], ['G4', 0.5], ['G4', 1], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 1], ['G4', 1]]],
      ['Old MacDonald had a farm,', [['G4', 1], ['G4', 1], ['G4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['D4', 2]]],
      ['E - I - E - I - O!', [['B4', 1], ['B4', 1], ['A4', 1], ['A4', 1], ['G4', 4]]],
    ] },
    { id: 'row', title: 'Row, Row, Row Your Boat', emoji: '🚣', bpm: 100, words: ['row', 'row your boat', 'boat'], lines: [
      ['Row, row, row your boat,', [['C4', 1.5], ['C4', 1.5], ['C4', 1], ['D4', 0.5], ['E4', 1.5]]],
      ['Gently down the stream.', [['E4', 1], ['D4', 0.5], ['E4', 1], ['F4', 0.5], ['G4', 3]]],
      ['Merrily, merrily, merrily, merrily,', [['C5', 0.5], ['C5', 0.5], ['C5', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['E4', 0.5], ['E4', 0.5], ['E4', 0.5], ['C4', 0.5], ['C4', 0.5], ['C4', 0.5]]],
      ['Life is but a dream!', [['G4', 1], ['F4', 0.5], ['E4', 1], ['D4', 0.5], ['C4', 3]]],
    ] },
    { id: 'bridge', title: 'London Bridge', emoji: '🌉', bpm: 112, words: ['london bridge', 'bridge', 'falling down'], lines: [
      ['London Bridge is falling down,', [['G4', 1.5], ['A4', 0.5], ['G4', 1], ['F4', 1], ['E4', 1], ['F4', 1], ['G4', 2]]],
      ['falling down, falling down,', [['D4', 1], ['E4', 1], ['F4', 2], ['E4', 1], ['F4', 1], ['G4', 2]]],
      ['London Bridge is falling down,', [['G4', 1.5], ['A4', 0.5], ['G4', 1], ['F4', 1], ['E4', 1], ['F4', 1], ['G4', 2]]],
      ['my fair lady!', [['D4', 2], ['G4', 2], ['E4', 1], ['C4', 3]]],
    ] },
    { id: 'buns', title: 'Hot Cross Buns', emoji: '🥯', bpm: 100, words: ['hot cross buns', 'buns'], lines: [
      ['Hot cross buns!', [['E4', 1], ['D4', 1], ['C4', 2]]],
      ['Hot cross buns!', [['E4', 1], ['D4', 1], ['C4', 2]]],
      ['One a penny, two a penny,', [['C4', 0.5], ['C4', 0.5], ['C4', 0.5], ['C4', 0.5], ['D4', 0.5], ['D4', 0.5], ['D4', 0.5], ['D4', 0.5]]],
      ['Hot cross buns!', [['E4', 1], ['D4', 1], ['C4', 2]]],
    ] },
    { id: 'sleeping', title: 'Are You Sleeping?', emoji: '🔔', bpm: 108, words: ['are you sleeping', 'brother john', 'sleeping', 'frere jacques'], lines: [
      ['Are you sleeping, are you sleeping,', [['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1]]],
      ['Brother John, Brother John?', [['E4', 1], ['F4', 1], ['G4', 2], ['E4', 1], ['F4', 1], ['G4', 2]]],
      ['Morning bells are ringing, morning bells are ringing,', [['G4', 0.75], ['A4', 0.25], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1], ['G4', 0.75], ['A4', 0.25], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1]]],
      ['Ding, dang, dong. Ding, dang, dong.', [['C4', 1], ['G3', 1], ['C4', 2], ['C4', 1], ['G3', 1], ['C4', 2]]],
    ] },
    { id: 'hickory', title: 'Hickory Dickory Dock', emoji: '🐭', bpm: 96, words: ['hickory', 'dickory', 'dock', 'mouse ran up the clock'], lines: [
      ['Hickory, dickory, dock,', [['E4', 0.5], ['F4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 1.5]]],
      ['The mouse ran up the clock.', [['C5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1.5]]],
      ['The clock struck one, the mouse ran down,', [['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 0.5], ['F4', 0.5], ['G4', 0.5], ['A4', 0.5], ['G4', 1]]],
      ['Hickory, dickory, dock!', [['E4', 0.5], ['F4', 0.5], ['G4', 0.5], ['D4', 0.5], ['E4', 0.5], ['C4', 1.5]]],
    ] },
  ];

  const FREQ = (n) => {
    const m = /^([A-G])(#?)(\d)$/.exec(n); if (!m) return 0;
    const idx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (idx - 9) / 12 + (Number(m[3]) - 4));
  };

  let ctx = null;
  let master = null;
  let playing = null; // { stop() }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /* call inside a tap so iPhone allows sound later */
  function unlock() { const c = audio(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 0.02); }

  // soft music-box / xylophone tone
  function note(freq, t, dur, dest) {
    const c = ctx;
    const g = c.createGain(); g.connect(dest);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 1.4));
    const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2;
    const g2 = c.createGain(); g2.gain.value = 0.18;
    o1.connect(g); o2.connect(g2); g2.connect(g);
    const end = t + Math.max(0.4, dur * 1.5);
    o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
  }
  function bass(freq, t, dur, dest) {
    const c = ctx; const g = c.createGain(); g.connect(dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq; o.connect(g); o.start(t); o.stop(t + dur + 0.05);
  }

  /* Play a song. onLine(i) fires as each lyric line starts. Resolves when done or stopped. */
  function play(song, { onLine, onNote } = {}) {
    stop();
    const c = audio();
    if (!c) return Promise.resolve(false);
    const beat = 60 / song.bpm;
    const sg = c.createGain(); sg.connect(master);
    let t = c.currentTime + 0.15;
    const timers = [];
    const toMs = (time) => (time - c.currentTime) * 1000;
    song.lines.forEach((line, i) => {
      const lineStart = t;
      timers.push(setTimeout(() => onLine && onLine(i), Math.max(0, toMs(lineStart))));
      line[1].forEach(([n, b], k) => {
        const d = b * beat;
        if (n !== 'R') {
          note(FREQ(n), t, d, sg);
          if (k % 2 === 0) bass(FREQ(n) / 4, t, d * 1.8, sg);
          timers.push(setTimeout(() => onNote && onNote(), Math.max(0, toMs(t))));
        }
        t += d;
      });
      t += beat * 0.25;
    });
    const total = (t - c.currentTime) * 1000;
    return new Promise((resolve) => {
      const done = setTimeout(() => { playing = null; resolve(true); }, total + 200);
      playing = { stop() { timers.forEach(clearTimeout); clearTimeout(done); try { sg.disconnect(); } catch (e) {} playing = null; resolve(false); } };
    });
  }
  function stop() { if (playing) playing.stop(); }
  const isPlaying = () => !!playing;

  function find(text) {
    const t = String(text || '').toLowerCase();
    return SONGS.find((s) => t.includes(s.title.toLowerCase()) || s.words.some((w) => t.includes(w))) || null;
  }

  return { SONGS, play, stop, unlock, find, isPlaying };
})();
