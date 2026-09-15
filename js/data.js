/* Fog of Fallacy - content for a young reader (about age 5).
   Short lines, one idea each, a picture for every trick and every place.
   Each dialogue line: { who, text, f (trick id or null), why }. */

window.FOG = (function () {

  const CAST = {
    pip:   { name: 'Pip',           emoji: '🐉' },
    sly:   { name: 'Sly Fox',       emoji: '🦊', img: 'img/cast-sly.jpg', villain: true },
    bea:   { name: 'Bea Bear',      emoji: '🐻', img: 'img/cast-bea.jpg' },
    ollie: { name: 'Ollie Owl',     emoji: '🦉', img: 'img/cast-ollie.jpg' },
    milo:  { name: 'Milo Mouse',    emoji: '🐭', img: 'img/cast-milo.jpg' },
    hazel: { name: 'Hazel',         emoji: '🦔', img: 'img/cast-hazel.jpg' },
    rex:   { name: 'Rex Raccoon',   emoji: '🦝', img: 'img/cast-rex.jpg' },
    tilly: { name: 'Tilly Turtle',  emoji: '🐢', img: 'img/cast-tilly.jpg' },
    goose: { name: 'Grandma Goose', emoji: '🦢', img: 'img/cast-goose.jpg' }
  };

  const FALLACIES = [
    {
      id: 'adHominem', name: 'Ad Hominem', nick: 'The Insult Trick', icon: '🗯️', img: 'img/trick-adHominem.jpg',
      one: 'Being mean about WHO said it, not WHAT they said.',
      spot: 'Is it about the idea? Or about the person?',
      examples: [
        { who: 'rex', text: 'You\'re small, so your idea is silly.', why: 'Small has nothing to do with the idea.' },
        { who: 'sly', text: 'Don\'t listen to Hazel. She\'s the youngest.', why: 'Young doesn\'t make an idea bad.' }
      ],
      drills: [
        'You wear funny socks, so you\'re wrong.',
        'Rex is late a lot. Ignore his idea.',
        'Tilly is slow, so her plan is bad.',
        'You\'re new, so your answer is wrong.'
      ]
    },
    {
      id: 'bandwagon', name: 'Bandwagon', nick: 'Everyone\'s Doing It', icon: '🐑', img: 'img/trick-bandwagon.jpg',
      one: 'It must be right, because everyone does it.',
      spot: 'Listen for "everyone" and "nobody".',
      examples: [
        { who: 'rex', text: 'Everyone jumps the queue, so it\'s fine.', why: 'Lots of people doing it doesn\'t make it right.' },
        { who: 'milo', text: 'All my friends skip brushing. So can I!', why: 'Friends doing it isn\'t a reason.' }
      ],
      drills: [
        'Everyone skips breakfast, so it\'s healthy.',
        'All the kids climb the fence. It\'s fine.',
        'Nobody reads the sign, so it doesn\'t matter.',
        'You\'re the only one, so you\'re wrong.'
      ]
    },
    {
      id: 'falseDilemma', name: 'False Dilemma', nick: 'Only Two Doors', icon: '🚪', img: 'img/trick-falseDilemma.jpg',
      one: 'Only two choices, when there are really more.',
      spot: 'Look for a third door.',
      examples: [
        { who: 'rex', text: 'Play my game, or go home.', why: 'You could play a different game together.' },
        { who: 'sly', text: 'Eat it all, or you get nothing.', why: 'You could eat some of it.' }
      ],
      drills: [
        'Lend me your bike or we\'re not friends.',
        'Inside and bored, or outside and wet. Pick!',
        'Eat all your peas or no dinner at all.',
        'Play football or you hate sports.'
      ]
    },
    {
      id: 'strawMan', name: 'Straw Man', nick: 'The Scarecrow', icon: '🌾', img: 'img/trick-strawMan.jpg',
      one: 'Changing what you said into something silly.',
      spot: 'Is that really what they said?',
      examples: [
        { who: 'rex', text: '"Less candy"? So you want NO fun ever!', why: 'Less candy is not no fun.' },
        { who: 'sly', text: '"Let\'s share"? So you want ALL my toys!', why: 'Sharing is not taking everything.' }
      ],
      drills: [
        'You want to walk? So you hate cars!',
        'Quiet please? So nobody can ever talk!',
        'Wash your paws? So we\'re all filthy!',
        'Stay in tonight? So you hate friends!'
      ]
    },
    {
      id: 'postHoc', name: 'Post Hoc', nick: 'The Lucky Socks', icon: '🧦', img: 'img/trick-postHoc.jpg',
      one: 'It came first, so it must have caused it.',
      spot: 'Did it really cause it? Or just come first?',
      examples: [
        { who: 'milo', text: 'I wore green socks and won. Magic socks!', why: 'Practice won the race, not socks.' },
        { who: 'rex', text: 'The rooster crowed, then the sun came up. Rooster did it!', why: 'The sun comes up anyway.' }
      ],
      drills: [
        'I sneezed and the light went out. My sneeze!',
        'The bakery opened, then it rained. Bakery made rain.',
        'I ate a carrot, then got a star. Carrots!',
        'Grandma sat down, then it rained. Grandma\'s fault.'
      ]
    },
    {
      id: 'hastyGen', name: 'Hasty Generalization', nick: 'The Big Jump', icon: '🦘', img: 'img/trick-hastyGen.jpg',
      one: 'One example, then a rule about everyone.',
      spot: 'How many did they really see?',
      examples: [
        { who: 'hazel', text: 'One grumpy cat. All cats are grumpy!', why: 'One cat isn\'t all cats.' },
        { who: 'milo', text: 'One yucky berry. All berries are yucky!', why: 'One berry isn\'t all berries.' }
      ],
      drills: [
        'One boring book. All books are boring.',
        'Two loud kids. Everyone here is loud.',
        'It rained two Saturdays. It always rains Saturdays.',
        'My first swim was hard. I\'ll never swim.'
      ]
    },
    {
      id: 'emotion', name: 'Appeal to Emotion', nick: 'The Tear Trick', icon: '😢', img: 'img/trick-emotion.jpg',
      one: 'Making you feel sad or scared, instead of a reason.',
      spot: 'Is it a reason? Or just feelings?',
      examples: [
        { who: 'sly', text: 'Buy it, or the bunny will cry.', why: 'A sad bunny is not a reason.' },
        { who: 'rex', text: 'If you loved me, you\'d let me stay up.', why: 'Love is not a reason to stay up.' }
      ],
      drills: [
        'If you loved me you\'d let me stay up.',
        'Think how sad the toy will be.',
        'Do it, or something scary will happen.',
        'Don\'t be cross. My hamster is sick.'
      ]
    },
    {
      id: 'redHerring', name: 'Red Herring', nick: 'The Sneaky Squirrel', icon: '🐿️', img: 'img/trick-redHerring.jpg',
      one: 'Changing the subject to dodge the question.',
      spot: 'Did they answer the question?',
      examples: [
        { who: 'rex', text: '"Did you eat the cake?" "Look, a butterfly!"', why: 'The butterfly dodges the question.' },
        { who: 'sly', text: '"Where\'s your homework?" "Owls can turn their heads!"', why: 'Owls have nothing to do with homework.' }
      ],
      drills: [
        'Who ate the cake? Well, nobody thanks me!',
        'Is the bridge safe? Look at those flowers!',
        'Where\'s your reading? Owls turn their heads!',
        'Did I break it? The sun is shining!'
      ]
    }
  ];

  /* Fair statements for practice. None of these is a trick. */
  const FAIR_LINES = [
    { text: 'Let\'s bring umbrellas. The sky is grey.', why: 'A real reason.' },
    { text: 'This shop is cheaper. I checked three.', why: 'She checked.' },
    { text: 'The sign says the bridge is safe.', why: 'A fact from the sign.' },
    { text: 'I don\'t know. Let\'s ask everyone.', why: 'No jumping to answers.' },
    { text: 'Last time we were late. Let\'s go earlier.', why: 'Learning from last time.' },
    { text: 'Good idea. Let\'s mix your plan and mine.', why: 'A third door.' },
    { text: 'The doctor said rest helps you get better.', why: 'A doctor knows about that.' },
    { text: 'I\'m not sure yet. Let me look.', why: 'Honest.' },
    { text: 'There\'s a third way. The lake!', why: 'A new door.' },
    { text: 'You\'re right. I was late. Sorry.', why: 'No dodge.' }
  ];

  const CHAPTERS = [
    {
      n: 1, title: 'The Playground', place: 'Under the big oak', img: 'img/scene-1.jpg',
      unlocks: ['adHominem', 'bandwagon'],
      intro: [
        'The Fog comes when a bad argument wins.',
        'Sly Fox loves bad arguments.',
        'Crack! An egg opens. It\'s Pip. Pip grows when you catch a trick.'
      ]
    },
    {
      n: 2, title: 'The Market', place: 'Market day', img: 'img/scene-2.jpg',
      unlocks: ['falseDilemma', 'strawMan'],
      intro: [
        'Market day! Sly has a golden stall.',
        'The fog hangs over it like a blanket.'
      ]
    },
    {
      n: 3, title: 'The River', place: 'The beaver dam', img: 'img/scene-3.jpg',
      unlocks: ['postHoc', 'hastyGen'],
      intro: [
        'The river. The fog is thickest here.',
        'Pip can glide now. Let\'s go!'
      ]
    },
    {
      n: 4, title: 'The Big Vote', place: 'The Council Hall', img: 'img/scene-4.jpg',
      unlocks: ['emotion', 'redHerring'],
      intro: [
        'Voting day! Sly is on the stage.',
        'Pip has never been so ready.'
      ]
    }
  ];

  const SCENES = [
    /* ---------------- Chapter 1 ---------------- */
    {
      id: 'c1s1', chapter: 1, title: 'The Swing', where: 'First break',
      lines: [
        { who: 'milo', text: 'Let\'s take turns on the swing.', f: null, why: 'A fair idea.' },
        { who: 'rex', text: 'You\'re tiny, Milo. Your idea is tiny too.', f: 'adHominem', why: 'Tiny doesn\'t make an idea bad.' },
        { who: 'hazel', text: 'Turns sound good to me.', f: null, why: 'She talks about the idea.' },
        { who: 'rex', text: 'Everyone just grabs the swing. That\'s the rule.', f: 'bandwagon', why: 'Lots of kids doing it doesn\'t make it right.' }
      ]
    },
    {
      id: 'c1s2', chapter: 1, title: 'Glow Shoes', where: 'Outside the bakery',
      lines: [
        { who: 'rex', text: 'Everyone has glow shoes. They\'re the best.', f: 'bandwagon', why: 'Everyone having them doesn\'t make them best.' },
        { who: 'bea', text: 'Are they comfy?', f: null, why: 'A good question.' },
        { who: 'rex', text: 'You bake bread. What do you know about shoes?', f: 'adHominem', why: 'Mean about Bea, not about the question.' },
        { who: 'hazel', text: 'I tried them. The bottoms are thin.', f: null, why: 'She really tried them.' }
      ]
    },
    {
      id: 'c1b', chapter: 1, boss: true, title: 'Sly at the Fence', where: 'The torn sign',
      lines: [
        { who: 'milo', text: 'Sly, why did you rip our swing sign?', f: null, why: 'A question.' },
        { who: 'sly', text: 'A little mouse asking me? How cute.', f: 'adHominem', why: 'Milo\'s size is not an answer.' },
        { who: 'hazel', text: 'The sign stopped the fights.', f: null, why: 'That\'s what happened.' },
        { who: 'sly', text: 'Nobody liked that sign. Everybody says so.', f: 'bandwagon', why: 'Even if lots didn\'t like it, it worked.' },
        { who: 'ollie', text: 'I liked it. Twelve kids signed it.', f: null, why: 'A fact.' },
        { who: 'sly', text: 'Says the owl who sleeps all day!', f: 'adHominem', why: 'Sleeping in the day has nothing to do with it.' }
      ],
      rebuttal: {
        prompt: 'Sly says nobody liked the sign. What do you say?',
        options: [
          { text: 'Maybe. But it stopped the fights.', good: true, why: 'You went back to what really happened.' },
          { text: 'You\'re a smelly fox!', good: false, why: 'That\'s the Insult Trick.' }
        ]
      }
    },

    /* ---------------- Chapter 2 ---------------- */
    {
      id: 'c2s1', chapter: 2, title: 'Apples', where: 'The fruit stall',
      lines: [
        { who: 'bea', text: 'Apples are two coins each.', f: null, why: 'Just the price.' },
        { who: 'rex', text: 'One coin, or I never come back!', f: 'falseDilemma', why: 'More choices: buy one, or buy a pear.' },
        { who: 'milo', text: 'I need three apples for a pie.', f: null, why: 'Just what he needs.' },
        { who: 'rex', text: 'So Milo says nobody can buy more than three!', f: 'strawMan', why: 'Milo never said that.' }
      ]
    },
    {
      id: 'c2s2', chapter: 2, title: 'Less Sugar', where: 'The bakery',
      lines: [
        { who: 'bea', text: 'A little less sugar in the buns.', f: null, why: 'A small, clear idea.' },
        { who: 'sly', text: 'Bea wants to ban ALL sweets!', f: 'strawMan', why: 'Bea said a little less. Not none.' },
        { who: 'hazel', text: 'She said a little less, Sly.', f: null, why: 'She says what Bea really said.' },
        { who: 'sly', text: 'Buns are sweet, or buns are bricks. Pick!', f: 'falseDilemma', why: 'There\'s lots in between.' }
      ]
    },
    {
      id: 'c2b', chapter: 2, boss: true, title: 'Sly\'s Stall', where: 'The golden tent',
      lines: [
        { who: 'goose', text: 'Why are your prices double, dear?', f: null, why: 'A question.' },
        { who: 'sly', text: 'Pay my price, or go hungry!', f: 'falseDilemma', why: 'There are six other stalls.' },
        { who: 'goose', text: 'There are six other stalls.', f: null, why: 'A fact.' },
        { who: 'sly', text: 'So Grandma wants me to give it all away free?', f: 'strawMan', why: 'Nobody said free.' },
        { who: 'tilly', text: 'She said other stalls. Not free.', f: null, why: 'She fixes the words.' },
        { who: 'sly', text: 'Who listens to a slow old turtle?', f: 'adHominem', why: 'Slow has nothing to do with it.' }
      ],
      rebuttal: {
        prompt: 'Sly says pay or go hungry. What do you say?',
        options: [
          { text: 'There are other stalls. I\'ll go there.', good: true, why: 'You found the third door.' },
          { text: 'Everyone hates your stall!', good: false, why: 'That\'s Everyone\'s Doing It.' }
        ]
      }
    },

    /* ---------------- Chapter 3 ---------------- */
    {
      id: 'c3s1', chapter: 3, title: 'Lucky Goggles', where: 'Swim lane three',
      lines: [
        { who: 'milo', text: 'I wore green goggles and won. Magic goggles!', f: 'postHoc', why: 'He also practised every day.' },
        { who: 'tilly', text: 'You practised every morning, Milo.', f: null, why: 'The real reason.' },
        { who: 'hazel', text: 'One goggle broke. All goggles are rubbish!', f: 'hastyGen', why: 'One goggle isn\'t all goggles.' },
        { who: 'tilly', text: 'Let\'s try another pair first.', f: null, why: 'Check before deciding.' }
      ]
    },
    {
      id: 'c3s2', chapter: 3, title: 'The Creaky Bridge', where: 'The old footbridge',
      lines: [
        { who: 'rex', text: 'The bridge creaked after Tilly. Tilly broke it!', f: 'postHoc', why: 'It creaked before, too.' },
        { who: 'tilly', text: 'It creaked all spring, before me.', f: null, why: 'A fact.' },
        { who: 'rex', text: 'One creaky bridge. All bridges are dangerous!', f: 'hastyGen', why: 'One bridge isn\'t all bridges.' },
        { who: 'goose', text: 'Let\'s ask the beavers to check it.', f: null, why: 'A good plan.' }
      ]
    },
    {
      id: 'c3b', chapter: 3, boss: true, title: 'Sly at the Dam', where: 'The beaver dam',
      lines: [
        { who: 'ollie', text: 'Sly, why do you say the dam is bad?', f: null, why: 'A question.' },
        { who: 'sly', text: 'My tail got wet after the dam. The dam did it!', f: 'postHoc', why: 'He was swimming.' },
        { who: 'tilly', text: 'You were swimming, Sly.', f: null, why: 'The real reason.' },
        { who: 'sly', text: 'I saw one wet beaver. All beavers are trouble!', f: 'hastyGen', why: 'One beaver isn\'t all beavers.' },
        { who: 'milo', text: 'Beavers built dams here for years. No floods.', f: null, why: 'Lots of examples.' },
        { who: 'sly', text: 'Everyone knows dams are bad. Ask anyone!', f: 'bandwagon', why: 'Everyone saying it isn\'t a reason.' }
      ],
      rebuttal: {
        prompt: 'Sly says his wet tail proves the dam is bad. What do you say?',
        options: [
          { text: 'You were swimming. That\'s why you\'re wet.', good: true, why: 'You found the real reason.' },
          { text: 'Fix the dam or we\'ll all drown!', good: false, why: 'That\'s Only Two Doors.' }
        ]
      }
    },

    /* ---------------- Chapter 4 ---------------- */
    {
      id: 'c4s1', chapter: 4, title: 'The Missing Pie', where: 'Bea\'s kitchen',
      lines: [
        { who: 'bea', text: 'Half the pie is gone. Who was here?', f: null, why: 'A question.' },
        { who: 'rex', text: 'Nobody ever thanks me for sweeping!', f: 'redHerring', why: 'Sweeping has nothing to do with pie.' },
        { who: 'hazel', text: 'Don\'t ask. Someone might cry!', f: 'emotion', why: 'Crying isn\'t a reason to stop asking.' },
        { who: 'bea', text: 'I\'ll look for crumbs.', f: null, why: 'Looking for clues.' }
      ]
    },
    {
      id: 'c4s2', chapter: 4, title: 'Sparkle Cereal', where: 'The fair gate',
      lines: [
        { who: 'milo', text: 'Buy Sparkle Cereal or the bunny will cry!', f: 'emotion', why: 'A sad bunny is not a reason.' },
        { who: 'ollie', text: 'What\'s in it?', f: null, why: 'A good question.' },
        { who: 'milo', text: 'Hey, look! A butterfly!', f: 'redHerring', why: 'The butterfly dodges the question.' },
        { who: 'tilly', text: 'Sugar. Lots of sugar.', f: null, why: 'The answer.' }
      ]
    },
    {
      id: 'c4b', chapter: 4, boss: true, title: 'The Big Vote', where: 'On stage',
      lines: [
        { who: 'ollie', text: 'Sly, what will you do about the fog?', f: null, why: 'The big question.' },
        { who: 'sly', text: 'Look at my beautiful bow tie!', f: 'redHerring', why: 'A bow tie isn\'t a plan.' },
        { who: 'goose', text: 'Lovely. What about the fog, dear?', f: null, why: 'Back to the question.' },
        { who: 'sly', text: 'Think of my poor cubs if I lose!', f: 'emotion', why: 'Sad cubs aren\'t a plan either.' },
        { who: 'tilly', text: 'Cubs aren\'t a plan, Sly.', f: null, why: 'She names it.' },
        { who: 'sly', text: 'Vote for me, or the sun never comes back!', f: 'falseDilemma', why: 'The sun doesn\'t work like that.' },
        { who: 'milo', text: 'There\'s a third way. We spot the tricks!', f: null, why: 'The third door.' },
        { who: 'sly', text: 'Says a mouse with a squeaky voice!', f: 'adHominem', why: 'A squeaky voice isn\'t an answer.' }
      ],
      rebuttal: {
        prompt: 'Sly says vote for him, or the sun never comes back. What do you say?',
        options: [
          { text: 'That\'s not true. There are other choices.', good: true, why: 'You opened the third door.' },
          { text: 'Everyone says you\'re a liar!', good: false, why: 'That\'s Everyone\'s Doing It.' }
        ]
      }
    }
  ];

  const ENDING = [
    'The votes are counted. Sly loses!',
    'The fog is gone. Pip is big now.',
    '"More tricks will come," says Pip. "We\'ll be ready."'
  ];

  return { CAST, FALLACIES, FAIR_LINES, CHAPTERS, SCENES, ENDING };
})();
