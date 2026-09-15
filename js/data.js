/* Fog of Fallacy - Maple Street stories.
   Every trick is one story with real kids and grown-ups. The other child tries to
   talk the player into something. Going along with the trick plays out its
   natural consequence. Pushing back the right way earns a badge. */

window.FOG = (function () {

  const TRICKS = [
    { id: 'bandwagon', nick: "Everyone's Doing It", icon: '👣', img: 'img/trick-bandwagon.jpg',
      one: 'Everybody does it, so it must be OK.', spot: 'Lots of people can all be wrong together.' },
    { id: 'adHominem', nick: 'The Insult Trick', icon: '🗯️', img: 'img/trick-adHominem.jpg',
      one: "Don't listen to them. They're just a baby.", spot: 'Who says it does not make it wrong or right.' },
    { id: 'falseDilemma', nick: 'Only Two Doors', icon: '🚪', img: 'img/trick-falseDilemma.jpg',
      one: 'Do this, or that. Nothing else!', spot: 'There is almost always a third door.' },
    { id: 'strawMan', nick: 'The Scarecrow', icon: '🌾', img: 'img/trick-strawMan.jpg',
      one: 'Twisting what someone said into something silly.', spot: 'Is that really what they said?' },
    { id: 'postHoc', nick: 'The Lucky Socks', icon: '🧦', img: 'img/trick-postHoc.jpg',
      one: 'It came first, so it must be the reason.', spot: 'Coming first is not the same as causing.' },
    { id: 'hastyGen', nick: 'The Big Jump', icon: '🦘', img: 'img/trick-hastyGen.jpg',
      one: 'One person, so all of them.', spot: 'One is not everyone.' },
    { id: 'emotion', nick: 'The Tear Trick', icon: '😢', img: 'img/trick-emotion.jpg',
      one: 'Do it, or I will cry!', spot: 'Feelings are real. But they are not reasons.' },
    { id: 'redHerring', nick: 'Look Over There!', icon: '👉', img: 'img/trick-redHerring.jpg',
      one: 'Changing the subject to dodge the question.', spot: 'Did they answer the question?' }
  ];

  /* Player looks to choose from. */
  const LOOKS = [
    { size: 'm', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'long', shirt: '#FF7B6B', pants: '#3E5C8A' },
    { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'curly', shirt: '#F6B544', pants: '#3E5C8A' },
    { size: 'm', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'bun', shirt: '#63C48F', pants: '#5B4F47' },
    { size: 'm', skin: '#C68B59', hair: '#2A2420', hairStyle: 'short', shirt: '#7FA8F0', pants: '#3E5C8A' }
  ];

  /* Everyone on Maple Street. x,y are tiles. quest = the trick this person tries. */
  const NPCS = [
    { id: 'mum', name: 'Mum', x: 3, y: 5, dir: 'right', spec: { size: 'xl', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'bun', shirt: '#7FA8A6', pants: '#5B4F47' },
      talk: ['Morning, {name}! Kids with a ! above them want to talk to you.', 'Watch out for tricky talk. If it sounds wrong, think first.'],
      done: ['Eight badges! The fog is gone from Maple Street.', 'I am so proud of you.'] },
    { id: 'tom', name: 'Tom (big brother)', x: 7, y: 3, dir: 'down', quest: 'falseDilemma',
      spec: { size: 'l', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'short', shirt: '#F4E8CC', pants: '#3E5C8A' },
      after: ['Half each was the best door.'] },
    { id: 'leo', name: 'Leo', x: 28, y: 5, dir: 'down', quest: 'bandwagon',
      spec: { size: 'l', skin: '#F1C9A5', hair: '#8B4A1F', hairStyle: 'short', shirt: '#2F80ED', pants: '#3E5C8A' },
      after: ["Next time I'll check the ice first."] },
    { id: 'jo', name: 'Jo', x: 29, y: 3, dir: 'right', spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'curly', shirt: '#F6B544', pants: '#3E5C8A' },
      talk: ["I'm going on the ice because Leo is!"], afterQuest: 'bandwagon', after: ['Brr. We ALL fell in. Everybody was wrong.'] },
    { id: 'kim', name: 'Kim', x: 29, y: 6, dir: 'right', spec: { size: 'm', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'long', shirt: '#E4574F', pants: '#5B4F47' },
      talk: ["Everybody's sliding on the pond. So it's fine, right?"], afterQuest: 'bandwagon', after: ['My socks are still wet.'] },
    { id: 'ava', name: 'Ava', x: 16, y: 4, dir: 'down', quest: 'strawMan',
      spec: { size: 'm', skin: '#F5D7B8', hair: '#B04A2A', hairStyle: 'long', shirt: '#9B6BD6', pants: '#3E5C8A' },
      after: ['Helmets are itchy. But bumps are worse.'] },
    { id: 'mia', name: 'Mia (little)', x: 11, y: 15, dir: 'down', spec: { size: 's', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'bun', shirt: '#FF9FD0', pants: '#5B4F47' },
      talk: ["The stream path is all mud today. Use the bridge!"], afterQuest: 'adHominem', after: ['See? Little kids know things too.'] },
    { id: 'sam', name: 'Sam', x: 11, y: 17, dir: 'up', quest: 'adHominem',
      spec: { size: 'l', skin: '#C68B59', hair: '#2A2420', hairStyle: 'short', shirt: '#63C48F', pants: '#3E5C8A' },
      after: ['Little kids can be right too.'] },
    { id: 'teacher', name: 'Mr Okafor', x: 5, y: 18, dir: 'up', spec: { size: 'xl', skin: '#C68B59', hair: '#2A2420', hairStyle: 'short', shirt: '#F4E8CC', pants: '#5B4F47', glasses: true },
      talk: ['A good thinker asks: is that a reason, or a trick?'] },
    { id: 'ruby', name: 'Ruby', x: 17, y: 17, dir: 'down', quest: 'emotion',
      spec: { size: 'l', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'long', shirt: '#E4574F', pants: '#5B4F47' },
      after: ['I asked Mum. She said maybe for my birthday.'] },
    { id: 'icecream', name: 'Ice cream man', x: 22, y: 16, dir: 'left', spec: { size: 'xl', skin: '#F5D7B8', hair: '#E0A23A', hairStyle: 'short', shirt: '#FFFFFF', pants: '#5B4F47', apron: true },
      talk: ['Three coins for a cone. Best ice cream on Maple Street!'] },
    { id: 'zoe', name: 'Zoe', x: 26, y: 17, dir: 'right', quest: 'hastyGen',
      spec: { size: 'm', skin: '#F1C9A5', hair: '#2A2420', hairStyle: 'curly', shirt: '#F6B544', pants: '#3E5C8A' },
      after: ["Priya's my friend now."] },
    { id: 'priya', name: 'Priya', x: 29, y: 17, dir: 'left', spec: { size: 'm', skin: '#A8683F', hair: '#1E1410', hairStyle: 'long', shirt: '#FF7B6B', pants: '#5B4F47', partyhat: true },
      talk: ["It's my party today! Everyone is welcome."], afterQuest: 'hastyGen', after: ['Thanks for coming to my party!'] },
    { id: 'coach', name: 'Coach Dana', x: 22, y: 22, dir: 'right', spec: { size: 'xl', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'short', shirt: '#E4574F', pants: '#2A2420', cap: '#2A2420' },
      talk: ['Race day! Warm up those legs.'], afterQuest: 'postHoc', after: ['Legs win races. Not caps.'] },
    { id: 'ben', name: 'Ben (cousin)', x: 26, y: 23, dir: 'left', quest: 'postHoc',
      spec: { size: 'm', skin: '#8D5A3B', hair: '#1E1410', hairStyle: 'short', shirt: '#F4E8CC', pants: '#3E5C8A', cap: '#E4574F' },
      after: ['I still like my cap. But I practise now.'] },
    { id: 'dad', name: 'Dad', x: 3, y: 24, dir: 'right', spec: { size: 'xl', skin: '#F1C9A5', hair: '#2A2420', hairStyle: 'short', shirt: '#3E5C8A', pants: '#5B4F47', beard: true },
      talk: ["I'm planting flowers. Careful with the pots!"], afterQuest: 'redHerring', after: ['Accidents happen. Telling the truth fixes them.'] },
    { id: 'max', name: 'Max (little brother)', x: 5, y: 24, dir: 'right', quest: 'redHerring',
      spec: { size: 's', skin: '#F1C9A5', hair: '#4A2E1A', hairStyle: 'short', shirt: '#63C48F', pants: '#3E5C8A' },
      after: ['I say sorry now. Then rainbows.'] }
  ];

  /* Fog rectangles (tiles) that lift when a quest is done. */
  const FOG = {
    bandwagon: [19, 1, 34, 8], adHominem: [1, 11, 11, 21], falseDilemma: [1, 1, 10, 7], strawMan: [14, 1, 18, 6],
    postHoc: [19, 20, 34, 27], hastyGen: [26, 11, 34, 19], emotion: [14, 11, 23, 19], redHerring: [1, 22, 11, 27]
  };

  /* Story scripts. Steps: {who,text} | {scene,text} | {end:'fail'|'win'|'oops'}.
     who: an npc id, 'you', or 'n' (narrator). */
  const QUESTS = {
    bandwagon: {
      npc: 'leo',
      intro: [
        { who: 'leo', text: 'Hi {name}! The pond is frozen. Everybody is sliding on it!' },
        { who: 'leo', text: "Jo's on it. Kim's on it. Everybody does it. Come on!" }
      ],
      options: [
        { key: 'ok', text: 'OK! Everybody does it.' },
        { key: 'right', text: "Everybody doing it doesn't make it safe. Let's ask a grown-up." },
        { key: 'oops', text: "You're a big silly, Leo!" }
      ],
      ok: [
        { who: 'n', text: 'You step onto the ice with everyone.' },
        { who: 'n', text: 'CRACK.' },
        { scene: 'img/fail-bandwagon.jpg', text: 'Splash! Everybody falls in. Everybody is soaked. Everybody was wrong.' },
        { who: 'leo', text: 'B-b-brr. Maybe everybody was wrong.' },
        { end: 'fail' }
      ],
      right: [
        { who: 'leo', text: "Fine. I'm going on anyway!" },
        { who: 'n', text: 'You stay on the path and watch.' },
        { who: 'n', text: 'CRACK.' },
        { scene: 'img/fail-bandwagon.jpg', text: 'Splash! Everybody falls in. You are dry. Everybody was wrong.' },
        { who: 'leo', text: 'You were right, {name}. Everybody was wrong.' },
        { end: 'win' }
      ],
      oops: [
        { who: 'leo', text: "Hey! That's mean." },
        { who: 'n', text: 'Leo stomps off. Nobody learned anything.' },
        { end: 'oops' }
      ]
    },

    adHominem: {
      npc: 'sam',
      intro: [
        { who: 'mia', text: "Don't take the stream path. It's all mud today. Use the bridge." },
        { who: 'sam', text: "Ha! Mia's a baby. She's four. Don't listen to babies." },
        { who: 'sam', text: 'The stream path is faster. Go!' }
      ],
      options: [
        { key: 'ok', text: "OK. Babies don't know things." },
        { key: 'right', text: "Mia's little, but she might be right. Let's look." },
        { key: 'oops', text: "Sam, YOU'RE the baby!" }
      ],
      ok: [
        { who: 'n', text: 'You run down the stream path.' },
        { who: 'n', text: 'SQUELCH.' },
        { scene: 'img/fail-adHominem.jpg', text: 'Stuck in mud up to your knees. Shoes ruined. Mia was right.' },
        { who: 'mia', text: 'I told you!' },
        { end: 'fail' }
      ],
      right: [
        { who: 'n', text: 'You look at the stream path. Deep, sticky mud.' },
        { who: 'sam', text: 'Oh. It really is muddy.' },
        { who: 'n', text: 'You take the bridge. Your shoes stay clean.' },
        { scene: 'img/fail-adHominem.jpg', text: 'Sam tries the stream path anyway. Squelch. Being little did not make Mia wrong.' },
        { who: 'sam', text: 'Little kids can be right. Got it.' },
        { end: 'win' }
      ],
      oops: [
        { who: 'sam', text: 'Am not!' },
        { who: 'n', text: 'Now everyone argues about babies. Nobody looks at the path.' },
        { end: 'oops' }
      ]
    },

    falseDilemma: {
      npc: 'tom',
      intro: [
        { who: 'n', text: 'Mum gave you a chocolate bar.' },
        { who: 'tom', text: "Give me your whole chocolate bar. Or I'll never play with you again." },
        { who: 'tom', text: 'Those are the only two choices. Whole bar, or no playing. Ever.' }
      ],
      options: [
        { key: 'ok', text: 'OK. Take the whole bar.' },
        { key: 'right', text: "There's another way. We share. Half each." },
        { key: 'oops', text: "You're greedy, Tom!" }
      ],
      ok: [
        { who: 'n', text: 'Tom eats the whole bar.' },
        { who: 'tom', text: "Thanks! Bye, I'm off to football." },
        { scene: 'img/fail-falseDilemma.jpg', text: 'No chocolate. No playing. Tom left anyway. Two doors were not the only doors.' },
        { end: 'fail' }
      ],
      right: [
        { who: 'tom', text: 'Hmm. Half? ...OK, deal.' },
        { who: 'n', text: 'You both eat chocolate. Then you play football together.' },
        { who: 'n', text: 'There is almost always a third door.' },
        { end: 'win' }
      ],
      oops: [
        { who: 'tom', text: "And you're stingy!" },
        { who: 'n', text: "Now you're both cross. Nobody plays." },
        { end: 'oops' }
      ]
    },

    strawMan: {
      npc: 'ava',
      intro: [
        { who: 'n', text: 'Mum said: wear your helmet when you ride on the road.' },
        { who: 'ava', text: "Let's ride on the road! No helmets. They're itchy." },
        { who: 'you', text: 'Mum said to wear a helmet on the road.' },
        { who: 'ava', text: 'Your mum said you can NEVER ride a bike? That is silly!' },
        { who: 'ava', text: "Silly rules don't count. Ride without it." }
      ],
      options: [
        { key: 'ok', text: 'Yeah, that IS silly. No helmet!' },
        { key: 'right', text: "That's not what Mum said. She said wear a helmet on the road." },
        { key: 'oops', text: "You're a bad friend, Ava!" }
      ],
      ok: [
        { who: 'n', text: 'You ride fast. A bump. A wobble. CRASH.' },
        { scene: 'img/fail-strawMan.jpg', text: "Ouch. A bump, an ice pack, no more bikes today. Mum never said 'never ride'. She said 'wear a helmet'." },
        { end: 'fail' }
      ],
      right: [
        { who: 'ava', text: "Oh. That's... actually a fair rule." },
        { who: 'n', text: 'You both put on helmets. Ava hits a bump and wobbles. Her helmet keeps her safe.' },
        { who: 'ava', text: 'Phew. Real rules are better than silly pretend ones.' },
        { end: 'win' }
      ],
      oops: [
        { who: 'ava', text: 'I am not!' },
        { who: 'n', text: 'Ava rides off upset. The real rule got lost.' },
        { end: 'oops' }
      ]
    },

    postHoc: {
      npc: 'ben',
      intro: [
        { who: 'ben', text: 'The race is in ten minutes! Yesterday I wore my red cap and I won.' },
        { who: 'ben', text: "The cap did it! Don't practise. Just wear my red cap. Easy." }
      ],
      options: [
        { key: 'ok', text: 'OK! Give me the lucky cap.' },
        { key: 'right', text: "The cap came first. But practice made you win. Let's practise." },
        { key: 'oops', text: "That's a stupid cap, Ben." }
      ],
      ok: [
        { who: 'n', text: 'You sit in the shade wearing the cap. Everyone else practises.' },
        { who: 'n', text: 'Ready, steady, GO!' },
        { scene: 'img/fail-postHoc.jpg', text: 'You finish last, out of breath. The cap came first yesterday. Practice made Ben win.' },
        { end: 'fail' }
      ],
      right: [
        { who: 'ben', text: 'Hmm. I did practise a lot yesterday...' },
        { who: 'n', text: 'You both practise. Ready, steady, GO! You finish strong.' },
        { who: 'coach', text: 'Great running! Legs win races, not caps.' },
        { end: 'win' }
      ],
      oops: [
        { who: 'ben', text: 'It is NOT!' },
        { who: 'n', text: 'Ben sulks. Nobody practises. Nobody learns why he really won.' },
        { end: 'oops' }
      ]
    },

    hastyGen: {
      npc: 'zoe',
      intro: [
        { who: 'zoe', text: "Priya's party is today. Don't go." },
        { who: 'zoe', text: 'A kid from Oak Street pushed me once. Priya is from Oak Street.' },
        { who: 'zoe', text: 'So ALL Oak Street kids are mean.' }
      ],
      options: [
        { key: 'ok', text: "OK. I'll stay away from Oak Street kids." },
        { key: 'right', text: "One kid isn't all kids. Let's meet Priya first." },
        { key: 'oops', text: "You're just a scaredy-cat, Zoe." }
      ],
      ok: [
        { who: 'n', text: 'You stay outside. Music and laughing come from the window.' },
        { scene: 'img/fail-hastyGen.jpg', text: 'Everyone had cake and games. Priya was kind to everyone. One kid is not all kids.' },
        { end: 'fail' }
      ],
      right: [
        { who: 'n', text: 'You knock. Priya opens the door with a big smile.' },
        { who: 'priya', text: "You came! Come in, there's cake!" },
        { who: 'zoe', text: "She's... really nice. One kid isn't all kids." },
        { end: 'win' }
      ],
      oops: [
        { who: 'zoe', text: "I'm not!" },
        { who: 'n', text: 'Zoe runs home. Nobody goes to the party.' },
        { end: 'oops' }
      ]
    },

    emotion: {
      npc: 'ruby',
      intro: [
        { who: 'n', text: 'You have three coins. You are saving them for ice cream.' },
        { who: 'ruby', text: 'I want that toy. Give me your three coins.' },
        { who: 'ruby', text: "If you don't, I'll cry ALL day. And it will be YOUR fault. Do you want me to cry?" }
      ],
      options: [
        { key: 'ok', text: "Don't cry! Here, take my coins." },
        { key: 'right', text: "I'm sorry you're sad. But that's not a reason. I'm keeping my coins." },
        { key: 'oops', text: 'Cry-baby! Cry-baby!' }
      ],
      ok: [
        { who: 'n', text: "Ruby buys the toy and skips away. She doesn't cry at all." },
        { scene: 'img/fail-emotion.jpg', text: 'No coins. No ice cream. Ruby is happy. Tears were never a reason.' },
        { end: 'fail' }
      ],
      right: [
        { who: 'ruby', text: 'Hmph. Fine.' },
        { who: 'n', text: "Ruby doesn't cry. She goes to ask her mum instead." },
        { who: 'icecream', text: 'One cone, three coins. Enjoy!' },
        { who: 'n', text: 'Feelings are real. But they are not reasons.' },
        { end: 'win' }
      ],
      oops: [
        { who: 'ruby', text: "That's mean!" },
        { who: 'n', text: 'Now Ruby really is crying. That helped nobody.' },
        { end: 'oops' }
      ]
    },

    redHerring: {
      npc: 'max',
      intro: [
        { who: 'n', text: "CRASH! Dad's big flower pot is broken. Max is standing right next to it." },
        { who: 'you', text: 'Max, did you break the pot?' },
        { who: 'max', text: "Look! A RAINBOW! Quick, let's go see it before it's gone!" }
      ],
      options: [
        { key: 'ok', text: "A rainbow! Let's go!" },
        { key: 'right', text: 'The rainbow can wait. Max, did you break the pot?' },
        { key: 'oops', text: 'Liar! You always break things!' }
      ],
      ok: [
        { who: 'n', text: 'You both run off. The rainbow fades before you get there.' },
        { who: 'n', text: 'Dad finds the broken pot.' },
        { scene: 'img/fail-redHerring.jpg', text: 'Dad thinks you BOTH did it. The rainbow was gone anyway. The question never got answered.' },
        { end: 'fail' }
      ],
      right: [
        { who: 'max', text: '...Yes. It was an accident.' },
        { who: 'n', text: 'You help Max tell Dad. Then you sweep up together.' },
        { who: 'dad', text: 'Thanks for telling me. Accidents happen. Now, who wants to see a rainbow?' },
        { end: 'win' }
      ],
      oops: [
        { who: 'max', text: 'Waaah!' },
        { who: 'n', text: 'Max runs inside crying. The pot is still broken. Nobody knows what happened.' },
        { end: 'oops' }
      ]
    }
  };

  return { TRICKS, LOOKS, NPCS, FOG, QUESTS };
})();
