/* Fog of Fallacy - the story arc: the Simurgh, true allies, and the Grey City.

   The Simurgh is a magic bird who appears out of nowhere and teaches the rules one level
   at a time. She promises the player a beautiful land to rule, once the monster at the end
   of the valley falls. In the Grey City the player learns the truth: the monster was never
   a beast. It was stupidity, living in every head that stopped asking why.

   Writing rules (same as js/data.js): short sentences, every sentence has a verb, words a
   seven-year-old can read. The right answer must never be the longest option. */

(function () {
  const D = window.FOG;

  /* ---------------- the Simurgh ----------------
     levels[i] runs when level i opens: `say` first, then each step in turn. A step shows its
     `goal` in the tracker; when `check` passes she comes back with `praise`, then the next
     step's `say`. Checks: talk:<id> earn crew:<n> role:<role> built:<mission> collect trick
     statue ally throne. When a level's building is finished, any steps left are skipped. */
  D.SIMURGH = {
    name: 'Simurgh',
    levels: {
      0: {
        say: ['Hello, {name}. You\'re safe. I\'m the Simurgh, the oldest bird in the world.',
          'Look at this valley. A grey fog covers it. The fog comes from bad arguments. Every time one wins, the fog grows.',
          'A great monster lives at the far end of the valley. Its breath feeds the fog. While it lives, people can\'t build anything good.',
          'You could build this valley into a beautiful place. One day you could even rule it. But first, the monster must fall.',
          'You can\'t beat it with a sword. You beat it by thinking clearly. I\'ll show you how, one step at a time.',
          'Walk with the arrow keys. Press A or Space to talk to people. Start with Elder Otto. He lives just south of here.'],
        steps: [
          { goal: 'Talk to Elder Otto. He stands outside his house, just south of here.', check: 'talk:otto',
            praise: ['Good. Now you know what the village needs. It needs a well.'] },
          { goal: 'Earn some coins. Help someone with a yellow !, or carry water for Baker Hana.', check: 'earn',
            say: ['A well costs coins. You earn coins by doing honest work.', 'People with a yellow ! have jobs for you. You can also carry the buckets by the river.'],
            praise: ['Your first coins! Honest work always pays.'] },
          { goal: 'Talk to Mo the Mason. Pick the answer that clears the fog from his head.', check: 'crew:1',
            say: ['A well needs builders. Mo the Mason sits by the north lane. But his head is full of fog.', 'He believes a bad idea. Listen to him. Then pick the answer that shows why he is wrong.'],
            praise: ['You cleared his head! Now he\'s working with you. That\'s how you win people over. You give good reasons, and you never use insults.'] },
          { goal: 'Find Wren, the water engineer, by the river. Clear the fog from her head too.', check: 'role:water',
            say: ['The well needs a water engineer too. Wren camps on the sandy beach by the river, to the east.'],
            praise: ['You have two experts! Now you just need coins for the stones and their pay.'] },
          { goal: 'Build the well. Walk to the glowing spot in the square and press A.', check: 'built:well',
            say: ['The well will go on the glowing spot in the village square. Press A there to see the cost.'] }
        ]
      },
      1: {
        say: ['You built your first building, {name}! Now everyone has clean water.',
          'Here\'s a secret. A building keeps paying you. People pay a coin each time they use the well.',
          'The coins pile up inside it. Walk to the well and press A to collect them.',
          'Now I must warn you. Tricksters live in this valley. They use bad arguments to take your coins.',
          'A red ! means someone wants your money. Pip and Dodge in the village have new games too.',
          'Before you pay anyone, ask yourself one thing. Is that a good reason?'],
        steps: [
          { goal: 'Collect the coins from the well. Walk up to it and press A.', check: 'collect',
            praise: ['Your building paid you. The more you build, the more you earn.'] },
          { goal: 'Beat a trickster. Talk to someone with a red ! and spot the bad argument.', check: 'trick',
            praise: ['You kept your coins! A clear head is the best purse there is.'] },
          { goal: 'Build the bridge. It needs a carpenter, a surveyor and a mason.', check: 'built:bridge' }
        ]
      },
      2: {
        say: ['{name}, I must tell you something. We are halfway to the monster now, and it has noticed you.',
          'Look for men in long black robes and white turbans. They are the Grey Order. They serve the monster.',
          'They walk out of the grey lodges. They look for the people whose heads you cleared.',
          'They talk and talk, and when they leave, the fog is back. You can\'t talk to them. They won\'t listen.',
          'When a red banner appears at the top, a preacher is out. It tells you who he is walking to.',
          'There\'s a way to stop them. Build a statue of Aristotle on a stone plinth. Nobody inside its circle can be fooled.'],
        steps: [
          { goal: 'Build a Statue of Aristotle on a glowing stone plinth. You need a mason and some coins.', check: 'statue',
            praise: ['Aristotle stands guard now. Keep your friends inside his circle.'] },
          { goal: 'Build the Engineering School. Walk to its glowing site to see who you need.', check: 'built:school' }
        ]
      },
      3: {
        say: ['The Grey Order is getting bolder, {name}.',
          'Now the preachers also visit the people who give you work. They turn them against you.',
          'A red ✗ over somebody means they refuse you. Talk to them and answer the preacher\'s argument.',
          'Remember this too. When you clear every fog from an expert\'s head, they become a true ally. No preacher can fool a true ally.'],
        steps: [
          { goal: 'Make a true ally. Clear every fog from one expert. The Crew panel shows who\'s close.', check: 'ally',
            praise: ['A true ally stands with you. Watch the top of the screen for news of your coins.'] },
          { goal: 'Build the Waterwheel Mill by the river.', check: 'built:mill' }
        ]
      },
      4: {
        say: ['This is the last town before the monster\'s city, {name}.',
          'Every trick you have met lives here, all at once. The preachers come out often now.',
          'Build the lighthouse at the end of the pier. Its light will show you the road to the monster.'],
        steps: [
          { goal: 'Build the lighthouse at the end of the pier. It needs six experts.', check: 'built:lighthouse' }
        ]
      },
      5: {
        say: ['{name}, look where the beam points. Those grey walls in the east are the Grey City.',
          'The monster lives there. Its shadow hangs over the palace, and the throne waits beneath it.',
          'I can\'t fly into that city. The fog is too thick for my wings. You must go alone.',
          'Everyone in the city breathes the monster\'s fog. The whole city will be against you.',
          'They won\'t listen easily. If you give one wrong answer, they laugh, and you must start over.',
          'But you only need one of them. One clear head in the Grey City is enough.'],
        steps: [
          { goal: 'Walk east along the quay to the Grey City. Convince one person there.', check: 'throne' }
        ]
      }
    },

    /* One-off visits the first time something happens. */
    events: {
      ally: ['{name}, look! Your friend has a clear head now. Every fog is gone. That makes them a true ally.',
        'Nobody can fog a true ally again. Not a trickster, and not a preacher.',
        'True allies help you, too. They walk to your buildings and collect the coins for you.',
        'They keep one coin in every five for their trouble. That\'s fair, is it not?'],
      fogged: ['Oh no, {name}. A preacher reached one of your friends.',
        'Their head is foggy again, so they left your crew. The Crew panel shows who it was.',
        'Go and talk to them. A good reason clears the fog, just like before.'],
      refused: ['A preacher turned somebody against you. A red ✗ floats over their head.',
        'Talk to them and answer the preacher\'s argument. Then they will work with you again.'],
      fooled: ['Don\'t worry, {name}. Everybody gets fooled sometimes. It happened to me once, a long time ago.',
        'Read the card. It shows the trick and the better answer. Then try again.']
    },

    /* The reveal, after the player convinces somebody in the Grey City. */
    ending: ['I\'m here, {name}. I could fly into the city at last. The fog is breaking.',
      'Now you know the secret. There never was a beast.',
      'The monster was stupidity. It lived in every head that stopped asking why.',
      'It grew fat on every bad argument that nobody questioned. That was its only food.',
      'You fought it all along. Every trick you spotted cut it. Every head you cleared made it smaller.',
      'Today one person in the Grey City asked why. That was enough. The monster is gone.',
      'The throne is yours. Rule this land well, and never stop asking why.']
  };

  /* ---------------- true allies ----------------
     An expert with every fog cleared is a true ally: preachers cannot fog them, and they walk
     to your buildings to collect the coins, keeping `share` of what they bring back. */
  D.ALLY = { share: 0.2, everySec: 30, minCoins: 10 };

  /* ---------------- the Grey City ---------------- */
  D.CITY = {
    throne: { x: 78, y: 61 },
    palace: { x: 78.5, y: 61.5 },   // where the monster's shadow sits (tile units)
    lift: ['All over the city, people stop and blink. They look as if they just woke up.',
      'The dark shadow over the palace shivers. Then it breaks apart like smoke in the wind.',
      'There\'s nothing inside it. There never was.'],
    sit: ['You climb the palace steps and sit on the throne.',
      'Below you, the Grey City turns green. The whole valley shines in the sun.']
  };

  D.FLAVOR.throne = 'A tall stone throne. It\'s empty, and it is waiting.';
  D.FLAVOR.dryfountain = 'The fountain is dry. Grey dust fills the bowl.';

  const grey = (o) => Object.assign({ size: 'l', skin: '#C9BCA4', hair: '#6E6A62', hairStyle: 'short', shirt: '#8E8A80', pants: '#5B5652', frown: true }, o);

  /* Everyone in the Grey City is already fogged. Four of them can be convinced, but only with three
     right answers in a row; one wrong answer and they laugh and you start again. The rest only jeer. */
  D.NPCS.push(
    { id: 'morn', name: 'Gate Warden Morn', x: 67, y: 67, dir: 'down', region: 5, v: 'old', spec: grey({ size: 'xl', skin: '#F1C9A5', hair: '#DDDDDD', beard: true, hat: '#5B5652' }),
      city: {
        intro: ['Stop right there, person you don\'t know. Nobody comes to the Grey City to change it.', 'Everyone here knows the truth. Builders feed the monster. Every new thing makes it stronger.'],
        gauntlet: [
          { fallacy: 'authority', topic: 'The High Preacher said so',
            intro: ['The High Preacher himself says it. He has the tallest hat in the city. He must know.'],
            options: [
              { text: 'A tall hat isn\'t a reason. How does building feed a monster?', right: true },
              { text: 'He is the High Preacher, so he has studied the monster far longer than a young builder like me.' },
              { text: 'The High Preacher is a liar, and liars like him should be locked up in the palace cellar.' },
              { text: 'Maybe he is right, so from now on I\'ll only build small things that the monster won\'t notice.' }
            ],
            right: ['How does it feed it? He never said. Nobody ever asked him.'],
            wrong: ['You see? Even you agree with him.', { who: 'n', text: 'Morn laughs. The gate guards laugh too. You will have to start over.' }] },
          { fallacy: 'tradition', topic: 'Five hundred years of grey',
            intro: ['But this city has always been grey. For five hundred years, nobody built anything new.', 'Five hundred years of grey. That\'s our way.'],
            options: [
              { text: 'Old isn\'t the same as right. Has the grey made anyone happy?', right: true },
              { text: 'Five hundred years is a very long time, so the grey way must have something good hidden in it somewhere.' },
              { text: 'Your grandparents were fools, and their grandparents were even bigger fools than they were.' },
              { text: 'Then I\'ll build only grey things, so that nothing in this city changes very much at all.' }
            ],
            right: ['Happy? No. Nobody here is happy. I never thought about it before.'],
            wrong: ['Grey it is, then. As always.', { who: 'n', text: 'Morn laughs and folds his arms. You will have to start over.' }] },
          { fallacy: 'adHominem', topic: 'A child from a goat village',
            intro: ['Still, look at you. You are a child from a village full of goats.', 'What does a goat child know about monsters?'],
            options: [
              { text: 'Where I come from isn\'t an answer. Look at what I built.', right: true },
              { text: 'I\'m much older than I look, and I have faced far scarier things than goats on my way here.' },
              { text: 'You are an old man with a silly hat, so you know even less about monsters than I do.' },
              { text: 'You are right, I\'m only a child, but surely children are allowed to try as well, are they not?' }
            ],
            right: ['What you built. A well, a bridge, a school, a mill and a lighthouse.', 'And I have built nothing but a wall of words.'],
            wrong: ['A goat child. Exactly.', { who: 'n', text: 'Morn laughs so hard his hat falls off. You will have to start over.' }] }
        ],
        convinced: ['Wait. The fog in my head is getting thinner.', 'You are right. We never asked why. Not once in five hundred years.'],
        after: ['I opened the gate wide this morning. Everybody is welcome now.']
      } },
    { id: 'vesna', name: 'Crier Vesna', x: 76, y: 65, dir: 'down', region: 5, v: 'woman', spec: grey({ size: 'm', skin: '#F5D7B8', hair: '#8B4A1F', hairStyle: 'long', shirt: '#9A958C', bandana: '#6E6A62' }),
      city: {
        intro: ['Hear ye! Hear ye! A builder is in the city! Everybody, shut your windows!', 'Everybody agrees you are unsafe. I have yelled it on every corner.'],
        gauntlet: [
          { fallacy: 'bandwagon', topic: 'The whole city agrees',
            intro: ['The whole city agrees about you. Every single person. When everybody agrees, it must be true.'],
            options: [
              { text: 'Everybody agreeing isn\'t proof. What have I done wrong?', right: true },
              { text: 'If the whole city agrees, then I must have done something bad, so I should leave before it gets worse.' },
              { text: 'Everybody in this city is a sheep, so it doesn\'t matter one bit what any of them think.' },
              { text: 'Not everybody agrees, I\'m sure a few people secretly like me, so the crowd must be wrong.' }
            ],
            right: ['What have you done wrong? Hmm. Nobody said. They only said that everybody knew.'],
            wrong: ['Everybody knows it! Even you!', { who: 'n', text: 'Vesna rings her bell and laughs. You will have to start over.' }] },
          { fallacy: 'slipperySlope', topic: 'One builder wakes the monster',
            intro: ['If we let one builder in, more will come. Then they will build towers. The towers will wake the monster. Then the monster will eat us all!'],
            options: [
              { text: 'Each step needs its own proof. Does one builder wake a monster?', right: true },
              { text: 'That does sound awful, so maybe I should only build at night, while the monster is asleep.' },
              { text: 'Towers are ugly anyway, so nobody in the whole city should ever build one, not even me.' },
              { text: 'The monster only eats people who shout a lot, so you should really be worried about yourself.' }
            ],
            right: ['Does one builder wake a monster? I just yelled all the steps together. I do that a lot.'],
            wrong: ['Eaten! All of us!', { who: 'n', text: 'Vesna shouts it down the street and laughs. You will have to start over.' }] },
          { fallacy: 'emotion', topic: 'The crying children',
            intro: ['Think of the poor children, builder! They are so scared of you. They cry at night!', 'How can you do this to crying children?'],
            options: [
              { text: 'Tears are real, but they aren\'t a reason. What scares them?', right: true },
              { text: 'I would never want to make a child cry, so I\'ll leave the city right now and never come back.' },
              { text: 'Children cry about everything, so their tears don\'t count for anything at all.' },
              { text: 'Then please tell the children that I\'m nice, and give them a bag of sweets from me.' }
            ],
            right: ['What scares them? The stories. My stories. I told them that builders were monsters.'],
            wrong: ['The poor little things!', { who: 'n', text: 'Vesna wipes a fake tear and laughs. You will have to start over.' }] }
        ],
        convinced: ['Oh. Oh no. I have been yelling fog all over this city.', 'Hear ye! Hear ye! Maybe we should all ask why!'],
        after: ['Hear ye! Hear ye! The fog is gone! Ask questions, everybody!']
      } },
    { id: 'hollis', name: 'Scribe Hollis', x: 83, y: 64, dir: 'left', region: 5, v: 'man', spec: grey({ size: 'm', skin: '#8D5A3B', hair: '#1E1410', shirt: '#B8B3A8', glasses: true }),
      city: {
        intro: ['I write everything down. And I wrote down what happened after the last builder came here.'],
        gauntlet: [
          { fallacy: 'postHoc', topic: 'The coldest winter',
            intro: ['A builder came here fifty years ago. The next winter was the coldest ever.', 'The builder came first. So the builder caused it. It\'s in my book.'],
            options: [
              { text: 'Coming first isn\'t causing. What else happened that winter?', right: true },
              { text: 'If it is written in your book, you must have checked it very carefully, so it is probably true.' },
              { text: 'Winters are always cold in this place, so that builder did nothing at all to anybody.' },
              { text: 'Then I\'ll leave the city before winter comes, so nobody can blame me for the snow.' }
            ],
            right: ['What else happened? That winter froze the whole kingdom. Even places with no builders at all.'],
            wrong: ['It\'s in the book, so it is true.', { who: 'n', text: 'Hollis taps his book and laughs. You will have to start over.' }] },
          { fallacy: 'hastyGen', topic: 'The builder who cheated',
            intro: ['That builder also cheated the baker. One builder cheated. So all builders cheat.'],
            options: [
              { text: 'One person isn\'t everyone. Judge me by what I do.', right: true },
              { text: 'That builder sounds awful, and I\'m sorry, so I\'ll pay the baker back for him myself.' },
              { text: 'The baker probably cheated the builder first, so the builder was only being fair.' },
              { text: 'Most builders are very honest people, and I\'m quite sure you knew that already.' }
            ],
            right: ['Judge you by what you do. Hmm. I haven\'t written a single word about what you do.'],
            wrong: ['All builders. It\'s written.', { who: 'n', text: 'Hollis writes "cheat" next to your name and laughs. You will have to start over.' }] },
          { fallacy: 'falseDilemma', topic: 'Two kinds of people',
            intro: ['So there are two kinds of people. Grey City people are safe. People from outside are unsafe.', 'You are an outsider. So you are unsafe.'],
            options: [
              { text: 'Why only two kinds? People from far away can be kind.', right: true },
              { text: 'Then let me become a Grey City person, and I\'ll stop being unsafe straight away.' },
              { text: 'Grey City people are the unsafe ones, and people from outside are the safe ones, not the other way round.' },
              { text: 'There are three kinds, because children are neither safe nor unsafe, they are just children.' }
            ],
            right: ['Two kinds. I wrote that on the first page of my book. I never checked it.'],
            wrong: ['Two kinds. Page one.', { who: 'n', text: 'Hollis closes his book with a snap and laughs. You will have to start over.' }] }
        ],
        convinced: ['I\'ll need a new book. This one is full of fog.', 'Thank you. My head feels like a clean page.'],
        after: ['I started a new book today. The first page says: ask why.']
      } },
    { id: 'rue', name: 'Mother Rue', x: 70, y: 75, dir: 'up', region: 5, v: 'old', spec: grey({ size: 'l', skin: '#C68B59', hair: '#DDDDDD', hairStyle: 'bun', shirt: '#7A7570', apron: '#9A958C' }),
      city: {
        intro: ['Sit down, dear. Have some grey bread. Everything in this city is grey. Even the bread.'],
        gauntlet: [
          { fallacy: 'sunkCost', topic: 'Three hundred years of tax',
            intro: ['We have paid the Grey Order a tax for three hundred years, to keep the monster calm.', 'Three hundred years of coins! If we stop now, all those coins were for nothing.'],
            options: [
              { text: 'The old coins are gone either way. Does the next coin help?', right: true },
              { text: 'Three hundred years of coins is a lot, so you should keep paying until you get your money\'s worth.' },
              { text: 'Stop paying today, and make the Order give back every single coin since the very start.' },
              { text: 'The Order is full of thieves, so of course every one of those coins was for nothing.' }
            ],
            right: ['Does the next coin help? The monster isn\'t calm. It never was.'],
            wrong: ['Keep paying. Yes, dear.', { who: 'n', text: 'Mother Rue pats your hand and chuckles. You will have to start over.' }] },
          { fallacy: 'strawMan', topic: 'Tearing the city down',
            intro: [{ who: 'rue', text: 'The preachers say you want to tear down the city and build a castle for yourself.' }, { who: 'you', text: 'I never said that. I want to clear the fog.' }, { who: 'rue', text: 'Oh, but that is what clearing the fog means, dear. It means tearing it all down!' }],
            options: [
              { text: 'That isn\'t what I said. Clearing fog tears nothing down.', right: true },
              { text: 'I would only tear down the ugly parts of the city, and all the nice parts could stay.' },
              { text: 'The preachers are liars, so whatever they say, the opposite must always be true.' },
              { text: 'Even if I did build a castle, it would be a very nice castle, and everybody could visit it.' }
            ],
            right: ['Tears nothing down. No. They said it for you, and I believed them.'],
            wrong: ['Tearing it down! I knew it.', { who: 'n', text: 'Mother Rue shakes her head and chuckles. You will have to start over.' }] },
          { fallacy: 'redHerring', topic: 'Albert the pigeon',
            intro: [{ who: 'you', text: 'Mother Rue, why is the city afraid of me?' }, { who: 'rue', text: 'Afraid? Oh, look at the pigeons! Grey pigeons, grey roofs. Do you like pigeons, dear?' }, { who: 'rue', text: 'I had a pigeon once. His name was Albert.' }],
            options: [
              { text: 'Albert can wait. Why is the city afraid of me?', right: true },
              { text: 'I do like pigeons, actually, and I would love to hear the whole story about Albert.' },
              { text: 'Pigeons are dirty birds, and nobody should keep one in the house.' },
              { text: 'If the city likes pigeons, then maybe I can win everyone over with a big bag of birdseed.' }
            ],
            right: ['Why is it afraid? Because the preachers said so. I have no other reason. Not one.'],
            wrong: ['Albert was a lovely bird. Let me tell you all about him.', { who: 'n', text: 'An hour later, you still have no answer. You will have to start over.' }] }
        ],
        convinced: ['Three hundred years, and nobody ever asked me a straight question.', 'Thank you, dear. Go on. The palace is waiting for you.'],
        after: ['Have some bread, dear. It\'s brown now. It tastes much better.']
      } },
    { id: 'grey1', name: 'Grey Citizen', x: 74, y: 70, dir: 'right', region: 5, v: 'man', spec: grey({ size: 'l', skin: '#F1C9A5', hair: '#4A2E1A' }),
      talk: ['Go away, builder. Everybody knows builders feed the monster.'],
      city: { after: ['The fog is gone! I can see the sea from my window!'] } },
    { id: 'grey2', name: 'Grey Citizen', x: 81, y: 67, dir: 'left', region: 5, v: 'woman', spec: grey({ size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'bun' }),
      talk: ['If you were any good, the preachers would like you. They don\'t like you. So you are bad.'],
      city: { after: ['I asked the preachers why. They had no answer, so they left.'] } },
    { id: 'grey3', name: 'Grey Child', x: 84, y: 70, dir: 'left', region: 5, v: 'kid', spec: grey({ size: 's', skin: '#F5D7B8', hair: '#E0A23A', frown: false }),
      talk: ['My mum says the monster eats questions. So I never ask any.'],
      city: { after: ['Why is the sky blue? Why do cats purr? I have so many questions now!'] } }
  );
})();
