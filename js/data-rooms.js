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
    window: { kind: 'window', text: 'A wooden window with four little panes of glass.' },
    clock: { kind: 'clock', text: 'A round wooden clock. Tick, tock.' },
    picture: { kind: 'picture', text: 'A painting of the river in a golden frame.' },
    plant: { kind: 'plant', text: 'A green plant in a red clay pot.' },
    rug: { kind: 'rug', walk: true, text: 'A soft wool rug, red and cream, woven by hand.' },
    cat: { kind: 'cat', sfx: 'talk', text: 'An orange cat, curled up and asleep.' },
    lantern: { kind: 'lantern', text: 'An iron lantern with a warm yellow flame.' }
  };
  const C = (base, more) => Object.assign({}, common[base], more);

  D.ROOMS = {
    kinds: {
      house: {
        w: 8, h: 7, door: 4, floor: 'planks', wall: '#F4E8CC',
        intro: ['A small house with one room, a bed and a stove.'],
        items: [
          C('window', { x: 1, y: -1 }), C('picture', { x: 5, y: -1 }), C('clock', { x: -1, y: 2 }),
          { kind: 'bed', x: 0, y: 0, w: 2, h: 3, text: 'A wooden bed with a blue blanket and a white pillow.' },
          { kind: 'chest', x: 0, y: 4, w: 1, h: 1, coins: 2, text: 'A wooden chest with a brass lock.' },
          { kind: 'table', x: 3, y: 2, w: 2, h: 2, text: 'A wooden table with two tea cups on it.' },
          { kind: 'chair', x: 5, y: 2, w: 1, h: 1, text: 'A wooden chair with a straw seat.' },
          { kind: 'chair', x: 2, y: 3, w: 1, h: 1, text: 'A wooden chair with a straw seat.' },
          { kind: 'stove', x: 6, y: 0, w: 2, h: 1, sfx: 'good', text: 'An iron stove with a kettle on top.' },
          { kind: 'shelf', x: 4, y: 0, w: 2, h: 1, text: 'A shelf of jars: honey, flour, and one jar of buttons.' },
          C('rug', { x: 3, y: 4, w: 3, h: 2 }), C('cat', { x: 6, y: 5, w: 1, h: 1 }), C('plant', { x: 7, y: 3, w: 1, h: 1 })
        ]
      },
      shop: {
        w: 8, h: 6, door: 4, floor: 'tiles', wall: '#FBF1DC',
        intro: ['A bakery shop with a long counter and a big oven.'],
        items: [
          C('window', { x: 2, y: -1 }), { kind: 'sign', x: 5, y: -1, text: 'A painted sign that says: fresh today.' },
          { kind: 'counter', x: 2, y: 0, w: 4, h: 1, text: 'A wooden counter with a row of fresh loaves.' },
          { kind: 'oven', x: 7, y: 0, w: 1, h: 2, sfx: 'hammer', text: 'A big brick oven with a fire glowing inside.' },
          { kind: 'barrel', x: 0, y: 1, w: 1, h: 1, text: 'A wooden barrel full of white flour.' },
          { kind: 'barrel', x: 0, y: 2, w: 1, h: 1, text: 'A wooden barrel full of red apples.' },
          { kind: 'sack', x: 7, y: 3, w: 1, h: 1, text: 'A cloth sack of sugar, tied with string.' },
          { kind: 'sack', x: 7, y: 4, w: 1, h: 1, text: 'A cloth sack of salt, tied with string.' },
          { kind: 'scale', x: 0, y: 4, w: 1, h: 1, text: 'A brass scale with two pans for weighing bread.' },
          C('cat', { x: 1, y: 3, w: 1, h: 1 })
        ]
      },
      hall: {
        w: 10, h: 7, door: 5, floor: 'stone', wall: '#EDE2D2',
        intro: ['A big stone hall with a long table and banners on the walls.'],
        items: [
          { kind: 'banner', x: 2, y: -1, text: 'A purple banner with a golden well, the sign of the Valley.' },
          { kind: 'banner', x: 6, y: -1, text: 'A purple banner with a golden bridge on it.' },
          C('window', { x: -1, y: 3 }),
          { kind: 'longtable', x: 3, y: 2, w: 4, h: 2, text: 'A long oak table where the town makes its decisions.' },
          { kind: 'chair', x: 2, y: 2, w: 1, h: 1, text: 'A tall carved chair for the mayor.' },
          { kind: 'chair', x: 7, y: 3, w: 1, h: 1, text: 'A plain wooden chair for visitors.' },
          { kind: 'bookcase', x: 0, y: 0, w: 1, h: 3, text: 'A bookcase of old books about wells, bridges and frogs.' },
          { kind: 'bookcase', x: 0, y: 4, w: 1, h: 2, text: 'A bookcase of rolled maps of the Valley.' },
          { kind: 'podium', x: 8, y: 0, w: 1, h: 1, text: 'A wooden stand for making speeches.' },
          C('plant', { x: 9, y: 5, w: 1, h: 1 }), C('rug', { x: 3, y: 5, w: 4, h: 1 })
        ]
      },
      barn: {
        w: 9, h: 7, door: 4, floor: 'dirt', wall: '#C98B5B',
        intro: ['A wooden barn with hay, a cart and a goat.'],
        items: [
          { kind: 'tools', x: 2, y: -1, text: 'Farm tools on the wall: a rake, a fork and a shovel.' }, C('lantern', { x: -1, y: 1 }),
          { kind: 'hay', x: 0, y: 0, w: 3, h: 2, text: 'A big golden pile of hay.' },
          { kind: 'hay', x: 6, y: 0, w: 3, h: 1, text: 'A pile of hay with a little mouse peeking out.' },
          { kind: 'crate', x: 0, y: 3, w: 1, h: 1, text: 'A wooden crate full of orange carrots.' },
          { kind: 'crate', x: 0, y: 4, w: 1, h: 1, coins: 1, text: 'A wooden crate of old tools and rope.' },
          { kind: 'cart', x: 5, y: 3, w: 3, h: 2, text: 'A wooden farm cart with one wheel missing.' },
          { kind: 'goat', x: 3, y: 5, w: 1, h: 1, sfx: 'goat', text: 'A white goat with small horns, chewing hay.' },
          { kind: 'barrel', x: 8, y: 5, w: 1, h: 1, text: 'A wooden barrel full of rain water.' }
        ]
      },
      mine: {
        w: 8, h: 6, door: 4, floor: 'rock', wall: '#8E8A80',
        intro: ['A dark mine with lamps on the walls and carts of rock.'],
        items: [
          C('lantern', { x: 2, y: -1 }), { kind: 'picks', x: 5, y: -1, text: 'Heavy iron picks hanging on the wall.' },
          { kind: 'cart', x: 0, y: 0, w: 2, h: 2, text: 'An iron mine cart full of rocks with silver sparkles.' },
          { kind: 'rocks', x: 6, y: 0, w: 2, h: 2, text: 'A heap of grey rocks from the mine.' },
          { kind: 'cage', x: 7, y: 4, w: 1, h: 1, sfx: 'bird', text: 'A yellow canary in a little golden cage.' },
          { kind: 'crate', x: 0, y: 4, w: 1, h: 1, coins: 2, text: 'A wooden crate of miners\' lamps.' },
          { kind: 'barrel', x: 3, y: 0, w: 1, h: 1, text: 'A wooden barrel of drinking water with a tin cup.' }
        ]
      }
    },
    /* Rooms with a name of their own. `kind` picks the base room; everything else replaces it. */
    labels: {
      'Home': { intro: ['Your own little house, with a bed, a table and a warm stove.', 'A quiet place to rest after a long day in the Valley.'] },
      "Elder's": { intro: ["Elder Otto's house, full of books, teapots and cushions."], items: [
        C('window', { x: 1, y: -1 }), C('clock', { x: -1, y: 2 }), { kind: 'picture', x: 5, y: -1, text: 'A painting of Otto as a young man with a big head of hair.' },
        { kind: 'bed', x: 0, y: 0, w: 2, h: 3, text: 'A bed with a thick patchwork blanket.' },
        { kind: 'bookcase', x: 4, y: 0, w: 3, h: 1, text: 'A shelf of fat old books on every subject.' },
        { kind: 'table', x: 3, y: 3, w: 2, h: 2, text: 'A small table with a blue teapot and a cup.' },
        { kind: 'chair', x: 5, y: 3, w: 1, h: 1, text: 'An old armchair with a fat red cushion.' },
        { kind: 'chest', x: 0, y: 5, w: 1, h: 1, coins: 2, text: "Otto's wooden chest with a note that says: for the well." },
        C('rug', { x: 2, y: 5, w: 4, h: 2 }), C('plant', { x: 7, y: 4, w: 1, h: 1 }), { kind: 'stove', x: 7, y: 0, w: 1, h: 1, text: 'A small black stove with a copper kettle.' }
      ] },
      'Bakery': { intro: ["Hana's bakery, with loaves on the counter and a glowing oven."] },
      "Sal's": { intro: ["Old Sal's house, full of old furniture and knitted blankets."] },
      'Barn': { intro: ['The village barn, with hay, a cart and one goat.'] },
      'Farm': { intro: ["Farmer Idris's house, with muddy boots by the door."] },
      'Twins': { intro: ["The twins' house, with two beds, two bowls and two muddy footprints."] },
      'Ferry': { kind: 'shop', intro: ["Gus's ferry hut, full of ropes, buckets and oars."], items: [
        { kind: 'net', x: 2, y: -1, text: 'A fishing net hanging on the wall, with a cork float.' },
        { kind: 'boat', x: 5, y: -1, text: 'A little painting of a boat with a white sail.' },
        { kind: 'counter', x: 2, y: 0, w: 3, h: 1, text: 'A wooden counter with a chalk board of ferry prices.' },
        { kind: 'barrel', x: 0, y: 1, w: 1, h: 1, text: 'A barrel full of coiled rope.' },
        { kind: 'barrel', x: 0, y: 2, w: 1, h: 1, text: 'A barrel of silver fish packed in ice.' },
        { kind: 'crate', x: 7, y: 3, w: 1, h: 1, text: 'Three wooden oars leaning in a crate.' },
        { kind: 'chair', x: 6, y: 1, w: 1, h: 1, text: "Gus's old chair, facing the river." },
        C('cat', { x: 3, y: 4, w: 1, h: 1 })
      ] },
      'Town Hall': { intro: ['The Town Hall, a big stone room with banners and a long table.'] },
      'Inn': { kind: 'shop', intro: ['The inn, with a bar, wooden tables and a crackling fire.'], items: [
        C('window', { x: 2, y: -1 }), C('clock', { x: -1, y: 1 }),
        { kind: 'counter', x: 3, y: 0, w: 3, h: 1, text: 'A wooden bar with bowls of soup and loaves of bread.' },
        { kind: 'barrel', x: 7, y: 0, w: 1, h: 1, text: 'A barrel of apple juice with a wooden tap.' },
        { kind: 'table', x: 1, y: 2, w: 2, h: 2, text: 'A table with a board game of black and white stones.' },
        { kind: 'chair', x: 0, y: 2, w: 1, h: 1, text: 'A wooden chair by the table.' }, { kind: 'chair', x: 3, y: 3, w: 1, h: 1, text: 'A wooden chair with a traveller\'s coat hung over it.' },
        { kind: 'table', x: 5, y: 3, w: 2, h: 2, text: 'A round table with plates, mugs and crumbs.' },
        { kind: 'fireplace', x: 7, y: 4, w: 1, h: 2, sfx: 'good', text: 'A stone fireplace with a crackling fire.' }
      ] },
      'Shop': { intro: ['The market shop, with shelves of jars, cloth and buttons.'] },
      'Library': { kind: 'hall', intro: ['The library, with tall bookcases, a globe and a reading desk.'], items: [
        C('window', { x: 4, y: -1 }), C('window', { x: -1, y: 3 }),
        { kind: 'bookcase', x: 0, y: 0, w: 1, h: 3, text: 'A bookcase of books about rivers and bridges.' },
        { kind: 'bookcase', x: 0, y: 4, w: 1, h: 3, text: 'A bookcase of books about tricks and how to spot them.' },
        { kind: 'bookcase', x: 1, y: 0, w: 3, h: 1, text: 'A shelf of books about the stars, with a chart of Orion\'s belt.' },
        { kind: 'bookcase', x: 6, y: 0, w: 3, h: 1, text: 'A shelf of storybooks, one with a golden bird on the cover.' },
        { kind: 'desk', x: 3, y: 3, w: 2, h: 1, text: 'A reading desk with a big open book that says: ask why.' },
        { kind: 'chair', x: 4, y: 4, w: 1, h: 1, text: 'A soft green reading chair.' },
        { kind: 'globe', x: 9, y: 0, w: 1, h: 1, text: 'A globe of the world on a wooden stand.' },
        { kind: 'desk', x: 7, y: 4, w: 2, h: 1, text: 'The librarian\'s desk with a stamp, a bell and a long list.' },
        C('rug', { x: 3, y: 5, w: 4, h: 1 }), C('cat', { x: 8, y: 6, w: 1, h: 1 })
      ] },
      'Mine': { intro: ['The Hill Mine, with lamps on hooks and carts of shining rock.'] },
      'Camp': { kind: 'barn', intro: ["The miners' camp, with bunks, helmets and a pot of beans."], items: [
        C('lantern', { x: 2, y: -1 }), { kind: 'tools', x: 6, y: -1, text: 'Yellow miners\' helmets hanging on hooks.' },
        { kind: 'bed', x: 0, y: 0, w: 2, h: 2, text: 'A wooden bunk bed with a grey blanket.' },
        { kind: 'bed', x: 0, y: 3, w: 2, h: 2, text: 'A wooden bunk bed with a lumpy pillow.' },
        { kind: 'stove', x: 7, y: 0, w: 2, h: 1, sfx: 'good', text: 'A big iron pot of beans bubbling on the stove.' },
        { kind: 'table', x: 4, y: 2, w: 2, h: 2, text: 'A table with a map of the mine tunnels, marked with an X.' },
        { kind: 'crate', x: 8, y: 4, w: 1, h: 1, coins: 1, text: 'A wooden crate full of white candles.' },
        { kind: 'chair', x: 3, y: 3, w: 1, h: 1, text: 'A small wooden stool with three legs.' }
      ] },
      'Shares': { intro: ["Lou's shop, with a counter full of papers and a big sign."] },
      'Harbour Office': { intro: ['The harbour office, with sea maps, ropes and a brass lamp.'] },
      'Warehouse': { intro: ['The warehouse, stacked high with crates and barrels.'] },
      'Tavern': { kind: 'shop', intro: ['The harbour tavern, with a bar, a fire and nets on the walls.'], items: [
        C('window', { x: 2, y: -1 }), { kind: 'net', x: 5, y: -1, text: 'A fishing net on the wall with a carved wooden fish in it.' },
        { kind: 'counter', x: 3, y: 0, w: 3, h: 1, text: 'A wooden bar with bowls of fish soup.' },
        { kind: 'barrel', x: 7, y: 0, w: 1, h: 1, text: 'A wooden barrel of fresh water.' }, { kind: 'barrel', x: 7, y: 1, w: 1, h: 1, text: 'An empty wooden barrel.' },
        { kind: 'table', x: 1, y: 2, w: 2, h: 2, text: 'A table with a sea map, marked with an X.' },
        { kind: 'chair', x: 0, y: 2, w: 1, h: 1, text: "An old sailor's chair, worn and sturdy." }, { kind: 'chair', x: 3, y: 3, w: 1, h: 1, text: 'A wooden chair with a green parrot feather on it.' },
        { kind: 'fireplace', x: 7, y: 4, w: 1, h: 2, sfx: 'good', text: 'A stone fireplace with coats drying beside it.' },
        C('cat', { x: 5, y: 4, w: 1, h: 1 })
      ] },
      'Grey House': { kind: 'house', intro: ['A grey house, where even the chairs and cups are grey.'] },
      'Scribe': { kind: 'house', intro: ["The scribe's house, with piles of paper and a feather pen."] },
      'Grey Bakery': { kind: 'shop', intro: ['The grey bakery, with grey loaves on a grey counter.'] }
    },
    /* Doors you cannot go through. */
    locked: {
      lodge: { text: ['The door is shut. Grey voices mumble inside.'] },
      palace: { text: ['The palace gates are closed. Something big breathes behind them.'] }
    },
    hint: ['Walk round to the door to go in.']
  };
})();
