/* Fog of Fallacy - story data for the Valley.
   You arrive with a pouch of coins. Tricksters use bad arguments to take them.
   Small jobs earn coins. Experts know their craft but their heads are fogged with
   fallacies; clear the fog and they will work for you. Each level's mission is a
   building that opens the next part of the map and pays you back over time.

   Writing rules for this file: short sentences, every sentence has a verb, words a
   seven-year-old can read. The right answer must never be the longest option. */

window.FOG = (function () {

  /* ---------------- fallacies ---------------- */
  const FALLACIES = [
    { id: 'bandwagon', nick: "Everyone's Doing It", icon: '👣', img: 'img/trick-bandwagon.jpg',
      one: 'Somebody says a thing is right because everybody does it.', spot: 'Lots of people can be wrong together. Ask for the real reason.' },
    { id: 'falseDilemma', nick: 'Only Two Doors', icon: '🚪', img: 'img/trick-falseDilemma.jpg',
      one: 'Somebody says you must pick this or that, and nothing else.', spot: 'Look for a third door. There almost always is one.' },
    { id: 'emotion', nick: 'The Tear Trick', icon: '😢', img: 'img/trick-emotion.jpg',
      one: 'Somebody uses sad or scary feelings to push you.', spot: 'Feelings are real, but they are not reasons. Ask what is true.' },
    { id: 'postHoc', nick: 'The Lucky Socks', icon: '🧦', img: 'img/trick-postHoc.jpg',
      one: 'Somebody says one thing caused another only because it came first.', spot: 'Coming first does not mean causing. Ask what else changed.' },
    { id: 'gambler', nick: 'The Hot Streak', icon: '🎲', img: null,
      one: 'Somebody says a win must come soon because they lost many times.', spot: 'Dice and cards do not remember. Every roll starts fresh.' },
    { id: 'sunkCost', nick: 'Already Paid', icon: '🕳️', img: null,
      one: 'Somebody says you must keep paying because you already paid a lot.', spot: 'Money you spent is gone. Only ask if the next coin is worth it.' },
    { id: 'hastyGen', nick: 'The Big Jump', icon: '🦘', img: 'img/trick-hastyGen.jpg',
      one: 'Somebody meets one person and decides everybody like them is the same.', spot: 'One person is not everyone. Judge each person by what they do.' },
    { id: 'adHominem', nick: 'The Insult Trick', icon: '🗯️', img: 'img/trick-adHominem.jpg',
      one: 'Somebody attacks the person instead of answering what they said.', spot: 'Who says something does not make it right or wrong. Look at the idea.' },
    { id: 'strawMan', nick: 'The Scarecrow', icon: '🌾', img: 'img/trick-strawMan.jpg',
      one: 'Somebody twists what you said into something silly, then knocks it down.', spot: 'Ask yourself: is that really what I said?' },
    { id: 'redHerring', nick: 'Look Over There!', icon: '👉', img: 'img/trick-redHerring.jpg',
      one: 'Somebody changes the subject so they do not have to answer.', spot: 'Ask yourself: did they answer my question?' },
    { id: 'authority', nick: 'Big Hat Says', icon: '🎩', img: null,
      one: 'Somebody says a thing is true because an important person said it.', spot: 'Important people need reasons too. Ask for the proof.' },
    { id: 'slipperySlope', nick: 'The Big Slide', icon: '🛝', img: null,
      one: 'Somebody says one small step will surely lead to something terrible.', spot: 'Every step needs its own proof. One step is not a slide.' },
    { id: 'tradition', nick: 'Always Done It', icon: '🏺', img: null,
      one: 'Somebody says the old way is best because it is the old way.', spot: 'Old does not mean right. Ask if it still works.' }
  ];

  const LOOKS = [
    { size: 'm', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'long', shirt: '#FF7B6B', pants: '#3E5C8A' },
    { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'curly', shirt: '#F6B544', pants: '#3E5C8A' },
    { size: 'm', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'bun', shirt: '#63C48F', pants: '#5B4F47' },
    { size: 'm', skin: '#C68B59', hair: '#2A2420', hairStyle: 'short', shirt: '#7FA8F0', pants: '#3E5C8A' }
  ];

  const ROLES = {
    water: { name: 'Water engineer', icon: '💧' }, mason: { name: 'Mason', icon: '🧱' }, carpenter: { name: 'Carpenter', icon: '🪚' },
    surveyor: { name: 'Surveyor', icon: '📐' }, scholar: { name: 'Scholar', icon: '📚' }, millwright: { name: 'Millwright', icon: '⚙️' }, smith: { name: 'Smith', icon: '🔨' }
  };
  const XP_LEVELS = [0, 100, 250, 450, 700];   // xp needed for level 1..5
  const START_MONEY = 40;

  /* ---------------- levels ---------------- */
  const LEVELS = [
    { region: 0, focus: ['bandwagon'], mission: 'well', start: { x: 4, y: 6 },
      intro: ['You arrive in Riverside Village. You have 40 coins in your pouch.', 'A grey fog hangs over the valley. The fog grows every time a bad argument wins.',
        'Use the arrows to walk. Press A to talk. People with a ! above their head want something from you.', 'Earn coins by doing jobs. Keep your coins away from tricksters. Then build something that helps everyone.'] },
    { region: 1, focus: ['falseDilemma'], mission: 'bridge',
      intro: ['The gate swings open. You walk into River Farms.', 'People here love to say there are only two choices. There are almost always more.', 'The farmers need a way across the river. Find a carpenter and a surveyor to help you.'] },
    { region: 2, focus: ['emotion', 'postHoc'], mission: 'school',
      intro: ['You cross your new bridge and walk into Market Town.', 'Two tricks live here. Some people push on your feelings. Others say "this came first, so it caused that."', 'The town wants an Engineering School. Experts learn faster when they train there.'] },
    { region: 3, focus: ['gambler', 'sunkCost', 'hastyGen'], mission: 'mill',
      intro: ['The students cleared the rockfall. The road to the Hill Mine is open.', 'Hold on to your pouch. Gamblers here believe luck is "due". Sellers say you must keep paying because you already paid.', 'The miners need a waterwheel mill on the river to crush their ore.'] },
    { region: 4, focus: ['authority', 'slipperySlope', 'strawMan', 'redHerring', 'tradition', 'adHominem'], mission: 'lighthouse',
      intro: ['The harbour wall opens. You smell salt and hear the gulls.', 'Every trick you have ever heard lives here, all at once.', 'Ships crash on the rocks every winter. Build a lighthouse, and the fog will lift from the whole Valley.'] }
  ];

  /* ---------------- missions (buildings) ---------------- */
  const MISSIONS = [
    { id: 'well', kind: 'well', name: 'The Village Well', region: 0, site: { x: 14, y: 12, w: 2, h: 2 }, camp: [[16, 12], [16, 13], [14, 11], [15, 11]], cost: 60, buildSec: 15, xp: 100, unlocks: 1,
      needs: [{ role: 'water', level: 1 }, { role: 'mason', level: 1 }], income: { rate: 3, cap: 30 },
      blurb: 'The village drinks muddy river water. A well in the square would give clean water. People will pay a coin to fill their buckets.',
      done: ['Clean water bubbles up from the ground. The whole village cheers.', 'Elder Otto opens the south gate. He says, "River Farms could use a builder like you."'] },
    { id: 'bridge', kind: 'bridge', name: 'The River Bridge', region: 1, site: { x: 27, y: 42, w: 4, h: 2 }, camp: [[25, 41], [24, 41], [26, 44], [23, 44]], cost: 100, buildSec: 18, xp: 120, unlocks: 2, walkWhenBuilt: true,
      needs: [{ role: 'carpenter', level: 1 }, { role: 'surveyor', level: 1 }], income: { rate: 4, cap: 40 },
      blurb: 'The ferry is the only way across, and the ferryman charges what he likes. A bridge would carry carts, and a small toll would pay you back.',
      done: ['The last plank drops into place. Carts roll across the river for the first time.', 'Ferryman Gus grumbles. Everyone else is delighted. Market Town lies ahead.'] },
    { id: 'school', kind: 'school', name: 'Engineering School', region: 2, site: { x: 50, y: 33, w: 4, h: 4 }, camp: [[49, 34], [49, 35], [54, 34], [54, 35]], cost: 150, buildSec: 20, xp: 150, unlocks: 3,
      needs: [{ role: 'mason', level: 2 }, { role: 'carpenter', level: 2 }, { role: 'scholar', level: 1 }], income: { rate: 8, cap: 80 },
      blurb: 'Market Town has clever young people and nobody to teach them. A school earns fees, and your crew can train there to learn faster.',
      done: ['The school bell rings. Students run in with their notebooks.', 'The first class measures the rockfall north of town and clears a path to the Hill Mine.'] },
    { id: 'mill', kind: 'mill', name: 'The Waterwheel Mill', region: 3, site: { x: 31, y: 18, w: 3, h: 4 }, camp: [[34, 20], [34, 17], [32, 22], [33, 22]], cost: 220, buildSec: 22, xp: 180, unlocks: 4,
      needs: [{ role: 'millwright', level: 1 }, { role: 'mason', level: 3 }, { role: 'carpenter', level: 3 }], income: { rate: 12, cap: 120 },
      blurb: 'The miners crush ore by hand, and it takes forever. A waterwheel would do it a hundred times faster. The mine will pay well for it.',
      done: ['The wheel turns. The ore crunches. The miners whoop and throw their hats.', 'The foreman unlocks the harbour wall. She says, "Go on. The coast needs you more than we do."'] },
    { id: 'lighthouse', kind: 'lighthouse', name: 'The Lighthouse', region: 4, site: { x: 44, y: 77, w: 2, h: 3 }, camp: [[43, 69], [42, 69], [47, 68], [48, 68]], cost: 320, buildSec: 25, xp: 200, unlocks: 5,
      needs: [{ role: 'smith', level: 1 }, { role: 'mason', level: 4 }, { role: 'surveyor', level: 2 }, { role: 'millwright', level: 2 }], income: { rate: 0, cap: 0 },
      blurb: 'Ships crash on the rocks every winter. A lighthouse at the end of the pier would guide them home. It would also lift the fog from the whole Valley.',
      done: ['The great lamp flares. Its beam sweeps across the sea.', 'All over the Valley, the fog thins and then vanishes. Clear heads make clear skies.'] }
  ];

  /* ---------------- tasks (one-time paid work) and jobs (repeatable) ---------------- */
  const TASKS = {
    // village
    bread: { giver: 'hana', kind: 'deliver', target: 'idris', pay: 12, title: 'Bread for the barn',
      offer: ['Farmer Idris ordered six loaves, but I cannot leave my oven.', 'Please carry them to his barn in the south-east. He will pay you 12 coins.'],
      accept: 'Here you go. They are still warm. Mind the goats!', active: ['Idris waits by the barn in the south-east. Go down the lane and turn left.'],
      deliver: ['You brought the bread! You saved my lunch. Here are 12 coins, as I promised.'], done: ['Idris told me the bread was perfect. You run fast.'] },
    goat: { giver: 'sal', kind: 'spot', target: 'goat', pay: 10, title: 'The lost goat',
      offer: ['My goat Pickle ran off again. She likes the trees behind the barn.', 'Please bring her home. I will give you 10 coins.'],
      accept: 'She is white and she wears a bell. Listen for it.', active: ['Pickle likes the trees behind the barn, in the far south-east corner.'],
      found: ['You find Pickle chewing a bush behind the barn.', 'You take her bell in your hand and lead her home.'], reward: ['You found Pickle! Here are 10 coins. You earned them.'], done: ['Pickle has stayed home since you found her. Thank you.'] },
    fence: { giver: 'idris', kind: 'spot', target: 'brokenfence', pay: 12, title: 'The broken fence',
      offer: ['The goats knocked down my fence on the west side of the field.', 'Please fix the rails. I will pay you 12 coins.'],
      accept: 'I left a hammer and nails by the gap. Mind your thumbs.', active: ['The gap is on the west side of my field, next to the square.'],
      found: ['You line up the rails and hammer them straight.', 'The fence looks as good as new.'], reward: ['That fence is straighter than the one I built! Here are 12 coins.'], done: ['The fence is holding. The goats are furious.'] },
    // farms
    apples: { giver: 'pia', kind: 'spot', target: 'apples', pay: 30, title: 'Apple harvest',
      offer: ['The trees are dropping apples faster than I can pick them.', 'Please fill the basket in the orchard, to the north-west. I will pay you 30 coins.'],
      accept: 'The basket sits under the trees. Fill it right to the top.', active: ['The orchard is north-west of my farm. Follow the lane north.'],
      found: ['You pick apples until the basket is heavy and your arms ache.', 'You count about two hundred apples.'], reward: ['You picked a proper harvest! Here are 30 coins, and take an apple for the road.'], done: ['I am baking apple pie tonight. Come by if you like.'] },
    seeds: { giver: 'pia', kind: 'deliver', target: 'sal', pay: 30, pre: 'apples', title: 'Seeds for Old Sal',
      offer: ['Old Sal in the village wants bean seeds for the spring.', 'Please take this bag to her cottage. She will pay you 30 coins when it arrives.'],
      accept: 'Hold it tight. If you drop it, there will be beans everywhere.', active: ['Sal lives in the village, in the south-west, back through the gate.'],
      deliver: ['You brought my bean seeds, just in time! Here are 30 coins. Please thank Pia for me.'], done: ['I planted the beans already. You did good work.'] },
    scarecrow: { giver: 'ren', kind: 'spot', target: 'scarecrow', pay: 30, title: 'The fallen scarecrow',
      offer: ['Our scarecrow fell over, and now the crows are having a party.', 'Please stand him up again at the bottom of the big field. I will pay 30 coins.'],
      accept: 'His hat fell in the mud somewhere. Good luck.', active: ['The scarecrow lies at the bottom of the big field, east of the lane.'],
      found: ['You heave the scarecrow up, straighten his hat, and tie his arms.', 'The crows fly away in a huff.'], reward: ['The crows are gone! Here are 30 coins, and thank you.'], done: ['We have not seen a crow for a week.'] },
    // market
    parcel: { giver: 'dot', kind: 'deliver', target: 'ossian', pay: 45, title: 'Parcel to the Town Hall',
      offer: ['This parcel is for Clerk Ossian at the Town Hall. I think it holds papers. Heavy ones.', 'Please deliver it. He will pay you 45 coins.'],
      accept: 'Be careful, the string is loose. The Town Hall stands north of the square.', active: ['The Town Hall stands at the top of the square. Ossian waits outside.'],
      deliver: ['You brought the deeds! At last. Here are 45 coins. The town thanks you.'], done: ['Ossian says the papers were the deeds for the school land. You came at the right time.'] },
    lamp: { giver: 'ossian', kind: 'spot', target: 'lamp', pay: 45, title: 'The dark lamp',
      offer: ['The lamp in the south-west corner of the square has been dark for weeks.', 'Please climb up and light it again. The town will pay you 45 coins.'],
      accept: 'You will find matches in the base. Mind the ladder.', active: ['The dark lamp stands at the south-west corner of the square.'],
      found: ['You climb up, clean the glass, and strike a match.', 'Warm light spills over the cobbles.'], reward: ['We have light at last! Here are 45 coins from the town purse.'], done: ['The square feels much friendlier at night now.'] },
    lostsign: { giver: 'nell', kind: 'spot', target: 'lostsign', pay: 45, title: 'The missing sign',
      offer: ['Somebody stole my shop sign! I heard it is lying in the field north-east of the hall.', 'Please bring it back. I will pay you 45 coins.'],
      accept: 'It is a big wooden sign that says SHOP. You cannot miss it.', active: ['Look in the grass north-east of the Town Hall, near the trees.'],
      found: ['You find the sign lying face-down in the grass. It is muddy but whole.', 'You lift it onto your shoulder and carry it back.'], reward: ['You found my sign! Here are 45 coins and my thanks.'], done: ['Business is better now that people can find me.'] },
    // mine
    oil: { giver: 'tam', kind: 'deliver', target: 'quill', pay: 75, title: 'Lamp oil for the mine',
      offer: ['The miners are working in the dark. This can of lamp oil must reach Quill at the mine mouth.', 'Please carry it there. You will get 75 coins.'],
      accept: 'Do not spill it, and do not stand near the camp fire.', active: ['Quill waits at the mine entrance, north-east, up the road.'],
      deliver: ['You brought the oil! Now we can see the ore we are hitting. Here are 75 coins, friend.'], done: ['Quill says the lamps are burning bright.'] },
    cart: { giver: 'quill', kind: 'spot', target: 'cart', pay: 75, title: 'The broken ore cart',
      offer: ['Our ore cart lost a wheel on the road south of here.', 'Please fix it. The mine will pay you 75 coins.'],
      accept: 'We strapped a spare wheel underneath. It is heavy, mind.', active: ['The cart sits on the grass south of the mine, near the road.'],
      found: ['You lift the cart onto a rock and bolt the wheel back on.', 'You give it a push. It rolls.'], reward: ['The cart is rolling again! Here are 75 coins from the mine.'], done: ['That cart has hauled ten loads since you fixed it.'] },
    canary: { giver: 'mab', kind: 'spot', target: 'canary', pay: 75, title: 'The escaped canary',
      offer: ['Our canary flew out of her cage! She keeps the miners safe from bad air.', 'She likes the bushes north-east of the mine. Please bring her back. I will pay 75 coins.'],
      accept: 'Whistle to her. She likes whistling.', active: ['Look in the grass north-east of the mine, up by the rocks.'],
      found: ['You whistle. A yellow flash lands on your shoulder.', 'She sings all the way back.'], reward: ['You found Goldie! She is safe and sound. Here are 75 coins.'], done: ['Goldie is singing again, and the miners are happy.'] },
    // harbour
    oar: { giver: 'orla', kind: 'spot', target: 'oar', pay: 90, title: 'The lost oar',
      offer: ['The tide took my best oar. It washed up on the west beach, past the old footbridge.', 'Please bring it back. I will pay you 90 coins.'],
      accept: 'It is long, and the handle is carved. My father made it.', active: ['Cross the old footbridge to the west, then walk along the beach.'],
      found: ['You spot a long oar with a carved handle, half buried in the sand.', 'You dig it out and shake off the seaweed.'], reward: ['You found my father\'s oar! Here are 90 coins. You have no idea what this means to me.'], done: ['Orla rows out every morning now.'] },
    fish: { giver: 'lin', kind: 'deliver', target: 'bea', pay: 90, title: 'Fish for the tavern',
      offer: ['This crate of fish must reach Bea at the Tavern before it goes off.', 'She pays 90 coins for a fresh crate.'],
      accept: 'Go quickly. If you get lost, follow your nose.', active: ['Walk west along the quay, then go up. Bea stands outside the Tavern.'],
      deliver: ['This fish is as fresh as the sea! Here are 90 coins, and I will give you a bowl of chowder if you want one.'], done: ['Bea says that was the best crate all season.'] },
    ledger: { giver: 'bea', kind: 'deliver', target: 'lin', pay: 90, pre: 'fish', title: 'The tavern ledger',
      offer: ['Lin forgot her ledger here. Without it she cannot sell a single fish.', 'Please take it back to her on the quay. I will pay you 90 coins.'],
      accept: 'It is the blue book. Do not get it wet.', active: ['Lin stands on the quay next to the pier.'],
      deliver: ['You brought my ledger! I would have lost a whole day. Here are 90 coins.'], done: ['Lin keeps the ledger on a string now.'] }
  };

  const JOBS = {
    water: { spot: 'bucket', region: 0, pay: 4, cooldown: 25, title: 'Carry water', lines: ['You haul two heavy buckets up to the bakery.', 'Hana pays you 4 coins.'] },
    milk: { spot: 'milk', region: 1, pay: 5, cooldown: 25, title: 'Milk the goats', lines: ['You milk the goats. One of them stands on your foot.', 'The twins pay you 5 coins.'] },
    sweep: { spot: 'broom', region: 2, pay: 6, cooldown: 25, title: 'Sweep the square', lines: ['You sweep the cobbles until they shine.', 'The stall-holders chip in 6 coins.'] },
    ore: { spot: 'orepile', region: 3, pay: 8, cooldown: 25, title: 'Sort ore', lines: ['You pick shiny ore out of dull rock for an hour.', 'Cook Mab pays you 8 coins.'] },
    ropes: { spot: 'ropes', region: 4, pay: 10, cooldown: 25, title: 'Coil ropes', lines: ['You coil wet rope until your hands are sore.', 'The harbour pays you 10 coins.'] }
  };

  /* ---------------- people ---------------- */
  const NPCS = [
    // ===== Riverside Village (bandwagon) =====
    { id: 'otto', name: 'Elder Otto', x: 5, y: 12, dir: 'right', region: 0, v: 'old', spec: { size: 'xl', skin: '#F1C9A5', hair: '#DDDDDD', hairStyle: 'short', shirt: '#7FA8A6', pants: '#5B4F47', beard: true },
      talk: ['Welcome to Riverside, {name}. The fog comes from tricky talk. Clear heads clear it away.', 'The village needs a well. We marked the spot in the square. It costs coins, and it needs a water engineer and a mason.', 'Wren camps by the river. Mo the mason sits by the north lane. Both of them are a bit foggy in the head.'],
      trick: 'ottoDoubt' },
    { id: 'hana', name: 'Baker Hana', x: 20, y: 7, dir: 'down', region: 0, v: 'woman', task: 'bread', spec: { size: 'l', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'bun', shirt: '#FFFFFF', pants: '#5B4F47', apron: '#F4E8CC' },
      talk: ['I bake fresh bread every morning. If you want steady coins, carry water from the river for me. The buckets sit by the bank.'] },
    { id: 'idris', name: 'Farmer Idris', x: 21, y: 25, dir: 'up', region: 0, v: 'man', task: 'fence', spec: { size: 'xl', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'short', shirt: '#63C48F', pants: '#3E5C8A', hat: '#D98F1F' },
      talk: ['The goats break something every single day.'] },
    { id: 'sal', name: 'Old Sal', x: 4, y: 24, dir: 'right', region: 0, v: 'old', task: 'goat', spec: { size: 'l', skin: '#C68B59', hair: '#DDDDDD', hairStyle: 'bun', shirt: '#9B6BD6', pants: '#5B4F47', glasses: true },
      talk: ['My knees know when rain is coming. Today they say no rain.'] },
    { id: 'mo', name: 'Mo the Mason', x: 9, y: 9, dir: 'down', region: 0, v: 'man', spec: { size: 'l', skin: '#C68B59', hair: '#2A2420', hairStyle: 'short', shirt: '#B08A5A', pants: '#5B4F47', apron: '#8E8A80' },
      expert: { role: 'mason', level: 1, fee: 10,
        fog: [
          { fallacy: 'bandwagon', topic: 'Why you stayed behind',
            intro: ['You want me to work? No. All the other masons left for the city.', 'Everyone says there is no work in this valley. If everyone left, they must be right.', 'So I sit here. Why should I be the only mason who stays?'],
            options: [
              { text: "Everyone leaving doesn't prove there's no work. There's a well to build.", right: true },
              { text: "You're right. If every other mason left, the work must really be gone from here." },
              { text: "The other masons were cowards. Don't be a coward." }
            ],
            right: ['A well? Here? Huh.', 'Everyone said there was no work, and I never looked for myself.', 'Fine. Show me the site. I charge 10 coins a job.'],
            wrong: ["That is what I said. So we agree. There is no work.", 'Mo goes back to staring at the river.'] },
          { fallacy: 'bandwagon', topic: 'River sand for the mortar',
            intro: ['Everyone in the village mixes their mortar with river sand. Everyone does it, so it must be the best way.', "I will use river sand on your well."],
            options: [
              { text: "Everyone using it doesn't make it best. Let's test a brick first.", right: true },
              { text: 'Everyone does it and nobody complains, so yes, river sand will be fine for the well.' },
              { text: 'Everyone in this village is a fool.' }
            ],
            right: ['You want to test it? Fine. Look, the river sand crumbles. The pit sand holds.', 'Everyone was wrong together. My head feels lighter already.'],
            wrong: ['Right. I will use river sand.', 'A month later, the mortar crumbles. Everyone was wrong together.'] }
        ],
        crew: ['I am ready when you are. Stone does not build itself.'] } },
    { id: 'wren', name: 'Wren', x: 24, y: 12, dir: 'left', region: 0, v: 'woman', spec: { size: 'm', skin: '#F1C9A5', hair: '#B04A2A', hairStyle: 'long', shirt: '#5FB3D9', pants: '#3E5C8A', helmet: '#F6B544' },
      expert: { role: 'water', level: 1, fee: 15,
        fog: [
          { fallacy: 'bandwagon', topic: 'Wells in this valley',
            intro: ['You want a well? Nobody digs wells around here. Nobody ever has.', 'If wells worked, everybody would have one. Nobody does. So wells do not work here.', 'I dig ditches. Everyone wants ditches.'],
            options: [
              { text: "Nobody trying doesn't prove it won't work. Let's test the ground.", right: true },
              { text: 'Fair point. If nobody in the whole valley has one, wells must not work here.' },
              { text: "Ditch-diggers don't know anything about wells." }
            ],
            right: ['You want to test the ground? I have a probe rod. Give me a moment.', 'I found water. It sits four metres down. Nobody ever checked.', 'All right, builder. I charge 15 coins a job, and I am yours.'],
            wrong: ['Exactly. Now, let us talk about ditches.', 'Wren goes back to sharpening her spade.'] },
          { fallacy: 'bandwagon', topic: 'Digging at the full moon',
            intro: ['Everyone says you must dig a well at the full moon, or it runs dry.', 'I know it sounds odd, but everyone says it. So we wait two weeks.'],
            options: [
              { text: "Everyone saying it isn't evidence. Water doesn't care about the moon.", right: true },
              { text: "If everyone says it, there must be something in it. Let's wait for the full moon." },
              { text: "Everyone in this valley is superstitious and silly." }
            ],
            right: ['The moon does not reach four metres underground, does it?', 'I feel clearer now. I learn faster with a clear head.'],
            wrong: ['We wait. Two weeks pass and nothing happens.', 'The well works exactly the same as it would have. Everyone was wrong together.'] }
        ],
        crew: ['Water always finds a way. So do we.'] } },
    { id: 'pip', name: 'Pip', x: 10, y: 17, dir: 'right', region: 0, v: 'kid', trick: 'pipPebble', spec: { size: 's', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'short', shirt: '#E4574F', pants: '#3E5C8A' },
      after: ['It turns out the pebbles are just pebbles. Do you want one for free?'] },
    { id: 'dodge', name: 'Dodge', x: 16, y: 17, dir: 'left', region: 0, v: 'kid', trick: 'dodgeCups', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'curly', shirt: '#2F80ED', pants: '#5B4F47', cap: '#2A2420' },
      after: ["Fine, fine. The cups game is a trick. Please don't tell the others."] },

    // ===== River Farms (false dilemma) =====
    { id: 'pia', name: 'Farmer Pia', x: 18, y: 35, dir: 'down', region: 1, v: 'woman', task: 'apples', spec: { size: 'l', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'bun', shirt: '#D98F1F', pants: '#5B4F47', hat: '#E2B93B' },
      talk: ['A bridge would double my sales. Half my apples rot while they wait for the ferry.'] },
    { id: 'ren', name: 'Ren', x: 8, y: 47, dir: 'right', region: 1, v: 'man', task: 'scarecrow', trick: 'twinsField', spec: { size: 'm', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'short', shirt: '#63C48F', pants: '#3E5C8A' },
      talk: ['My sister and I argue about the field every single spring.'] },
    { id: 'rin', name: 'Rin', x: 9, y: 47, dir: 'left', region: 1, v: 'woman', spec: { size: 'm', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'long', shirt: '#F6B544', pants: '#3E5C8A' },
      talk: ['We should plant beans. Or wheat. It has to be one or the other!'], afterTrick: 'twinsField', after: ['We plant half and half now. Why did that take us five years?'] },
    { id: 'gus', name: 'Ferryman Gus', x: 24, y: 44, dir: 'left', region: 1, v: 'man', trick: 'gusFerry', spec: { size: 'xl', skin: '#C68B59', hair: '#2A2420', hairStyle: 'bald', shirt: '#2F80ED', pants: '#5B4F47', beard: true, bandana: '#E4574F' },
      after: ['A bridge, eh? I suppose I could sell boat rides for fun instead.'] },
    { id: 'lou', name: 'Lotto Lou', x: 14, y: 50, dir: 'right', region: 1, v: 'woman', trick: 'louLotto', spec: { size: 'm', skin: '#F5D7B8', hair: '#B04A2A', hairStyle: 'curly', shirt: '#9B6BD6', pants: '#2A2420', hat: '#9B6BD6' },
      after: ["You can be a winner, a quitter, or a person who keeps their coins. Fine, you win."] },
    { id: 'cass', name: 'Cass', x: 20, y: 52, dir: 'left', region: 1, v: 'woman', spec: { size: 'l', skin: '#F1C9A5', hair: '#2A2420', hairStyle: 'bun', shirt: '#B08A5A', pants: '#3E5C8A', vest: '#7A4F2A' },
      expert: { role: 'carpenter', level: 1, fee: 25,
        fog: [
          { fallacy: 'falseDilemma', topic: 'Working for the sawmill boss',
            intro: ['You want to hire a carpenter? Not me.', 'Either I work for the sawmill boss for pennies, or I do not work at all. Those are my two choices.', 'I chose "not at all".'],
            options: [
              { text: "Those aren't the only two. Work for me, on a bridge, for a fair fee.", right: true },
              { text: "That's a hard choice, and I understand picking neither. Better idle than underpaid." },
              { text: 'The sawmill boss is a crook, so you should hate him.' }
            ],
            right: ['You want me to work for you? On a bridge?', 'I never thought of a third door. I was too busy hating door number one.', 'I charge 25 coins a job. We have a deal.'],
            wrong: ['You see? Even you agree. There are two doors, and both are bad.', 'Cass goes back to whittling a stick.'] },
          { fallacy: 'falseDilemma', topic: 'Oak or pine for the deck',
            intro: ['We must pick wood for the bridge deck. Either we use oak and it takes a year, or we use pine and it rots in two winters.', 'Pick one. Slow or rotten.'],
            options: [
              { text: 'Or pine deck we can replace, on oak beams that last.', right: true },
              { text: 'Oak then. A year is fine, this bridge should last a hundred.' },
              { text: "Pine. Rotting is fine, we'll worry about that in two winters." }
            ],
            right: ['Oak bones and pine skin. Ha! Yes!', 'I saw two doors, and there was a window the whole time.'],
            wrong: ['If you say so.', 'The bridge could have been better. There was a third way.'] }
        ],
        crew: ['I measure twice, I cut once, and I never argue.'] } },
    { id: 'sy', name: 'Sy', x: 22, y: 41, dir: 'right', region: 1, v: 'man', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'short', shirt: '#F4E8CC', pants: '#5B4F47', glasses: true },
      expert: { role: 'surveyor', level: 1, fee: 20,
        fog: [
          { fallacy: 'falseDilemma', topic: 'Measuring the river',
            intro: ['You want me to measure the river for a bridge? That is impossible.', "Either the King's surveyors measure it with their brass tools, or nobody measures it at all.", "And the King's men never come here."],
            options: [
              { text: 'You have a tripod and a rope. Measure it yourself.', right: true },
              { text: "True. Without the King's men and their brass tools, nothing here can be measured properly." },
              { text: "The King's men are lazy snobs anyway." }
            ],
            right: ['You want me to do it myself? With my own tripod?', 'The river is twenty-two paces wide, bank to bank. I just measured it.', 'I charge 20 coins a job, and I am on your crew.'],
            wrong: ["Exactly. So we wait for the King. We will wait forever.", 'Sy polishes his glasses and stares at the water.'] },
          { fallacy: 'falseDilemma', topic: 'Where the bridge should go',
            intro: ['The bridge must go right here at the ferry, or it must not go anywhere.', 'If we put it anywhere else, the whole plan fails.'],
            options: [
              { text: 'Or upstream where the banks are rock. More than two places exist.', right: true },
              { text: 'Here or nowhere, and the farms need a crossing. Here, then, on the mud.' },
              { text: 'Nowhere. Forget the bridge.' }
            ],
            right: ['The rock banks! Of course. I only ever looked at two spots.', 'My head feels clearer. I can see more doors now.'],
            wrong: ['We build it here, on the soft mud.', 'The bridge could have been better. Two choices were never the only choices.'] }
        ],
        crew: ['I like straight lines and honest numbers.'] } },

    // ===== Market Town (emotion + post hoc) =====
    { id: 'vell', name: 'Vell', x: 39, y: 41, dir: 'right', region: 2, v: 'man', trick: 'vellPuppy', spec: { size: 'm', skin: '#F5D7B8', hair: '#4A2E1A', hairStyle: 'long', shirt: '#8E8A80', pants: '#5B4F47', frown: true },
      after: ['All right, the puppy is fine. He is fat, actually. You are a hard one to fool.'] },
    { id: 'zia', name: 'Zia', x: 44, y: 41, dir: 'left', region: 2, v: 'woman', trick: 'ziaCharm', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'curly', shirt: '#F6B544', pants: '#9B6BD6' },
      after: ['Maybe the new stall spot did it, and not the charm. Hmm.'] },
    { id: 'mags', name: 'Fortune Mags', x: 52, y: 46, dir: 'left', region: 2, v: 'old', trick: 'magsFortune', spec: { size: 'l', skin: '#C68B59', hair: '#DDDDDD', hairStyle: 'long', shirt: '#6B5BB3', pants: '#2A2420', hat: '#6B5BB3' },
      after: ['You see too clearly for my trade. Go and build your school.'] },
    { id: 'bram', name: 'Auctioneer Bram', x: 57, y: 45, dir: 'left', region: 2, v: 'man', trick: 'bramAuction', spec: { size: 'xl', skin: '#F1C9A5', hair: '#8B4A1F', hairStyle: 'short', shirt: '#E4574F', pants: '#2A2420', vest: '#2A2420' },
      after: ['A fair price is a fair price. Even I know that on a good day.'] },
    { id: 'dot', name: 'Innkeeper Dot', x: 58, y: 44, dir: 'down', region: 2, v: 'woman', task: 'parcel', spec: { size: 'l', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'bun', shirt: '#63C48F', pants: '#5B4F47', apron: true },
      talk: ['We have rooms upstairs and soup downstairs.'] },
    { id: 'ossian', name: 'Clerk Ossian', x: 42, y: 35, dir: 'down', region: 2, v: 'man', task: 'lamp', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'short', shirt: '#F4E8CC', pants: '#2A2420', glasses: true },
      talk: ['I fill in forms all day. The school will need a licence. I have already stamped it.'] },
    { id: 'nell', name: 'Shopkeeper Nell', x: 35, y: 52, dir: 'up', region: 2, v: 'woman', task: 'lostsign', spec: { size: 'm', skin: '#F1C9A5', hair: '#B04A2A', hairStyle: 'long', shirt: '#2F80ED', pants: '#5B4F47', apron: true },
      talk: ['I sell rope, nails and lamp oil. If I sell it, you need it.'] },
    { id: 'ada', name: 'Professor Ada', x: 58, y: 53, dir: 'up', region: 2, v: 'woman', spec: { size: 'l', skin: '#C68B59', hair: '#DDDDDD', hairStyle: 'bun', shirt: '#6B5BB3', pants: '#2A2420', glasses: true },
      expert: { role: 'scholar', level: 2, fee: 40,
        fog: [
          { fallacy: 'emotion', topic: 'The students who cried',
            intro: ['You want me to teach at a school? Never again.', 'Last year two students failed their exam and cried in my library. I cannot bear that again.', 'How can a school be a good idea when it makes children cry?'],
            options: [
              { text: 'Tears are real, but not a reason. Did the students who passed learn?', right: true },
              { text: "You're right, anything that makes children cry is a bad idea, however useful." },
              { text: 'Crying students are weak. Ignore them.' }
            ],
            right: ['Did they learn? Forty of them passed. Two of them cried.', 'I let two tears decide for forty students.', 'Very well. I charge 40 coins a job, and I will run your school.'],
            wrong: ['Then we agree. There will be no school.', 'Ada returns to her book.'] },
          { fallacy: 'postHoc', topic: 'The lucky green scarf',
            intro: ['I always lecture in my green scarf. The one year I forgot it, three students failed.', 'The scarf must be lucky. I cannot teach without it, and it is at the cleaners.'],
            options: [
              { text: 'The scarf came first. Did it cause the passes? What else changed?', right: true },
              { text: "Then we wait for the scarf, it's not worth risking a whole year of students." },
              { text: 'Scarves are silly. Throw it away.' }
            ],
            right: ['What else changed? I was ill that year, and I missed six lectures.', 'The scarf never mattered. My head feels clearer already.'],
            wrong: ['We wait for the scarf.', 'Coming first was never the same as causing.'] }
        ],
        crew: ['Knowledge is the only building that grows when you share it.'] } },
    { id: 'brick', name: 'Brick', x: 36, y: 47, dir: 'right', region: 2, v: 'man', spec: { size: 'xl', skin: '#8D5A3B', hair: '#2A2420', hairStyle: 'bald', shirt: '#B08A5A', pants: '#5B4F47', apron: '#8E8A80', beard: true },
      expert: { role: 'mason', level: 2, fee: 35,
        fog: [
          { fallacy: 'postHoc', topic: 'The bell tower that fell',
            intro: ['I laid the last stones on the bell tower. A week later, it fell down.', 'My stones caused it. My hands are cursed. I will never lay stone again.'],
            options: [
              { text: 'Your stones came before the fall. Was the ground checked?', right: true },
              { text: 'If it fell a week after your stones, your stones did it. Best leave building to others.' },
              { text: "Curses aren't real, you superstitious oaf." }
            ],
            right: ['The ground? The surveyor said the ground was soft. Nobody listened to him.', 'My hands are fine. The ground did it.', 'I charge 35 coins a job. Let me build something that stands.'],
            wrong: ['I am cursed. I told you.', 'Brick stares at his hands.'] }
        ],
        crew: ['I keep it level, plumb and square. Every time.'] } },

    // ===== Hill Mine (gambler, sunk cost, hasty generalisation) =====
    { id: 'ace', name: 'Ace', x: 41, y: 19, dir: 'left', region: 3, v: 'man', trick: 'aceCards', spec: { size: 'm', skin: '#F5D7B8', hair: '#2A2420', hairStyle: 'short', shirt: '#2A2420', pants: '#2A2420', vest: '#E4574F', hat: '#2A2420' },
      after: ['So cards have no memory, eh? You would make a terrible customer.'] },
    { id: 'sterling', name: 'Sterling', x: 40, y: 25, dir: 'up', region: 3, v: 'man', trick: 'sterlingShares', spec: { size: 'l', skin: '#F1C9A5', hair: '#8B4A1F', hairStyle: 'short', shirt: '#F4E8CC', pants: '#2A2420', vest: '#6B5BB3', glasses: true },
      after: ['The Dry Gulch shaft is dry. There, I said it.'] },
    { id: 'grit', name: 'Grit', x: 56, y: 12, dir: 'left', region: 3, v: 'old', trick: 'gritDale', spec: { size: 'l', skin: '#C68B59', hair: '#DDDDDD', hairStyle: 'short', shirt: '#A2703F', pants: '#5B4F47', beard: true, hat: '#5B4F47' },
      after: ['One man from Dale cheated me. One. And I blamed the whole town for it.'] },
    { id: 'tam', name: 'Foreman Tam', x: 36, y: 12, dir: 'down', region: 3, v: 'woman', task: 'oil', spec: { size: 'l', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'bun', shirt: '#F6B544', pants: '#5B4F47', helmet: '#F6B544' },
      talk: ['A mill would change everything up here. Fen knows how to build one. Fen just needs a clear head.'] },
    { id: 'quill', name: 'Quill', x: 55, y: 10, dir: 'down', region: 3, v: 'man', task: 'cart', spec: { size: 'm', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'curly', shirt: '#8E8A80', pants: '#5B4F47', helmet: '#F6B544' },
      talk: ['It is dark down there. Very dark.'] },
    { id: 'mab', name: 'Cook Mab', x: 35, y: 16, dir: 'right', region: 3, v: 'woman', task: 'canary', spec: { size: 'xl', skin: '#F5D7B8', hair: '#B04A2A', hairStyle: 'bun', shirt: '#FFFFFF', pants: '#5B4F47', apron: '#E4574F' },
      talk: ['I cook stew for the miners. If you want coins, sort the ore at the pile east of here.'] },
    { id: 'fen', name: 'Fen', x: 34, y: 21, dir: 'left', region: 3, v: 'man', spec: { size: 'm', skin: '#C68B59', hair: '#2A2420', hairStyle: 'curly', shirt: '#5FB3D9', pants: '#3E5C8A', vest: '#7A4F2A' },
      expert: { role: 'millwright', level: 1, fee: 60,
        fog: [
          { fallacy: 'gambler', topic: 'Three fallen mills',
            intro: ['You want me to build a mill? Oh, I will. But I will not use a plan.', 'My last three mills fell down. Three failures in a row! So this one is due to work.', 'Luck has to turn. I do not need drawings. Let us just start.'],
            options: [
              { text: "Three failures don't make a success due. Why did they fall?", right: true },
              { text: "Three in a row! You're definitely due. Let's start now before the luck wears off." },
              { text: 'Three failures? You are obviously a terrible millwright.' }
            ],
            right: ['Why did they fall? The wheel was too heavy for the axle. It happened all three times.', 'Luck was never coming. A stronger axle is.', 'I charge 60 coins a job, and I will draw it properly this time.'],
            wrong: ['That is the spirit! We need no plan!', 'Fen picks up a hammer and a hopeful look.'] },
          { fallacy: 'sunkCost', topic: 'The 400-coin design',
            intro: ['I have spent 400 coins on a mill design that cannot work. The axle is wrong.', 'But I spent 400 coins! I cannot throw that away. I must spend 200 more to finish it.'],
            options: [
              { text: 'The 400 is gone either way. Is the next 200 worth it? No.', right: true },
              { text: "You've spent so much already, you have to finish it or it was all for nothing." },
              { text: 'You wasted 400 coins? Fool.' }
            ],
            right: ['The next 200 coins would buy me a mill that falls down.', 'The 400 is gone whatever I do. That hurts. But I see it clearly now.'],
            wrong: ['Right. I will spend 200 more.', 'Six hundred coins of mill fall into the river.'] }
        ],
        crew: ['I draw a good wheel twice before I build it once.'] } },

    // ===== Harbour (everything) =====
    { id: 'coyle', name: 'Harbour Master Coyle', x: 36, y: 65, dir: 'right', region: 4, v: 'man', trick: 'coyleStorm', spec: { size: 'xl', skin: '#F1C9A5', hair: '#DDDDDD', hairStyle: 'short', shirt: '#2F6E7E', pants: '#2A2420', hat: '#2F6E7E', beard: true },
      after: ['I checked. The Guild Master has never seen a storm from a boat.'] },
    { id: 'bo', name: 'Sailor Bo', x: 50, y: 66, dir: 'left', region: 4, v: 'kid', trick: 'boSlope', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'short', shirt: '#FFFFFF', pants: '#3E5C8A', bandana: '#2F80ED' },
      after: ["I take one step at a time now. Lighthouses don't summon pirates. I knew that, really."] },
    { id: 'vance', name: 'Merchant Vance', x: 55, y: 65, dir: 'left', region: 4, v: 'man', trick: 'vanceStraw', spec: { size: 'l', skin: '#F5D7B8', hair: '#8B4A1F', hairStyle: 'short', shirt: '#9B6BD6', pants: '#2A2420', vest: '#F6B544' },
      after: ['I may have twisted your words a little. It is a habit in my trade.'] },
    { id: 'hale', name: 'Captain Hale', x: 58, y: 67, dir: 'left', region: 4, v: 'old', trick: 'haleFires', spec: { size: 'xl', skin: '#C68B59', hair: '#DDDDDD', hairStyle: 'short', shirt: '#2A2420', pants: '#2A2420', beard: true, eyepatch: true, hat: '#2A2420' },
      after: ['We lit bonfires for two hundred years. And ships wrecked for two hundred years. Aye.'] },
    { id: 'rook', name: 'Dockhand Rook', x: 48, y: 67, dir: 'right', region: 4, v: 'man', trick: 'rookInsult', spec: { size: 'l', skin: '#F1C9A5', hair: '#E0A23A', hairStyle: 'short', shirt: '#A2703F', pants: '#5B4F47', frown: true },
      after: ['Fine, the smith knows her metal. Even if she does have a funny accent.'] },
    { id: 'orla', name: 'Orla', x: 33, y: 67, dir: 'right', region: 4, v: 'woman', task: 'oar', trick: 'orlaHerring', spec: { size: 'm', skin: '#F5D7B8', hair: '#B04A2A', hairStyle: 'long', shirt: '#63C48F', pants: '#3E5C8A', bandana: '#F6B544' },
      talk: ['The sea gives and the sea takes. Mostly it takes.'] },
    { id: 'lin', name: 'Fisher Lin', x: 46, y: 69, dir: 'left', region: 4, v: 'woman', task: 'fish', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'bun', shirt: '#5FB3D9', pants: '#5B4F47', apron: true },
      talk: ['Rope work pays if you need coins. The coils sit further down the quay.'] },
    { id: 'bea', name: 'Cook Bea', x: 40, y: 67, dir: 'down', region: 4, v: 'woman', task: 'ledger', spec: { size: 'xl', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'bun', shirt: '#FFFFFF', pants: '#5B4F47', apron: '#E4574F' },
      talk: ['I make chowder. I always make chowder.'] },
    { id: 'iva', name: 'Iva the Smith', x: 56, y: 69, dir: 'left', region: 4, v: 'woman', spec: { size: 'l', skin: '#C68B59', hair: '#2A2420', hairStyle: 'bun', shirt: '#8E8A80', pants: '#2A2420', apron: '#5B4F47', bandana: '#E4574F' },
      expert: { role: 'smith', level: 1, fee: 80,
        fog: [
          { fallacy: 'authority', topic: 'What the Guild Master said',
            intro: ['You want me to forge the great lamp for a lighthouse? No.', 'The Guild Master himself says a lamp that bright will crack in the sea wind.', 'He is the Guild Master. He wears the gold chain. He must be right.'],
            options: [
              { text: "A gold chain isn't a reason. Has any bright lamp cracked?", right: true },
              { text: 'The Guild Master would know better than us. Best not risk it, the sea wind is fierce.' },
              { text: 'The Guild Master is an old fool.' }
            ],
            right: ['Has any lamp cracked? He has never built a lamp. He only inspects ledgers.', 'I have built a hundred lamps. Not one of them cracked.', 'I charge 80 coins a job. Let me forge the biggest lamp yet.'],
            wrong: ['Yes. Best not.', 'Iva bangs a horseshoe flat and thinks about gold chains.'] },
          { fallacy: 'slipperySlope', topic: 'One lamp leads to ruin',
            intro: ['If I forge one giant lamp, every harbour will want one. Then I will never sleep. Then the forge will burn out. Then I will lose everything.', 'One lamp leads to ruin. So I will make no lamp.'],
            options: [
              { text: "One lamp doesn't force the next. You can say no later.", right: true },
              { text: 'True, one lamp really could ruin you in the end. Better not start down that road.' },
              { text: 'You are just lazy.' }
            ],
            right: ['I can say no to the second lamp. Ha! I can.', 'One step is not a slide. My head is as clear as a bell.'],
            wrong: ['Then I will make no lamp. It is safer.', 'The slide was never real. One step is only one step.'] }
        ],
        crew: ['Iron listens if you speak to it firmly.'] } }
  ];

  /* ---------------- tricks (arguments aimed at your pouch) ----------------
     Steps: {who,text,money?,sfx?} | {scene,text} | {end:'win'|'fail'|'oops'}.
     The right answer keeps your coins and usually earns a tip. Going along loses coins. */
  const TRICKS = {
    ottoDoubt: { fallacy: 'bandwagon', npc: 'otto', tag: 'story',
      intro: ['I want to ask you one more thing, {name}. Some villagers say, "Nobody here has ever built a well, so nobody should."', 'They said it to me last night. Everyone was nodding. What do you make of that?'],
      options: [
        { key: 'right', text: "Everyone nodding isn't a reason. Has anyone checked?" },
        { key: 'ok', text: "If nobody has ever built one here, they probably know something we don't about the ground." },
        { key: 'oops', text: 'Those villagers sound stupid, and stupid people should not get a vote on this.' }
      ],
      right: [{ who: 'otto', text: 'Ha! That is exactly what I hoped you would say.' }, { who: 'otto', text: 'Nobody has checked. So we should check. Take these 8 coins for the well fund. That is my share.', money: 8, sfx: 'coins' }, { end: 'win' }],
      ok: [{ who: 'otto', text: 'Hmm. That is what they said too. But is everyone agreeing a reason?' }, { who: 'n', text: 'Otto looks disappointed. The fog around the square grows a little thicker.' }, { end: 'fail' }],
      oops: [{ who: 'otto', text: 'Calling them names does not answer them, child.' }, { end: 'oops' }] },

    pipPebble: { fallacy: 'bandwagon', npc: 'pip', cost: 10,
      intro: ['Psst! {name}! I sell lucky pebbles. They cost ten coins.', 'Everyone in the village bought one. Hana bought one. Idris bought one. The twins bought one. Everyone!', "You don't want to be the only one without a lucky pebble, do you?"],
      options: [
        { key: 'ok', text: "Everyone has one? Then I'd better have one too. Here's 10 coins, I don't want to be the odd one out." },
        { key: 'right', text: "Everyone buying one doesn't make it lucky. What does it actually do?" },
        { key: 'oops', text: 'You are a little cheat, Pip, and everybody in this village knows it.' }
      ],
      ok: [{ who: 'n', text: 'You hand over 10 coins. Pip hands you a grey pebble.', money: -10, sfx: 'lose' }, { who: 'n', text: 'It is a pebble. Later, Idris tells you he never bought one. Hana did not buy one either.' }, { scene: 'img/fail-bandwagon.jpg', text: 'You paid ten coins for a pebble. "Everyone" turned out to be nobody.' }, { end: 'fail' }],
      right: [{ who: 'pip', text: 'It... um. It sits there. It sits there luckily.' }, { who: 'pip', text: "OK, nobody bought one. You were my first try. Take 6 coins for not falling for it. I'm being honest, see?", money: 6, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'pip', text: 'I am not!' }, { who: 'n', text: 'Pip runs off. You still do not know what the pebble does.' }, { end: 'oops' }] },

    dodgeCups: { fallacy: 'bandwagon', npc: 'dodge', cost: 15,
      intro: ['I have three cups and one pea. You pay fifteen coins to play. You win thirty if you find the pea!', 'Everybody plays this game. All the kids played today. Everybody loves it. Come on, join everybody!'],
      options: [
        { key: 'ok', text: 'Everybody plays and everybody loves it, so it must be fair. Fine, 15 coins, shuffle them.' },
        { key: 'right', text: "Everybody playing doesn't mean anybody wins. How many won today?" },
        { key: 'oops', text: 'Cheaters like you should be run out of town on the back of a cart.' }
      ],
      ok: [{ who: 'n', text: 'You pay 15 coins. Dodge shuffles the cups so fast that they blur.', money: -15, sfx: 'lose' }, { who: 'n', text: 'You pick the middle cup. It is empty. The pea was never under any of them.' }, { scene: 'img/fail-bandwagon.jpg', text: 'Everybody played. Nobody won. A crowd doing something does not make it a good idea.' }, { end: 'fail' }],
      right: [{ who: 'dodge', text: 'How many won? Er. About... none.' }, { who: 'dodge', text: "You're sharper than the others. Take 6 coins, and please don't tell Elder Otto.", money: 6, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'dodge', text: 'Oi!' }, { who: 'n', text: 'Dodge packs up his cups. A crowd gathers to argue about who is a cheat. Nobody asks how many people won.' }, { end: 'oops' }] },

    gusFerry: { fallacy: 'falseDilemma', npc: 'gus', cost: 30,
      intro: ['Do you want to see the other side of the river? It is simple.', 'Either you pay me 30 coins for the ferry, or you never see the other side. Ever.', 'You have two choices. That is all there is.'],
      options: [
        { key: 'ok', text: "If those are the only two choices, I suppose I have to pay. Here's 30 coins for the ferry." },
        { key: 'right', text: "Those aren't the only two. I could build a bridge." },
        { key: 'oops', text: 'You greedy old goat, no wonder nobody likes you.' }
      ],
      ok: [{ who: 'n', text: 'You pay 30 coins. Gus rows you out, turns around halfway, and rows you back.', money: -30, sfx: 'lose' }, { who: 'gus', text: 'The trip across costs extra. You should have asked.' }, { scene: 'img/fail-falseDilemma.jpg', text: 'You paid thirty coins, and you are still on this side. Two doors were never the only doors.' }, { end: 'fail' }],
      right: [{ who: 'gus', text: 'A... bridge.' }, { who: 'gus', text: 'Nobody ever says that. Here, take 15 coins. Call it a gift for my retirement.', money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'gus', text: 'You are the goat!' }, { who: 'n', text: 'You both stand on the bank and glare at each other. The river does not care.' }, { end: 'oops' }] },

    louLotto: { fallacy: 'falseDilemma', npc: 'lou', cost: 12,
      intro: ['I sell lotto tickets for 12 coins! The grand prize is 500!', 'Listen. In this life you are either a winner or a quitter.', 'Winners buy tickets. So which one are you?'],
      options: [
        { key: 'ok', text: "I'm no quitter, and 500 coins would fix everything. Give me a ticket, here's 12." },
        { key: 'right', text: 'Or a third option: someone who keeps their 12 coins.' },
        { key: 'oops', text: 'Only losers sell lottery tickets, and only bigger losers buy them.' }
      ],
      ok: [{ who: 'n', text: 'You buy a ticket. Lou draws a number. It is not yours.', money: -12, sfx: 'lose' }, { who: 'lou', text: 'You were so close! Winners try again.' }, { scene: 'img/fail-falseDilemma.jpg', text: 'Twelve coins are gone. "Winner or quitter" hid the real third door: keep your money.' }, { end: 'fail' }],
      right: [{ who: 'lou', text: 'A person who keeps their coins. That option is not on my sign.' }, { who: 'lou', text: 'To be honest, nobody has won yet. Take 15 coins for seeing the third door.', money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'lou', text: 'That is rude!' }, { who: 'n', text: 'Lou sells three tickets to the people who came to watch the argument.' }, { end: 'oops' }] },

    twinsField: { fallacy: 'falseDilemma', npc: 'ren', tag: 'story',
      intro: [{ who: 'ren', text: '{name}! Please settle this for us. We should plant the big field with wheat. All wheat!' }, { who: 'rin', text: 'No! All beans! It is beans or wheat, one or the other, and Ren is wrong.' }, { who: 'ren', text: 'Well? Wheat or beans? Pick one!' }],
      options: [
        { key: 'ok', text: 'You have to pick one, so wheat. It sells better and everyone around here grows it.' },
        { key: 'right', text: 'Why only one? Half wheat, half beans.' },
        { key: 'oops', text: "You two are the silliest farmers in the valley and I'm not surprised the crows visit." }
      ],
      ok: [{ who: 'rin', text: 'Wheat?! Fine. We plant wheat.' }, { who: 'n', text: 'The wheat catches a disease. The whole field is lost. Beans would have been fine in half of it.' }, { end: 'fail' }],
      right: [{ who: 'ren', text: 'Half... and half.' }, { who: 'rin', text: 'We argued for five years. Five years!' }, { who: 'ren', text: 'Take 15 coins. You ended a war.', money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'rin', text: 'Well, at least we agree that you are rude.' }, { end: 'oops' }] },

    vellPuppy: { fallacy: 'emotion', npc: 'vell', cost: 20,
      intro: ['Please. Please. My puppy is starving. Look at my face. Look at it!', 'If you do not give me 20 coins right now, he will not eat tonight, and it will be your fault.', 'Do you want a puppy to starve? Do you?'],
      options: [
        { key: 'ok', text: "No! Don't let him starve, that would be awful. Here, take 20 coins and buy him something." },
        { key: 'right', text: "Sorry you're upset, but feelings aren't reasons. Where's the puppy? Let's feed him." },
        { key: 'oops', text: 'Beggars are all liars.' }
      ],
      ok: [{ who: 'n', text: 'You hand over 20 coins. Vell nods sadly and walks into the Inn.', money: -20, sfx: 'lose' }, { who: 'n', text: 'Through the window, you see him order a pie. There is no puppy.' }, { scene: 'img/fail-emotion.jpg', text: 'You paid twenty coins for a sad face. Feelings are real, but they are not reasons.' }, { end: 'fail' }],
      right: [{ who: 'vell', text: "You want to feed him? He is, er, at my cousin's house. In another town." }, { who: 'vell', text: "Oh, all right. There is no puppy. You have a cool head. Take 15 coins, and I'll try honest work.", money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'vell', text: 'How dare you!' }, { who: 'n', text: 'Now everyone is shouting. Nobody asks where the puppy is.' }, { end: 'oops' }] },

    ziaCharm: { fallacy: 'postHoc', npc: 'zia', cost: 25,
      intro: ['I sell prosperity charms! They cost 25 coins, and I guarantee them!', 'The day I hung this charm on my stall, my sales doubled. They doubled on the very same day!', 'The charm caused it. Obviously. Buy one and double your coins.'],
      options: [
        { key: 'ok', text: "Sales doubled the very same day? That's proof enough for me. Sold, 25 coins." },
        { key: 'right', text: 'It came first, but did it cause it? What else changed that day?' },
        { key: 'oops', text: 'Charms are for idiots and people who believe in them deserve to lose their coins.' }
      ],
      ok: [{ who: 'n', text: 'You buy the charm and hang it on your pouch.', money: -25, sfx: 'lose' }, { who: 'n', text: 'Your coins do not double. You have 25 fewer.' }, { scene: 'img/fail-postHoc.jpg', text: 'The charm came first. Market day caused the sales. Coming first is not the same as causing.' }, { end: 'fail' }],
      right: [{ who: 'zia', text: 'What else changed? Well, that was the day I moved my stall next to the fountain.' }, { who: 'zia', text: 'Oh. Oh! The spot did it. Take 15 coins. You just saved me from buying twenty more charms.', money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'zia', text: 'Excuse me?!' }, { end: 'oops' }] },

    magsFortune: { fallacy: 'postHoc', npc: 'mags', cost: 15,
      intro: ['I will tell your fortune for 15 coins, dear. And listen, it works.', 'Last week I told a farmer he would find gold. The next day he found a gold coin in his field!', 'I said it, and then it happened. My words made it happen. Pay 15 coins and hear yours.'],
      options: [
        { key: 'ok', text: "You said it and then it happened, that can't be a coincidence. 15 coins, tell me mine." },
        { key: 'right', text: "Saying it first isn't causing it. Coins get lost in fields all the time." },
        { key: 'oops', text: 'Fortune tellers are all frauds.' }
      ],
      ok: [{ who: 'n', text: 'You pay 15 coins. Mags peers at your palm.', money: -15, sfx: 'lose' }, { who: 'mags', text: 'You will spend money today. Ah! It has already come true!' }, { scene: 'img/fail-postHoc.jpg', text: 'You paid fifteen coins. She said it first, but saying a thing is not causing it.' }, { end: 'fail' }],
      right: [{ who: 'mags', text: 'Coins get lost in fields all the time. Yes. They do.' }, { who: 'mags', text: 'You have a clear eye, dear. Take 15 coins, and do not tell my customers.', money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'mags', text: 'Frauds? I see a rude future for you.' }, { end: 'oops' }] },

    bramAuction: { fallacy: 'emotion', npc: 'bram', cost: 30,
      intro: ['Going once! I am selling this fine vase. It is only slightly cracked. It can be yours for 30 coins, friend!', 'My poor old mother painted it. She would weep to see it unsold. She would weep!', 'You would not break an old woman\'s heart over 30 coins, would you?'],
      options: [
        { key: 'ok', text: "I couldn't break an old woman's heart over a few coins. Fine, 30 coins for the vase." },
        { key: 'right', text: "Her feelings aren't a reason. Is a cracked vase worth 30? No." },
        { key: 'oops', text: 'Your mother probably cannot paint, and neither can you sell.' }
      ],
      ok: [{ who: 'n', text: 'You pay 30 coins. The vase leaks.', money: -30, sfx: 'lose' }, { who: 'bram', text: 'My mother? Oh, she is fine. She never painted a thing in her life. Sold!' }, { scene: 'img/fail-emotion.jpg', text: 'You paid thirty coins for a cracked vase and a made-up heartbreak.' }, { end: 'fail' }],
      right: [{ who: 'bram', text: 'Is it worth 30? No, it is not, is it. It is worth about 3.' }, { who: 'bram', text: 'You judge fairly! Take 15 coins. The market needs more heads like yours.', money: 15, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'bram', text: 'Leave my mother out of this!' }, { end: 'oops' }] },

    aceCards: { fallacy: 'gambler', npc: 'ace', cost: 40,
      intro: ['Pick red or black, friend. You bet 40 coins, and you win double if you guess right.', 'And listen to this. Red has come up five times in a row. Five!', 'Black is due. It is overdue! Bet on black and you cannot lose.'],
      options: [
        { key: 'ok', text: 'Five reds in a row? Black is definitely due now. 40 coins on black, turn it over.' },
        { key: 'right', text: "Cards don't remember. Five reds don't make black more likely." },
        { key: 'oops', text: 'You are a filthy card cheat and everyone at this table knows it.' }
      ],
      ok: [{ who: 'n', text: 'You put 40 coins on black. Ace turns the card over.', money: -40, sfx: 'lose' }, { who: 'n', text: 'It is red. That makes six in a row. Ace shrugs.' }, { who: 'ace', text: 'Wow. Now black is really due. Do you want to bet another 40?' }, { end: 'fail' }],
      right: [{ who: 'ace', text: "Cards don't remember. Well. You've spoiled my game." }, { who: 'ace', text: 'Take 20 coins for being honest. Most folk never work that out.', money: 20, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'ace', text: 'A cheat? Prove it.' }, { who: 'n', text: 'You cannot prove it. Nobody talks about whether black was really "due".' }, { end: 'oops' }] },

    sterlingShares: { fallacy: 'sunkCost', npc: 'sterling', cost: 50,
      intro: ['I sell shares in the Dry Gulch shaft for just 20 coins! I guarantee there is silver down there.', 'What do you say? You pay a small stake for a big future.'],
      options: [
        { key: 'stage2', text: 'All right, a small stake for a big future. 20 coins for a share.' },
        { key: 'right', text: 'No thanks. Show me the silver first.' },
        { key: 'oops', text: 'Share sellers are all crooks.' }
      ],
      stage2: [{ who: 'n', text: 'You pay 20 coins. Sterling hands you a certificate.', money: -20, sfx: 'lose' }, { who: 'sterling', text: 'Hmm, I have bad news. The shaft needs a new pump. Every shareholder must put in 30 more coins.' }, { who: 'sterling', text: 'You have already put in 20. You cannot throw that away! Pay 30 more, or you lose it all.' }, { choice: [
        { key: 'ok2', text: "I've already paid 20. If I stop now it's wasted. Here's 30 more, fix the pump." },
        { key: 'right2', text: 'The 20 is gone either way. Is the NEXT 30 worth it? No.' },
        { key: 'oops', text: 'You planned this, you snake.' }
      ] }],
      ok2: [{ who: 'n', text: 'You pay 30 more coins.', money: -30, sfx: 'lose' }, { who: 'sterling', text: 'Splendid. Oh dear, the pump broke. Can you spare another 40?' }, { who: 'n', text: 'You dropped fifty coins into a dry hole. Money you already spent is gone. It never buys the next coin back.' }, { end: 'fail' }],
      right2: [{ who: 'sterling', text: 'The 20 is gone either way. Yes. Yes, it is.' }, { who: 'sterling', text: 'Most people pay the 30. Then they pay the 40. Take your 20 back, and 20 more for the lesson.', money: 40, sfx: 'coins' }, { end: 'win' }],
      right: [{ who: 'sterling', text: 'You want to see the silver? Ah. The silver is, um, still in the ground.' }, { who: 'sterling', text: 'You are a careful investor. That is rare. Take 20 coins. Call it a dividend.', money: 20, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'sterling', text: 'Crooks! Nobody has ever insulted me so badly before lunch.' }, { end: 'oops' }] },

    gritDale: { fallacy: 'hastyGen', npc: 'grit', cost: 35,
      intro: ['Do you need tools? Buy them from me. Never buy from Dale, up the hill.', 'A fellow from Dale sold me a cracked pick once. One fellow. So all Dale folk are cheats.', 'My picks cost 35 coins. Theirs cost 15. But theirs are Dale picks.'],
      options: [
        { key: 'ok', text: "If a Dale man cheated you, the rest can't be trusted either. 35 coins for yours, then." },
        { key: 'right', text: "One cheat doesn't make all of Dale cheats. I'll judge each pick by itself." },
        { key: 'oops', text: 'You are the cheat here, old man.' }
      ],
      ok: [{ who: 'n', text: 'You pay 35 coins for a pick that looks exactly like the 15-coin one.', money: -35, sfx: 'lose' }, { scene: 'img/fail-hastyGen.jpg', text: 'You wasted twenty coins. One person from a place is not everyone from that place.' }, { end: 'fail' }],
      right: [{ who: 'grit', text: 'Judge each pick by itself. Hm. That is fair.' }, { who: 'grit', text: 'I blamed a whole town for one fellow. Take 20 coins, and buy a good pick wherever it comes from.', money: 20, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'grit', text: 'Old man?! I am barely seventy!' }, { end: 'oops' }] },

    coyleStorm: { fallacy: 'authority', npc: 'coyle', cost: 40,
      intro: ['So you want a lighthouse? The Guild Master says bright lights attract storms.', 'He is the Guild Master. He wears the gold chain. So it must be true.', 'Luckily, I sell storm-charms. Pay 40 coins and your lighthouse will be safe.'],
      options: [
        { key: 'ok', text: 'If the Guild Master says so, who am I to argue? 40 coins for a storm-charm, to be safe.' },
        { key: 'right', text: "A title isn't evidence. What's his proof that light attracts storms?" },
        { key: 'oops', text: 'The Guild Master is a pompous fool.' }
      ],
      ok: [{ who: 'n', text: 'You buy a storm-charm. It is a shell on a string.', money: -40, sfx: 'lose' }, { who: 'n', text: 'Storms arrive exactly as often as before. Important people need reasons too.' }, { end: 'fail' }],
      right: [{ who: 'coyle', text: 'His proof? He... said it at a dinner.' }, { who: 'coyle', text: 'You ask hard questions. Take 25 coins and build your light. I will not tell the Guild.', money: 25, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'coyle', text: 'I shall report that remark.' }, { end: 'oops' }] },

    boSlope: { fallacy: 'slipperySlope', npc: 'bo', cost: 30,
      intro: ['You want to build a lighthouse? Are you mad?', 'If you build a lighthouse, more ships will come. More ships will bring pirates. Pirates will burn the town. The town will be ash. Ash!', 'Unless you buy my pirate insurance. It costs 30 coins.'],
      options: [
        { key: 'ok', text: "I don't want the town to burn, and that does sound like how it goes. 30 coins for insurance." },
        { key: 'right', text: "Each step needs its own proof. A light doesn't make pirates appear." },
        { key: 'oops', text: 'You are a coward, Bo.' }
      ],
      ok: [{ who: 'n', text: 'You buy pirate insurance. It is a napkin with "INSURANCE" written on it.', money: -30, sfx: 'lose' }, { who: 'n', text: 'No pirates come. You spent thirty coins on a slide that was never real.' }, { end: 'fail' }],
      right: [{ who: 'bo', text: "Each step needs its own proof. I did run the steps together, didn't I?" }, { who: 'bo', text: 'Take 25 coins. Nobody ever stops me at step two.', money: 25, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'bo', text: 'A coward?! I have sailed through three gales!' }, { end: 'oops' }] },

    vanceStraw: { fallacy: 'strawMan', npc: 'vance', cost: 35,
      intro: [{ who: 'vance', text: 'You want a lighthouse at the end of the pier, yes?' }, { who: 'you', text: 'Yes. I want to stop the wrecks.' }, { who: 'vance', text: 'So you are saying that every ship must be forced to dock here and pay you. You want a toll on the whole sea!' }, { who: 'vance', text: 'That is outrageous. Luckily, I sell "free sea" permits. Pay 35 coins and I will tell nobody about your sea-toll.' }],
      options: [
        { key: 'ok', text: "I don't want people thinking I'd tax the sea. 35 coins for the permit, and please keep quiet." },
        { key: 'right', text: "That's not what I said. A light to stop wrecks. Nothing about tolls." },
        { key: 'oops', text: 'You lying weasel merchant.' }
      ],
      ok: [{ who: 'n', text: 'You buy a permit for a plan you never had.', money: -35, sfx: 'lose' }, { scene: 'img/fail-strawMan.jpg', text: 'You paid thirty-five coins to defend a scarecrow. Nobody said "sea toll" except Vance.' }, { end: 'fail' }],
      right: [{ who: 'vance', text: 'That is not what you said. No. It is not.' }, { who: 'vance', text: 'It is an old habit. I twist your words, and then I sell you the untwisting. Take 25 coins. You are hard to twist.', money: 25, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'vance', text: 'A weasel? I am a merchant!' }, { end: 'oops' }] },

    haleFires: { fallacy: 'tradition', npc: 'hale', cost: 45,
      intro: ['A lighthouse? Bah. We have lit bonfires on the cliff for two hundred years.', 'Two hundred years! That is how we do it, so that is the best way to do it.', 'Give 45 coins to the bonfire fund instead, like every captain before you did.'],
      options: [
        { key: 'ok', text: "Two hundred years of captains can't all be wrong. 45 coins for the bonfires, as always." },
        { key: 'right', text: "Old isn't the same as right. How many ships wrecked with the fires lit?" },
        { key: 'oops', text: 'Old sailors are too stubborn to think.' }
      ],
      ok: [{ who: 'n', text: 'You give 45 coins. The bonfire blows out in the first wind, just as it has for two hundred years.', money: -45, sfx: 'lose' }, { who: 'n', text: 'They always did it this way. Ships always wrecked.' }, { end: 'fail' }],
      right: [{ who: 'hale', text: 'How many wrecked? Still plenty. Aye. Twelve wrecked last winter.' }, { who: 'hale', text: 'Two hundred years, and I never counted. Take 25 coins for the lamp. Make it bright.', money: 25, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'hale', text: 'Stubborn? I will show you stubborn.' }, { end: 'oops' }] },

    rookInsult: { fallacy: 'adHominem', npc: 'rook', cost: 30,
      intro: ['You want Iva the Smith to forge your lamp? Her?', 'She talks funny. She comes from up the coast. She is short. You cannot trust a lamp from someone like that.', 'Buy a lamp from my cousin instead. Pay 30 coins as a deposit, today only.'],
      options: [
        { key: 'ok', text: "If she's not the trustworthy type, I'd rather not risk it. 30 coins for your cousin's lamp." },
        { key: 'right', text: "Where she's from says nothing about her lamps. Has any Iva lamp failed?" },
        { key: 'oops', text: 'You are the untrustworthy one, ugly.' }
      ],
      ok: [{ who: 'n', text: 'You pay 30 coins. The cousin does not exist.', money: -30, sfx: 'lose' }, { scene: 'img/fail-adHominem.jpg', text: 'You lost thirty coins because someone insulted a smith. Who says a thing does not make it right or wrong.' }, { end: 'fail' }],
      right: [{ who: 'rook', text: 'Has any of her lamps failed? No. Not one.' }, { who: 'rook', text: 'I was just being nasty. Take 25 coins, and get your lamp from Iva.', money: 25, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'rook', text: 'Ugly?!' }, { who: 'n', text: 'Now two people are insulting each other. Nobody talks about lamps.' }, { end: 'oops' }] },

    orlaHerring: { fallacy: 'redHerring', npc: 'orla', tag: 'story',
      intro: [{ who: 'you', text: 'Orla, the harbour fund is short by 50 coins. The ledger says you took them out.' }, { who: 'orla', text: 'The fund? Oh, look at that sunset! Have you ever seen colours like that? And look at the gulls!' }, { who: 'orla', text: 'You know what, let me tell you about the time a gull stole my hat.' }],
      options: [
        { key: 'ok', text: 'That IS a lovely sunset. Go on then, tell me about the gull and your hat.' },
        { key: 'right', text: 'The sunset can wait. Orla, did you take the 50 coins?' },
        { key: 'oops', text: 'Thief! You are a thief and everybody on this quay should know it!' }
      ],
      ok: [{ who: 'n', text: 'The gull story lasts twenty minutes. The sun sets. The fund is still short.' }, { scene: 'img/fail-redHerring.jpg', text: 'Your question never got an answer. That was the whole point of the sunset.' }, { end: 'fail' }],
      right: [{ who: 'orla', text: 'Yes. I took them to fix my boat. I was going to put them back.' }, { who: 'orla', text: 'Here are 25 of them now. I will pay the rest next week. Thank you for not letting me wriggle away.', money: 25, sfx: 'coins' }, { end: 'win' }],
      oops: [{ who: 'orla', text: 'A thief?! After all I have done for this quay?' }, { who: 'n', text: 'Now you are arguing about her character. Your question is still unanswered.' }, { end: 'oops' }] }
  };

  return { FALLACIES, LOOKS, ROLES, XP_LEVELS, START_MONEY, LEVELS, MISSIONS, TASKS, JOBS, NPCS, TRICKS };
})();
