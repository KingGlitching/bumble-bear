# Bumble Bear 🐻

A talking bear for toddlers. Tap the big red button and talk — Bumble listens and answers out loud. Tap the picture buttons to learn colors, counting, animals, ABCs, shapes and body parts, or sing and dance along.

- Works in the browser on Android (Chrome) and iPhone (Safari)
- Installs like an app and works offline after the first visit
- No accounts, no ads, no tracking
- **Grows with your child:** set age, reading level and math level (toddler → 3rd grade). Math, Words and Surprise make up new questions every time, following free public standards (Common Core math; Dolch sight words, public domain).
- **Ask Bumble math:** "what is 7 plus 5?", "12 divided by 3", "count to 20", "how do you spell cat"
- **Natural voice:** an open-source Piper neural voice runs on the phone (downloads ~60 MB once, then works offline). Falls back to the phone's voice.
- **Music:** connect Spotify (Premium) and say "play Baby Shark". Explicit songs are always skipped.

## Grown-ups

Press and **hold** the ⚙️ gear for 1–2 seconds to set your child's name, the voice, pitch and speed.

### Android
Open the site in **Chrome** → tap ⋮ → **Add to Home screen** / **Install app**.

### iPhone
Open the site in **Safari** → tap the Share button → **Add to Home Screen**.
If the microphone doesn't work from the home-screen icon, open the site in Safari directly (Siri & Dictation must be turned on in Settings for speech recognition).

## Run locally
Any static web server works, e.g. `python3 -m http.server`, then open http://localhost:8000.
The microphone needs `https://` (GitHub Pages provides this) or `localhost`.

## Spotify setup (grown-ups)
1. Go to developer.spotify.com/dashboard → Create app.
2. Redirect URI: `https://kingglitching.github.io/bumble-bear/` — tick **Web API**.
3. Copy the Client ID → in Bumble hold ⚙️ → paste → Connect Spotify.
4. Open the Spotify app on the phone once so Bumble can find it.

## Credits
- Voice: [Piper](https://github.com/rhasspy/piper) voices via [vits-web](https://github.com/diffusion-studio/vits-web)
- Learning levels: Common Core State Standards for Mathematics; Dolch sight word lists
