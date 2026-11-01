/* Animals for Bumble: facts that grow with your child + real recordings.
   Recordings are from Wikimedia Commons (public domain or Creative Commons; credits in CREDITS below). */
window.BumbleAnimals = (() => {
  'use strict';
  const C = 'https://upload.wikimedia.org/wikipedia/commons/';
  const T = C + 'transcoded/';
  // key -> [url, file title, license, author]
  const SOUNDS = {
    cow: [T + '4/48/Mudchute_cow_1.ogg/Mudchute_cow_1.ogg.mp3', 'Mudchute cow 1.ogg', 'CC BY-SA 3.0', 'Secretlondon'],
    sheep: [T + '2/2a/Mudchute_sheep_1.ogg/Mudchute_sheep_1.ogg.mp3', 'Mudchute sheep 1.ogg', 'CC BY-SA 3.0', 'Secretlondon'],
    lamb: [T + '7/72/Mudchute_lamb_1.ogg/Mudchute_lamb_1.ogg.mp3', 'Mudchute lamb 1.ogg', 'CC BY-SA 3.0', 'Secretlondon'],
    pig: [T + '4/4a/Mudchute_pig_2.ogg/Mudchute_pig_2.ogg.mp3', 'Mudchute pig 2.ogg', 'CC BY-SA 3.0', 'Secretlondon'],
    duck: [T + 'a/a8/Mudchute_duck_1.ogg/Mudchute_duck_1.ogg.mp3', 'Mudchute duck 1.ogg', 'CC BY-SA 3.0', 'Secretlondon'],
    cat: [T + '6/62/Meow.ogg/Meow.ogg.mp3', 'Meow.ogg', 'CC BY-SA 3.0', 'Dcrosby (English Wikipedia)'],
    purr: [T + 'd/db/Purring_cat.oga/Purring_cat.oga.mp3', 'Purring cat.oga', 'Public domain', 'Mysid'],
    dog: [T + 'a/a2/Barking_of_a_dog.ogg/Barking_of_a_dog.ogg.mp3', 'Barking of a dog.ogg', 'CC BY-SA 3.0', 'Amada44'],
    horse: [T + 'd/db/Wiehern.ogg/Wiehern.ogg.mp3', 'Wiehern.ogg', 'Public domain', 'Hü.'],
    rooster: [T + '1/17/Rooster_crowing.oga/Rooster_crowing.oga.mp3', 'Rooster crowing.oga', 'CC BY-SA 3.0', 'Georgethewriter'],
    chicken: [C + '1/14/Chicken_01.wav', 'Chicken 01.wav', 'CC BY-SA 4.0', 'Ganesh Mohan T'],
    owl: [T + '5/58/XN_Strix_aluco_003.ogg/XN_Strix_aluco_003.ogg.mp3', 'XN Strix aluco 003.ogg', 'CC BY-SA 3.0', 'Guido Gerding'],
    frog: [T + 'e/e2/Wood_Frogs_calling_in_spring.ogg/Wood_Frogs_calling_in_spring.ogg.mp3', 'Wood Frogs calling in spring.ogg', 'CC BY-SA 3.0', 'D. Gordon E. Robertson'],
    crow: [T + '8/82/Corvus_brachyrhynchos_call.ogg/Corvus_brachyrhynchos_call.ogg.mp3', 'Corvus brachyrhynchos call.ogg', 'Public domain', 'U.S. Geological Survey'],
    parrot: [T + '3/32/Kampfgeschrei_Graupapagei.ogg/Kampfgeschrei_Graupapagei.ogg.mp3', 'Kampfgeschrei Graupapagei.ogg', 'CC BY-SA 3.0', 'Oceancetaceen Alice Chodura'],
    turkey: [T + '1/11/Gobbler.ogg/Gobbler.ogg.mp3', 'Gobbler.ogg', 'Public domain', 'bod'],
    whale: [T + '6/67/Humpback_whale_moo.ogg/Humpback_whale_moo.ogg.mp3', 'Humpback whale moo.ogg', 'Public domain', 'U.S. National Park Service'],
    orca: [T + '2/21/Killer_whale_simple.ogg/Killer_whale_simple.ogg.mp3', 'Killer whale simple.ogg', 'Public domain', ''],
    bee: [T + '0/0f/Bee_buzzing_sound_%28animal_noises%29.opus/Bee_buzzing_sound_%28animal_noises%29.opus.mp3', 'Bee buzzing sound (animal noises).opus', 'CC BY 3.0', 'Spanac (Free Sounds Library)'],
    cricket: [T + '8/80/Field_cricket_Gryllus_pennsylvanicus.ogg/Field_cricket_Gryllus_pennsylvanicus.ogg.mp3', 'Field cricket Gryllus pennsylvanicus.ogg', 'CC BY-SA 3.0', 'Thatcher'],
    cuckoo: [C + 'f/f9/Cuculus_canorus_-_Common_Cuckoo_XC537460.mp3', 'Cuculus canorus - Common Cuckoo XC537460.mp3', 'CC BY-SA 4.0', 'Benoît Van Hecke'],
    dove: [T + '0/05/Dove_cooing.ogg/Dove_cooing.ogg.mp3', 'Dove cooing.ogg', 'Public domain', 'mary905'],
    donkey: [C + '2/25/157763_felix-blume_a-donkey-is-braying-in-his-enclosure-in-south-of-france.wav', '157763 felix-blume a-donkey-is-braying-in-his-enclosure-in-south-of-france.wav', 'CC0', 'felix-blume'],
    elephant: [T + '4/40/Elephant_voice_-_trumpeting.ogg/Elephant_voice_-_trumpeting.ogg.mp3', 'Elephant voice - trumpeting.ogg', 'CC0', 'தகவலுழவன்'],
    monkey: [C + '1/16/Brown_woolly_monkey_alarm_call.wav', 'Brown woolly monkey alarm call.wav', 'CC BY-SA 4.0', 'Kai Medina'],
    penguin: [T + '2/2c/Little_Penguin_%28Eudyptula_minor%29.ogg/Little_Penguin_%28Eudyptula_minor%29.ogg.mp3', 'Little Penguin (Eudyptula minor).ogg', 'CC BY 3.0', 'Benchill'],
    seagull: [T + 'c/c6/Gull_2.ogg/Gull_2.ogg.mp3', 'Gull 2.ogg', 'Public domain', 'avphillips'],
    snake: [T + '2/22/Rattlesnake.ogg/Rattlesnake.ogg.mp3', 'Rattlesnake.ogg', 'Public domain', ''],
    hyena: [T + 'c/cc/Giggling_call_of_a_spotted_hyena_%28Crocuta_crocuta%29_-_1472-6785-10-9-S1.oga/Giggling_call_of_a_spotted_hyena_%28Crocuta_crocuta%29_-_1472-6785-10-9-S1.oga.mp3', 'Giggling call of a spotted hyena (Crocuta crocuta) - 1472-6785-10-9-S1.oga', 'CC BY 2.0', 'Mathevon, Koralek, Weldele, Glickman, Theunissen'],
    lion: [T + '7/7d/Lion_raring-sound1TamilNadu178.ogg/Lion_raring-sound1TamilNadu178.ogg.mp3', 'Lion raring-sound1TamilNadu178.ogg', 'Public domain', 'த*உழவன்'],
    wolf: [T + '8/87/Wolf_howls.ogg/Wolf_howls.ogg.mp3', 'Wolf howls.ogg', 'Public domain', ''],
    bird: [C + 'f/fa/Erithacus_rubecula_-_European_Robin_XC441752.mp3', 'Erithacus rubecula - European Robin XC441752.mp3', 'CC BY-SA 4.0', 'Jan Cibulka'],
  };

  /* e: emoji, n: name, s: what it says, snd: real recording key, baby, eats, home, facts: [easy, ...harder] */
  const A = [
    { e: '🐶', n: 'dog', s: 'woof woof', snd: 'dog', w: ['puppy', 'doggy', 'doggie', 'woof'], baby: 'puppy', eats: 'dog food and bones', home: 'with people', facts: ['Dogs wag their tails when they are happy.', 'Dogs smell things much better than people can.', 'Dogs pant to cool down because they can not sweat like we do.'] },
    { e: '🐱', n: 'cat', s: 'meow', snd: 'cat', w: ['kitty', 'kitten', 'meow'], baby: 'kitten', eats: 'fish and cat food', home: 'with people', facts: ['Cats purr when they are happy.', 'Cats sleep for most of the day.', 'Cats use their whiskers to feel where they can fit.'] },
    { e: '🐮', n: 'cow', s: 'moo', snd: 'cow', w: ['moo'], baby: 'calf', eats: 'grass and hay', home: 'on a farm', facts: ['Cows give us milk.', 'Cows have four stomach parts to help eat grass.', 'Cows chew their food again later. That is called chewing the cud.'] },
    { e: '🐴', n: 'horse', s: 'neigh', snd: 'horse', w: ['pony', 'neigh'], baby: 'foal', eats: 'grass, hay and carrots', home: 'on a farm', facts: ['Horses can run very fast.', 'Horses can sleep standing up.', 'A horse\'s height is measured in hands.'] },
    { e: '🐷', n: 'pig', s: 'oink oink', snd: 'pig', w: ['piggy', 'oink'], baby: 'piglet', eats: 'almost everything', home: 'on a farm', facts: ['Pigs roll in mud to stay cool.', 'Pigs are very smart animals.', 'Pigs use their snouts to dig for food.'] },
    { e: '🐑', n: 'sheep', s: 'baa baa', snd: 'sheep', w: ['baa', 'lamb'], baby: 'lamb', eats: 'grass', home: 'on a farm', facts: ['Sheep have soft wool.', 'We make warm sweaters from sheep wool.', 'Sheep like to stay together in a group called a flock.'] },
    { e: '🐐', n: 'goat', s: 'maa maa', snd: null, w: ['maa'], baby: 'kid', eats: 'grass and leaves', home: 'on farms and mountains', facts: ['Goats love to climb.', 'Goats have little beards.', 'Baby goats are called kids, just like you!'] },
    { e: '🐔', n: 'chicken', s: 'cluck cluck', snd: 'chicken', w: ['cluck', 'hen'], baby: 'chick', eats: 'seeds and bugs', home: 'on a farm', facts: ['Chickens lay eggs.', 'A mommy chicken is called a hen.', 'Chickens take little dust baths to stay clean.'] },
    { e: '🐓', n: 'rooster', s: 'cock-a-doodle-doo', snd: 'rooster', w: ['cock a doodle', 'doodle'], baby: 'chick', eats: 'seeds and bugs', home: 'on a farm', facts: ['Roosters crow in the morning.', 'A rooster is a daddy chicken.', 'Roosters have a red comb on their heads.'] },
    { e: '🦆', n: 'duck', s: 'quack quack', snd: 'duck', w: ['ducky', 'quack'], baby: 'duckling', eats: 'plants, bugs and seeds', home: 'near ponds', facts: ['Ducks love to swim.', 'Ducks have webbed feet to paddle in water.', 'Duck feathers are waterproof, so they stay dry.'] },
    { e: '🦃', n: 'turkey', s: 'gobble gobble', snd: 'turkey', w: ['gobble'], baby: 'poult', eats: 'seeds, nuts and bugs', home: 'in forests and farms', facts: ['Turkeys say gobble gobble.', 'Turkeys can fly short distances.', 'The red skin under a turkey\'s beak is called a wattle.'] },
    { e: '🫏', n: 'donkey', s: 'hee haw', snd: 'donkey', w: ['hee haw'], baby: 'foal', eats: 'grass and hay', home: 'on farms', facts: ['Donkeys have big long ears.', 'Donkeys can carry heavy things.', 'Donkeys remember places for a very long time.'] },
    { e: '🐰', n: 'rabbit', s: 'sniff sniff', snd: null, w: ['bunny', 'bunnies'], baby: 'kit', eats: 'grass and carrots', home: 'in burrows', facts: ['Bunnies hop on their strong back legs.', 'Rabbits have long ears to hear well.', 'A rabbit\'s teeth never stop growing.'] },
    { e: '🐭', n: 'mouse', s: 'squeak squeak', snd: null, w: ['squeak', 'mice'], baby: 'pup', eats: 'seeds and cheese', home: 'in small holes', facts: ['Mice are very small.', 'Mice have long tails.', 'Mice can squeeze through tiny holes.'] },
    { e: '🦉', n: 'owl', s: 'hoo hoo', snd: 'owl', w: ['hoo'], baby: 'owlet', eats: 'mice and bugs', home: 'in trees', facts: ['Owls are awake at night.', 'Owls can turn their heads almost all the way around.', 'Owls fly very quietly.'] },
    { e: '🐸', n: 'frog', s: 'ribbit', snd: 'frog', w: ['froggy', 'ribbit'], baby: 'tadpole', eats: 'bugs', home: 'near ponds', facts: ['Frogs jump very far.', 'Frogs catch bugs with their long sticky tongues.', 'Baby frogs are tadpoles. They live in water and have tails.'] },
    { e: '🐝', n: 'bee', s: 'buzz buzz', snd: 'bee', w: ['buzz', 'bumble'], baby: 'larva', eats: 'nectar from flowers', home: 'in a hive', facts: ['Bees make honey.', 'Bees help flowers grow.', 'Bees dance to tell other bees where flowers are.'] },
    { e: '🦗', n: 'cricket', s: 'chirp chirp', snd: 'cricket', w: ['chirp'], baby: 'nymph', eats: 'plants', home: 'in the grass', facts: ['Crickets chirp at night.', 'Crickets chirp by rubbing their wings together.', 'Crickets have ears on their legs!'] },
    { e: '🐦‍⬛', n: 'crow', s: 'caw caw', snd: 'crow', w: ['caw'], baby: 'chick', eats: 'almost anything', home: 'in trees', facts: ['Crows are black birds.', 'Crows are very smart.', 'Crows can remember people\'s faces.'] },
    { e: '🦜', n: 'parrot', s: 'squawk', snd: 'parrot', w: ['squawk'], baby: 'chick', eats: 'seeds and fruit', home: 'in the rainforest', facts: ['Parrots are very colorful.', 'Some parrots can copy words people say.', 'Parrots use their feet to hold food.'] },
    { e: '🕊️', n: 'dove', s: 'coo coo', snd: 'dove', w: ['coo', 'pigeon'], baby: 'squab', eats: 'seeds', home: 'in trees and towns', facts: ['Doves say coo coo.', 'White doves mean peace.', 'Doves drink by sucking water up like a straw.'] },
    { e: '🐦', n: 'bird', s: 'tweet tweet', snd: 'bird', w: ['birdie', 'tweet', 'robin'], baby: 'chick', eats: 'seeds and worms', home: 'in nests', facts: ['Birds have feathers and wings.', 'Birds build nests for their eggs.', 'Birds sing to talk to each other.'] },
    { e: '🕰️', n: 'cuckoo', s: 'cuckoo', snd: 'cuckoo', w: ['cuckoo'], baby: 'chick', eats: 'caterpillars', home: 'in forests', facts: ['The cuckoo says its own name!', 'Cuckoo clocks copy this bird\'s song.', 'Cuckoos fly very far every year.'] },
    { e: '🐧', n: 'penguin', s: 'honk honk', snd: 'penguin', w: ['honk'], baby: 'chick', eats: 'fish', home: 'where it is cold', facts: ['Penguins can not fly, but they swim very well.', 'Penguins waddle when they walk.', 'Daddy penguins help keep the eggs warm.'] },
    { e: '🦭', n: 'seal', s: 'arf arf', snd: null, w: ['arf'], baby: 'pup', eats: 'fish', home: 'in the ocean', facts: ['Seals love to swim.', 'Seals have flippers.', 'Seals keep warm with a thick layer of fat called blubber.'] },
    { e: '🐦', n: 'seagull', s: 'kee-ow', snd: 'seagull', w: ['gull', 'seagull'], baby: 'chick', eats: 'fish', home: 'at the beach', facts: ['Seagulls live by the sea.', 'Seagulls are great at gliding in the wind.', 'Seagulls can drink salty water.'] },
    { e: '🦁', n: 'lion', s: 'roar', snd: 'lion', w: ['roar'], baby: 'cub', eats: 'meat', home: 'on the grassland', facts: ['Lions roar very loud.', 'A daddy lion has a big fluffy mane.', 'Lions live in family groups called prides.'] },
    { e: '🐯', n: 'tiger', s: 'grrr', snd: null, w: ['grr'], baby: 'cub', eats: 'meat', home: 'in the jungle', facts: ['Tigers have orange fur and black stripes.', 'No two tigers have the same stripes.', 'Tigers love to swim.'] },
    { e: '🐘', n: 'elephant', s: 'pawoo', snd: 'elephant', w: ['trumpet'], baby: 'calf', eats: 'grass, leaves and fruit', home: 'in Africa and Asia', facts: ['Elephants have long trunks.', 'Elephants use their trunks to drink and grab food.', 'Elephants are the biggest animals that live on land.'] },
    { e: '🐵', n: 'monkey', s: 'ooh ooh ah ah', snd: 'monkey', w: ['ooh ooh'], baby: 'baby', eats: 'fruit and leaves', home: 'in trees', facts: ['Monkeys love bananas.', 'Monkeys swing from tree to tree.', 'Some monkeys hold on with their tails.'] },
    { e: '🦒', n: 'giraffe', s: 'hum', snd: null, w: [], baby: 'calf', eats: 'leaves from tall trees', home: 'on the grassland', facts: ['Giraffes have very long necks.', 'Giraffes are the tallest animals in the world.', 'A giraffe\'s tongue is purple and very long.'] },
    { e: '🦓', n: 'zebra', s: 'neigh', snd: null, w: [], baby: 'foal', eats: 'grass', home: 'on the grassland', facts: ['Zebras have black and white stripes.', 'Zebras are cousins of horses.', 'Every zebra has its own stripe pattern.'] },
    { e: '🦛', n: 'hippo', s: 'grunt', snd: null, w: ['hippopotamus'], baby: 'calf', eats: 'grass', home: 'in rivers', facts: ['Hippos love the water.', 'Hippos have very big mouths.', 'Hippos can hold their breath under water for minutes.'] },
    { e: '🐊', n: 'crocodile', s: 'snap snap', snd: null, w: ['alligator', 'croc'], baby: 'hatchling', eats: 'fish and meat', home: 'in rivers', facts: ['Crocodiles have lots of sharp teeth.', 'Crocodiles can float like a log.', 'Baby crocodiles hatch from eggs.'] },
    { e: '🐺', n: 'wolf', s: 'awoooo', snd: 'wolf', w: ['howl', 'awoo'], baby: 'pup', eats: 'meat', home: 'in forests', facts: ['Wolves howl to talk to their family.', 'Wolves live in groups called packs.', 'Dogs are cousins of wolves.'] },
    { e: '🐻', n: 'bear', s: 'grrr', snd: null, w: ['teddy'], baby: 'cub', eats: 'berries, fish and honey', home: 'in forests', facts: ['Bears love honey, just like Bumble!', 'Some bears sleep all winter. That is called hibernating.', 'Bears are great at catching fish.'] },
    { e: '🐍', n: 'snake', s: 'hiss', snd: 'snake', w: ['hiss'], baby: 'snakelet', eats: 'mice and bugs', home: 'in grass and trees', facts: ['Snakes have no legs.', 'Snakes smell with their tongues.', 'A rattlesnake shakes its tail to say stay away. Listen!'] },
    { e: '🐳', n: 'whale', s: 'woooo', snd: 'whale', w: ['humpback'], baby: 'calf', eats: 'tiny sea creatures', home: 'in the ocean', facts: ['Whales are very, very big.', 'Whales sing long songs under the water.', 'Whales breathe air through a blowhole on top of their heads.'] },
    { e: '🐋', n: 'orca', s: 'whistle', snd: 'orca', w: ['killer whale'], baby: 'calf', eats: 'fish and seals', home: 'in the ocean', facts: ['Orcas are black and white.', 'Orcas whistle and click to talk.', 'Orcas live with their family their whole lives.'] },
    { e: '🐬', n: 'dolphin', s: 'click click', snd: null, w: [], baby: 'calf', eats: 'fish', home: 'in the ocean', facts: ['Dolphins love to jump and play.', 'Dolphins are very smart.', 'Dolphins find food by listening to echoes.'] },
    { e: '🐟', n: 'fish', s: 'blub blub', snd: null, w: ['fishy'], baby: 'fry', eats: 'tiny plants and bugs', home: 'in water', facts: ['Fish swim in water.', 'Fish breathe with gills.', 'Some fish change color.'] },
    { e: '🐢', n: 'turtle', s: 'nothing at all', snd: null, w: ['tortoise'], baby: 'hatchling', eats: 'plants and bugs', home: 'in ponds and the sea', facts: ['Turtles carry their home on their back.', 'Turtles can hide inside their shell.', 'Some turtles live more than 100 years.'] },
    { e: '🦋', n: 'butterfly', s: 'flutter flutter', snd: null, w: [], baby: 'caterpillar', eats: 'nectar from flowers', home: 'in gardens', facts: ['Butterflies have colorful wings.', 'A caterpillar turns into a butterfly.', 'Butterflies taste with their feet!'] },
    { e: '🦘', n: 'kangaroo', s: 'boing boing', snd: null, w: [], baby: 'joey', eats: 'grass', home: 'in Australia', facts: ['Kangaroos hop on big feet.', 'Baby kangaroos ride in their mommy\'s pouch.', 'Kangaroos use their tail for balance.'] },
    { e: '🐨', n: 'koala', s: 'grunt', snd: null, w: [], baby: 'joey', eats: 'eucalyptus leaves', home: 'in Australia', facts: ['Koalas love to hug trees.', 'Koalas sleep most of the day.', 'Koalas almost never drink water. They get it from leaves.'] },
    { e: '🦔', n: 'hedgehog', s: 'snuffle', snd: null, w: [], baby: 'hoglet', eats: 'bugs and worms', home: 'in gardens', facts: ['Hedgehogs are covered in spikes.', 'Hedgehogs roll into a ball to stay safe.', 'Hedgehogs come out at night.'] },
    { e: '🦊', n: 'fox', s: 'yip yip', snd: null, w: [], baby: 'kit', eats: 'mice and berries', home: 'in forests', facts: ['Foxes have big fluffy tails.', 'Foxes are very good at hearing.', 'Foxes use their tails like a warm blanket.'] },
    { e: '🦝', n: 'raccoon', s: 'chitter', snd: null, w: [], baby: 'kit', eats: 'almost anything', home: 'in trees', facts: ['Raccoons have a mask on their face.', 'Raccoons use their hands like we do.', 'Raccoons like to wash their food.'] },
    { e: '🐾', n: 'hyena', s: 'hee hee hee', snd: 'hyena', w: [], baby: 'cub', eats: 'meat', home: 'in Africa', facts: ['Hyenas sound like they are giggling!', 'Hyenas have very strong jaws.', 'Hyenas live in groups called clans.'] },
  ];

  let player = null;
  let stopT = null;
  /* Play the real recording (up to maxSec). Resolves when done. */
  function playSound(a, maxSec = 6) {
    stop();
    const s = a && a.snd && SOUNDS[a.snd];
    if (!s) return Promise.resolve(false);
    return new Promise((resolve) => {
      const au = new Audio(s[0]);
      player = au;
      let done = false;
      const finish = (ok) => { if (done) return; done = true; clearTimeout(stopT); try { au.pause(); } catch (e) {} if (player === au) player = null; resolve(ok); };
      au.onended = () => finish(true);
      au.onerror = () => finish(false);
      au.onplaying = () => { stopT = setTimeout(() => {
        // gentle fade out
        let v = 1; const f = setInterval(() => { v -= 0.1; if (v <= 0 || done) { clearInterval(f); finish(true); } else au.volume = Math.max(0, v); }, 60);
      }, maxSec * 1000); };
      au.play().catch(() => finish(false));
      setTimeout(() => finish(false), (maxSec + 6) * 1000);
    });
  }
  function stop() { if (player) { try { player.pause(); } catch (e) {} player = null; } clearTimeout(stopT); }
  function unlock() { try { const a = new Audio(); a.muted = true; a.play().catch(() => {}); } catch (e) {} }

  const find = (text) => {
    const t = ' ' + String(text || '').toLowerCase() + ' ';
    return A.find((a) => new RegExp('\\b' + a.n + 's?\\b').test(t) || a.w.some((w) => new RegExp('\\b' + w + '\\b').test(t))) || null;
  };

  const CREDITS = Object.values(SOUNDS).map(([url, title, lic, by]) => ({ title, lic, by, page: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(title.replace(/ /g, '_')) }));

  return { LIST: A, SOUNDS, playSound, stop, unlock, find, CREDITS };
})();
