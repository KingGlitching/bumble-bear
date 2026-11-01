# Bumble Bear 🐻

A talking bear for toddlers. Tap the big red button and talk — Bumble listens and answers out loud. Tap the picture buttons to learn colors, counting, animals, ABCs, shapes and body parts, or sing and dance along.

- Works in the browser on Android (Chrome) and iPhone (Safari)
- Installs like an app and works offline after the first visit
- No accounts, no ads, no tracking
- **Grows with your child:** set age, reading level and math level (toddler → 3rd grade). Math, Words and Surprise make up new questions every time, following free public standards (Common Core math; Dolch sight words, public domain).
- **Ask Bumble math:** "what is 7 plus 5?", "12 divided by 3", "count to 20", "how do you spell cat"
- **Natural voice:** an open-source Piper neural voice runs on the phone (downloads ~60 MB once, then works offline). Falls back to the phone's voice.
- **Speech practice (Say It):** Bumble models a word slowly by syllables, listens, and only cheers when she says it right; it tracks words she has learned.
- **49 animals** with facts by level and 30 real recordings; "Who says this?" sound quiz.
- **Music Box:** public-domain nursery songs that play inside the app, offline.
- **Videos:** only grown-up-approved YouTube links, with an optional time limit.
- **Kid Lock:** full screen, back button blocked, hold 🔓 3 s to unlock (plus Guided Access / App Pinning steps).
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
- Animal sounds: Wikimedia Commons (public domain / Creative Commons). Sounds play from Wikimedia's servers:
  - [Mudchute cow 1.ogg](https://commons.wikimedia.org/wiki/File:Mudchute_cow_1.ogg) — CC BY-SA 3.0 — Secretlondon
  - [Mudchute sheep 1.ogg](https://commons.wikimedia.org/wiki/File:Mudchute_sheep_1.ogg) — CC BY-SA 3.0 — Secretlondon
  - [Mudchute lamb 1.ogg](https://commons.wikimedia.org/wiki/File:Mudchute_lamb_1.ogg) — CC BY-SA 3.0 — Secretlondon
  - [Mudchute pig 2.ogg](https://commons.wikimedia.org/wiki/File:Mudchute_pig_2.ogg) — CC BY-SA 3.0 — Secretlondon
  - [Mudchute duck 1.ogg](https://commons.wikimedia.org/wiki/File:Mudchute_duck_1.ogg) — CC BY-SA 3.0 — Secretlondon
  - [Meow.ogg](https://commons.wikimedia.org/wiki/File:Meow.ogg) — CC BY-SA 3.0 — Dcrosby (English Wikipedia)
  - [Purring cat.oga](https://commons.wikimedia.org/wiki/File:Purring_cat.oga) — Public domain — Mysid
  - [Barking of a dog.ogg](https://commons.wikimedia.org/wiki/File:Barking_of_a_dog.ogg) — CC BY-SA 3.0 — Amada44
  - [Wiehern.ogg](https://commons.wikimedia.org/wiki/File:Wiehern.ogg) — Public domain — Hü.
  - [Rooster crowing.oga](https://commons.wikimedia.org/wiki/File:Rooster_crowing.oga) — CC BY-SA 3.0 — Georgethewriter
  - [Chicken 01.wav](https://commons.wikimedia.org/wiki/File:Chicken_01.wav) — CC BY-SA 4.0 — Ganesh Mohan T
  - [XN Strix aluco 003.ogg](https://commons.wikimedia.org/wiki/File:XN_Strix_aluco_003.ogg) — CC BY-SA 3.0 — Guido Gerding
  - [Wood Frogs calling in spring.ogg](https://commons.wikimedia.org/wiki/File:Wood_Frogs_calling_in_spring.ogg) — CC BY-SA 3.0 — D. Gordon E. Robertson
  - [Corvus brachyrhynchos call.ogg](https://commons.wikimedia.org/wiki/File:Corvus_brachyrhynchos_call.ogg) — Public domain — U.S. Geological Survey
  - [Kampfgeschrei Graupapagei.ogg](https://commons.wikimedia.org/wiki/File:Kampfgeschrei_Graupapagei.ogg) — CC BY-SA 3.0 — Oceancetaceen Alice Chodura
  - [Gobbler.ogg](https://commons.wikimedia.org/wiki/File:Gobbler.ogg) — Public domain — bod
  - [Humpback whale moo.ogg](https://commons.wikimedia.org/wiki/File:Humpback_whale_moo.ogg) — Public domain — U.S. National Park Service
  - [Killer whale simple.ogg](https://commons.wikimedia.org/wiki/File:Killer_whale_simple.ogg) — Public domain
  - [Bee buzzing sound (animal noises).opus](https://commons.wikimedia.org/wiki/File:Bee_buzzing_sound_(animal_noises).opus) — CC BY 3.0 — Spanac (Free Sounds Library)
  - [Field cricket Gryllus pennsylvanicus.ogg](https://commons.wikimedia.org/wiki/File:Field_cricket_Gryllus_pennsylvanicus.ogg) — CC BY-SA 3.0 — Thatcher
  - [Cuculus canorus - Common Cuckoo XC537460.mp3](https://commons.wikimedia.org/wiki/File:Cuculus_canorus_-_Common_Cuckoo_XC537460.mp3) — CC BY-SA 4.0 — Benoît Van Hecke
  - [Dove cooing.ogg](https://commons.wikimedia.org/wiki/File:Dove_cooing.ogg) — Public domain — mary905
  - [157763 felix-blume a-donkey-is-braying-in-his-enclosure-in-south-of-france.wav](https://commons.wikimedia.org/wiki/File:157763_felix-blume_a-donkey-is-braying-in-his-enclosure-in-south-of-france.wav) — CC0 — felix-blume
  - [Elephant voice - trumpeting.ogg](https://commons.wikimedia.org/wiki/File:Elephant_voice_-_trumpeting.ogg) — CC0 — தகவலுழவன்
  - [Brown woolly monkey alarm call.wav](https://commons.wikimedia.org/wiki/File:Brown_woolly_monkey_alarm_call.wav) — CC BY-SA 4.0 — Kai Medina
  - [Little Penguin (Eudyptula minor).ogg](https://commons.wikimedia.org/wiki/File:Little_Penguin_(Eudyptula_minor).ogg) — CC BY 3.0 — Benchill
  - [Gull 2.ogg](https://commons.wikimedia.org/wiki/File:Gull_2.ogg) — Public domain — avphillips
  - [Rattlesnake.ogg](https://commons.wikimedia.org/wiki/File:Rattlesnake.ogg) — Public domain
  - [Giggling call of a spotted hyena (Crocuta crocuta) - 1472-6785-10-9-S1.oga](https://commons.wikimedia.org/wiki/File:Giggling_call_of_a_spotted_hyena_(Crocuta_crocuta)_-_1472-6785-10-9-S1.oga) — CC BY 2.0 — Mathevon, Koralek, Weldele, Glickman, Theunissen
  - [Lion raring-sound1TamilNadu178.ogg](https://commons.wikimedia.org/wiki/File:Lion_raring-sound1TamilNadu178.ogg) — Public domain — த*உழவன்
  - [Wolf howls.ogg](https://commons.wikimedia.org/wiki/File:Wolf_howls.ogg) — Public domain
  - [Erithacus rubecula - European Robin XC441752.mp3](https://commons.wikimedia.org/wiki/File:Erithacus_rubecula_-_European_Robin_XC441752.mp3) — CC BY-SA 4.0 — Jan Cibulka
- Music Box songs: traditional nursery songs in the public domain
- Voice: [Piper](https://github.com/rhasspy/piper) voices via [vits-web](https://github.com/diffusion-studio/vits-web)
- Learning levels: Common Core State Standards for Mathematics; Dolch sight word lists
