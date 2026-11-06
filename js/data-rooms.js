/* Fog of Fallacy - the insides of the buildings.

   Press A at a building's door and you step inside: the roof lifts off and the room is
   drawn from a corner, in three-quarter view (js/inside.js). You walk around, and pressing
   A on a thing makes the narrator say a line about it. A few things give a small surprise.

   A room is picked by the building's label (ROOMS.labels), else by its kind (ROOMS.kinds).
   Cells: x runs from the back corner to the right, y from the back corner to the left.
   Things on the floor have a footprint (x, y, w, h). Things on a wall sit outside the floor:
   y: -1 on the back-right wall, x: -1 on the back-left wall. `walk: true` lets you stand on it.
   `intro` is said when you come in; `text` when you press A on the thing; `coins` is a small
   find, once a day; `sfx` is a sound from js/audio.js.

   Writing rules (same as js/data.js): short sentences, every sentence has a verb, words a
   six-year-old can understand. */

(function () {
  const D = window.FOG;

  const common = {
    window: { kind: 'window', text: 'A window. You can see the sky.' },
    clock: { kind: 'clock', text: 'Tick, tock. The clock is a little slow.' },
    picture: { kind: 'picture', text: 'A painting of the river. Someone loves this valley.' },
    plant: { kind: 'plant', text: 'A plant in a pot. Someone waters it every day.' },
    rug: { kind: 'rug', walk: true, text: 'A soft rug. Your feet like it.' },
    cat: { kind: 'cat', sfx: 'talk', text: 'A cat. It yawns at you, then goes back to sleep.' },
    lantern: { kind: 'lantern', text: 'A lantern. It keeps the fog out at night.' }
  };
  const C = (base, more) => Object.assign({}, common[base], more);

  D.ROOMS = {
    kinds: {
      house: {
        w: 8, h: 7, door: 4, floor: 'planks', wall: '#F4E8CC',
        intro: ['A small house. It is warm and quiet in here.'],
        items: [
          C('window', { x: 1, y: -1 }), C('picture', { x: 5, y: -1 }), C('clock', { x: -1, y: 2 }),
          { kind: 'bed', x: 0, y: 0, w: 2, h: 3, text: 'A soft bed. Somebody made it this morning.' },
          { kind: 'chest', x: 0, y: 4, w: 1, h: 1, coins: 2, text: 'A wooden chest. You look inside.' },
          { kind: 'table', x: 3, y: 2, w: 2, h: 2, text: 'A table with two cups. Somebody had tea.' },
          { kind: 'chair', x: 5, y: 2, w: 1, h: 1, text: 'A chair. It wobbles a bit.' },
          { kind: 'chair', x: 2, y: 3, w: 1, h: 1, text: 'A chair. It wobbles a bit.' },
          { kind: 'stove', x: 6, y: 0, w: 2, h: 1, sfx: 'good', text: 'A stove. The kettle is still warm.' },
          { kind: 'shelf', x: 4, y: 0, w: 2, h: 1, text: 'A shelf with jars. Honey, flour, and one jar of buttons.' },
          C('rug', { x: 3, y: 4, w: 3, h: 2 }), C('cat', { x: 6, y: 5, w: 1, h: 1 }), C('plant', { x: 7, y: 3, w: 1, h: 1 })
        ]
      },
      shop: {
        w: 8, h: 6, door: 4, floor: 'tiles', wall: '#FBF1DC',
        intro: ['A shop. It smells of fresh bread and wood.'],
        items: [
          C('window', { x: 2, y: -1 }), { kind: 'sign', x: 5, y: -1, text: 'A sign. It says: fresh today.' },
          { kind: 'counter', x: 2, y: 0, w: 4, h: 1, text: 'The counter. Loaves sit in a row. Your tummy rumbles.' },
          { kind: 'oven', x: 7, y: 0, w: 1, h: 2, sfx: 'hammer', text: 'A big oven. It is still hot. Do not touch!' },
          { kind: 'barrel', x: 0, y: 1, w: 1, h: 1, text: 'A barrel of flour. Achoo!' },
          { kind: 'barrel', x: 0, y: 2, w: 1, h: 1, text: 'A barrel of apples. Red ones.' },
          { kind: 'sack', x: 7, y: 3, w: 1, h: 1, text: 'A sack of sugar. Somebody tasted it already.' },
          { kind: 'sack', x: 7, y: 4, w: 1, h: 1, text: 'A sack of salt. Nobody tasted this one.' },
          { kind: 'scale', x: 0, y: 4, w: 1, h: 1, text: 'A scale. It weighs things, not ideas.' },
          C('cat', { x: 1, y: 3, w: 1, h: 1 })
        ]
      },
      hall: {
        w: 10, h: 7, door: 5, floor: 'stone', wall: '#EDE2D2',
        intro: ['A big hall. Your steps make an echo.'],
        items: [
          { kind: 'banner', x: 2, y: -1, text: 'A banner with a well on it. The sign of the Valley.' },
          { kind: 'banner', x: 6, y: -1, text: 'A banner with a bridge on it. Builders made this town.' },
          C('window', { x: -1, y: 3 }),
          { kind: 'longtable', x: 3, y: 2, w: 4, h: 2, text: 'A long table. Big decisions are made here. With reasons, we hope.' },
          { kind: 'chair', x: 2, y: 2, w: 1, h: 1, text: 'A chair for the mayor.' },
          { kind: 'chair', x: 7, y: 3, w: 1, h: 1, text: 'A chair for a visitor. That is you.' },
          { kind: 'bookcase', x: 0, y: 0, w: 1, h: 3, text: 'Old books. One is about wells. One is about frogs.' },
          { kind: 'bookcase', x: 0, y: 4, w: 1, h: 2, text: 'Maps of the Valley. The river moves a little every year.' },
          { kind: 'podium', x: 8, y: 0, w: 1, h: 1, text: 'A stand for speeches. Say something true.' },
          C('plant', { x: 9, y: 5, w: 1, h: 1 }), C('rug', { x: 3, y: 5, w: 4, h: 1 })
        ]
      },
      barn: {
        w: 9, h: 7, door: 4, floor: 'dirt', wall: '#C98B5B',
        intro: ['A barn. It smells of hay and goats.'],
        items: [
          { kind: 'tools', x: 2, y: -1, text: 'Tools on the wall. A rake, a fork, a shovel.' }, C('lantern', { x: -1, y: 1 }),
          { kind: 'hay', x: 0, y: 0, w: 3, h: 2, text: 'A pile of hay. It is scratchy and warm.' },
          { kind: 'hay', x: 6, y: 0, w: 3, h: 1, text: 'More hay. A mouse looks at you, then hides.' },
          { kind: 'crate', x: 0, y: 3, w: 1, h: 1, text: 'A crate of carrots. The goat knows about it.' },
          { kind: 'crate', x: 0, y: 4, w: 1, h: 1, coins: 1, text: 'A crate of old things. You dig around.' },
          { kind: 'cart', x: 5, y: 3, w: 3, h: 2, text: 'A cart with one wheel. It needs another one.' },
          { kind: 'goat', x: 3, y: 5, w: 1, h: 1, sfx: 'goat', text: 'A goat. It chews. It stares. It chews.' },
          { kind: 'barrel', x: 8, y: 5, w: 1, h: 1, text: 'A barrel of rain water. Cold!' }
        ]
      },
      mine: {
        w: 8, h: 6, door: 4, floor: 'rock', wall: '#8E8A80',
        intro: ['The mine. It is dark and cool. Drip, drip.'],
        items: [
          C('lantern', { x: 2, y: -1 }), { kind: 'picks', x: 5, y: -1, text: 'Picks on the wall. Heavy ones.' },
          { kind: 'cart', x: 0, y: 0, w: 2, h: 2, text: 'A mine cart full of rocks. Some of them shine.' },
          { kind: 'rocks', x: 6, y: 0, w: 2, h: 2, text: 'A heap of rocks. Not gold. Just rocks.' },
          { kind: 'cage', x: 7, y: 4, w: 1, h: 1, sfx: 'bird', text: 'A canary in a cage. It sings when the air is good.' },
          { kind: 'crate', x: 0, y: 4, w: 1, h: 1, coins: 2, text: 'A crate of lamps. Something glints under them.' },
          { kind: 'barrel', x: 3, y: 0, w: 1, h: 1, text: 'A barrel of water for the miners.' }
        ]
      }
    },
    /* Rooms with a name of their own. `kind` picks the base room; everything else replaces it. */
    labels: {
      'Home': { intro: ['Your own house. The fire is small and friendly.', 'You can rest here any time.'] },
      "Elder's": { intro: ["Elder Otto's house. It smells of tea and old paper."], items: [
        C('window', { x: 1, y: -1 }), C('clock', { x: -1, y: 2 }), { kind: 'picture', x: 5, y: -1, text: 'A painting of a young Otto. He had a lot of hair.' },
        { kind: 'bed', x: 0, y: 0, w: 2, h: 3, text: 'A bed with a thick blanket. Old knees get cold.' },
        { kind: 'bookcase', x: 4, y: 0, w: 3, h: 1, text: 'Books about everything. Otto has read them all. Twice.' },
        { kind: 'table', x: 3, y: 3, w: 2, h: 2, text: 'A table with a teapot. Otto drinks six cups a day.' },
        { kind: 'chair', x: 5, y: 3, w: 1, h: 1, text: 'A chair with a cushion. The cushion is the best part.' },
        { kind: 'chest', x: 0, y: 5, w: 1, h: 1, coins: 2, text: "Otto's chest. A note inside says: for the well." },
        C('rug', { x: 2, y: 5, w: 4, h: 2 }), C('plant', { x: 7, y: 4, w: 1, h: 1 }), { kind: 'stove', x: 7, y: 0, w: 1, h: 1, text: 'A small stove, just for the kettle.' }
      ] },
      'Bakery': { intro: ["Hana's bakery. Warm bread, warm air, warm smile."] },
      "Sal's": { intro: ["Old Sal's house. Everything in it is older than you."] },
      'Barn': { intro: ['The barn. The goats are not in here. The goats are never where they should be.'] },
      'Farm': { intro: ["Farmer Idris's house. Boots by the door, mud on the boots."] },
      'Twins': { intro: ["The twins' house. Two of everything. Two beds, two bowls, two muddy footprints."] },
      'Ferry': { kind: 'shop', intro: ["Gus's ferry hut. Ropes, buckets, and a very old boat on the wall."], items: [
        { kind: 'net', x: 2, y: -1, text: 'A fishing net on the wall. It has a hole. Gus says it is for the small fish.' },
        { kind: 'boat', x: 5, y: -1, text: 'A tiny boat on the wall. It is only a picture. The real one leaks.' },
        { kind: 'counter', x: 2, y: 0, w: 3, h: 1, text: 'A counter with a price list. The prices change when Gus is hungry.' },
        { kind: 'barrel', x: 0, y: 1, w: 1, h: 1, text: 'A barrel of rope. Miles of it.' },
        { kind: 'barrel', x: 0, y: 2, w: 1, h: 1, text: 'A barrel of fish. Phew!' },
        { kind: 'crate', x: 7, y: 3, w: 1, h: 1, text: 'Oars. Three oars. Gus has two hands.' },
        { kind: 'chair', x: 6, y: 1, w: 1, h: 1, text: "Gus's chair. It faces the river." },
        C('cat', { x: 3, y: 4, w: 1, h: 1 })
      ] },
      'Town Hall': { intro: ['The Town Hall. Everyone argues here. Some even listen.'] },
      'Inn': { kind: 'shop', intro: ['The inn. Travellers eat, talk and tell tall stories.'], items: [
        C('window', { x: 2, y: -1 }), C('clock', { x: -1, y: 1 }),
        { kind: 'counter', x: 3, y: 0, w: 3, h: 1, text: 'The bar. Soup, bread and news from the road.' },
        { kind: 'barrel', x: 7, y: 0, w: 1, h: 1, text: 'A barrel of apple juice. The good kind.' },
        { kind: 'table', x: 1, y: 2, w: 2, h: 2, text: 'A table with a game of stones on it. Somebody is winning.' },
        { kind: 'chair', x: 0, y: 2, w: 1, h: 1, text: 'A chair. Still warm.' }, { kind: 'chair', x: 3, y: 3, w: 1, h: 1, text: 'A chair with a coat on it.' },
        { kind: 'table', x: 5, y: 3, w: 2, h: 2, text: 'A table for travellers. Crumbs everywhere.' },
        { kind: 'fireplace', x: 7, y: 4, w: 1, h: 2, sfx: 'good', text: 'A fire. Crackle, pop. Your hands get warm.' }
      ] },
      'Shop': { intro: ['The market shop. A bit of everything, and a lot of buttons.'] },
      'Library': { kind: 'hall', intro: ['The library. Shh. The books are listening.'], items: [
        C('window', { x: 4, y: -1 }), C('window', { x: -1, y: 3 }),
        { kind: 'bookcase', x: 0, y: 0, w: 1, h: 3, text: 'Books about rivers and bridges.' },
        { kind: 'bookcase', x: 0, y: 4, w: 1, h: 3, text: 'Books about tricks and how to spot them. Very useful.' },
        { kind: 'bookcase', x: 1, y: 0, w: 3, h: 1, text: 'Books about stars. The three in a row are called the belt.' },
        { kind: 'bookcase', x: 6, y: 0, w: 3, h: 1, text: 'Storybooks. One has a bird on the cover. It looks a lot like the Simurgh.' },
        { kind: 'desk', x: 3, y: 3, w: 2, h: 1, text: 'A reading desk with a big open book. The page says: ask why.' },
        { kind: 'chair', x: 4, y: 4, w: 1, h: 1, text: 'A reading chair. Very comfortable. Very squeaky.' },
        { kind: 'globe', x: 9, y: 0, w: 1, h: 1, text: 'A globe. The Valley is a tiny dot. Can you find it?' },
        { kind: 'desk', x: 7, y: 4, w: 2, h: 1, text: 'The librarian\'s desk. A stamp, a bell, and a very long list.' },
        C('rug', { x: 3, y: 5, w: 4, h: 1 }), C('cat', { x: 8, y: 6, w: 1, h: 1 })
      ] },
      'Mine': { intro: ['The Hill Mine. Lamps on hooks, echoes in the dark.'] },
      'Camp': { kind: 'barn', intro: ["The miners' camp. Bunks, boots and a pot of beans."], items: [
        C('lantern', { x: 2, y: -1 }), { kind: 'tools', x: 6, y: -1, text: 'Helmets on hooks. One for every miner.' },
        { kind: 'bed', x: 0, y: 0, w: 2, h: 2, text: 'A bunk. The blanket is grey with dust.' },
        { kind: 'bed', x: 0, y: 3, w: 2, h: 2, text: 'Another bunk. Somebody snores here. Loudly.' },
        { kind: 'stove', x: 7, y: 0, w: 2, h: 1, sfx: 'good', text: 'A pot of beans on the stove. Beans again.' },
        { kind: 'table', x: 4, y: 2, w: 2, h: 2, text: 'A table with a map of the tunnels. An X marks the ore.' },
        { kind: 'crate', x: 8, y: 4, w: 1, h: 1, coins: 1, text: 'A crate of candles. And something that is not a candle.' },
        { kind: 'chair', x: 3, y: 3, w: 1, h: 1, text: 'A stool. Three legs. Enough.' }
      ] },
      'Shares': { intro: ["Lou's shop. Lou sells shares in things that do not exist yet."] },
      'Harbour Office': { intro: ['The harbour office. Maps, ropes and the smell of salt.'] },
      'Warehouse': { intro: ['The warehouse. Crates to the roof. Well, there is no roof right now.'] },
      'Tavern': { kind: 'shop', intro: ['The tavern. Sailors tell stories here. Most are half true.'], items: [
        C('window', { x: 2, y: -1 }), { kind: 'net', x: 5, y: -1, text: 'A net with a wooden fish in it. The one that got away, they say.' },
        { kind: 'counter', x: 3, y: 0, w: 3, h: 1, text: 'The bar. Fish soup and sea stories.' },
        { kind: 'barrel', x: 7, y: 0, w: 1, h: 1, text: 'A barrel. It sloshes.' }, { kind: 'barrel', x: 7, y: 1, w: 1, h: 1, text: 'Another barrel. It does not slosh. Empty.' },
        { kind: 'table', x: 1, y: 2, w: 2, h: 2, text: 'A table with a map. X marks a spot. Probably a rock.' },
        { kind: 'chair', x: 0, y: 2, w: 1, h: 1, text: "A sailor's chair. It has seen storms." }, { kind: 'chair', x: 3, y: 3, w: 1, h: 1, text: 'A chair with a parrot feather on it.' },
        { kind: 'fireplace', x: 7, y: 4, w: 1, h: 2, sfx: 'good', text: 'A fire. Wet coats dry here.' },
        C('cat', { x: 5, y: 4, w: 1, h: 1 })
      ] },
      'Grey House': { kind: 'house', intro: ['A grey house. Grey chairs, grey cups, grey quiet.'] },
      'Scribe': { kind: 'house', intro: ["The scribe's house. Paper everywhere. Every page says the same thing."] },
      'Grey Bakery': { kind: 'shop', intro: ['The grey bakery. The bread is grey too. It tastes of nothing.'] }
    },
    /* Doors you cannot go through. */
    locked: {
      lodge: { text: ['The door is shut. Grey voices mumble inside.'] },
      palace: { text: ['The palace gates are closed. Something big breathes behind them.'] }
    },
    hint: ['Walk round to the door to go in.']
  };
})();
