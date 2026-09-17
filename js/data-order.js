/* Fog of Fallacy - the Grey Order.
   Uniformed preachers come out of the Grey Lodges, walk to people whose heads you
   cleared, and fog them again with harder, sneakier arguments. Experts leave your
   crew until you clear the new fog. Task givers refuse to work with you until you
   answer the preacher's argument. A Statue of Aristotle protects everyone inside
   its circle. You can never talk to a preacher.

   Writing rules: short sentences, every sentence has a verb, words a seven-year-old
   can read. The right answer must never be the longest option. Hard fogs have four
   options; the wrong ones sound reasonable or name the wrong flaw. */

(function () {
  const D = window.FOG;

  /* ---------------- the Order ---------------- */
  D.ORDER = {
    name: 'the Grey Order',
    firstAfterSec: 40,                     // first preacher this long after the first mission is built
    preachSec: 5,                          // how long a sermon takes
    byLevel: {                             // pressure grows with the level
      2: { every: 150, max: 1, converts: 1 },
      3: { every: 120, max: 1, converts: 2 },
      4: { every: 90, max: 2, converts: 2 },
      5: { every: 70, max: 2, converts: 3 }
    },
    spec: { size: 'l', skin: '#C68B59', hair: '#2A2420', hairStyle: 'short', shirt: '#3A3633', pants: '#2A2420', robe: '#2A2420', turban: '#F4F4F4', beard: true, frown: true },
    skins: ['#F1C9A5', '#C68B59', '#8D5A3B', '#F5D7B8'],
    lines: {
      out: 'A preacher of the Grey Order has left the lodge. Watch the map.',
      silent: 'The preacher looks through you and says nothing.',
      protectedStop: 'The preacher stops at the edge of the circle and turns away.',
      refogged: 'The preacher leaves. A grey fog settles over a cleared head.',
      refuses: 'The preacher leaves. Someone will not work with you any more.'
    }
  };

  /* ---------------- statues of Aristotle ---------------- */
  D.STATUE = {
    name: 'Statue of Aristotle', radius: 8, buildSec: 10,
    costs: [50, 90, 140, 200, 280],
    sites: [{ region: 0, x: 10, y: 16 }, { region: 1, x: 16, y: 44 }, { region: 2, x: 49, y: 41 }, { region: 3, x: 44, y: 16 }, { region: 4, x: 40, y: 62 }],
    blurb: 'Aristotle wrote down the tricks of bad arguments long ago. Nobody inside the circle of his statue can be fooled by a preacher.',
    quote: '"It is the mark of an educated mind to entertain a thought without accepting it."',
    needs: 'Needs a mason in your crew.',
    start: 'Your mason sets the plinth. The statue goes up.',
    built: 'The statue stands. Clear heads gather around it.',
    flavor: 'A stone plinth with nothing on it. Somebody should build a statue here.',
    inspect: 'Aristotle looks down at you from his plinth. Nobody inside his circle can be fooled by a preacher.'
  };

  /* ---------------- harder fogs the preachers leave in experts' heads ---------------- */
  D.HARD = {
    mo: [
      { fallacy: 'authority', topic: 'What the preacher knows',
        intro: ['A preacher in grey came by. He has read more books than anyone in this valley.', 'He says stone that is cut on a Tuesday cracks in the frost. He knows many things, so he knows this too.', 'I will not cut stone this week. Ask me again next week.'],
        options: [
          { text: 'Reading many books is not proof about stone. Has any Tuesday stone cracked?', right: true },
          { text: 'He does sound very learned, and frost really does crack stone, so waiting a week is the careful choice.' },
          { text: 'Everyone respects the preacher, so we should respect what he says about stone too.' },
          { text: 'A week is nothing. Let the stone rest, and let the preacher have his little rule.' }
        ],
        right: ['Has any cracked? I have cut stone on every day of the week for thirty years.', 'Knowing many things is not the same as knowing this thing. My head is clear again.'],
        wrong: ['Next week, then.', 'Next week the preacher has a new rule. The work waits.'] },
      { fallacy: 'slipperySlope', topic: 'One crack leads to ruin',
        intro: ['The preacher showed me a crack in an old wall. He was very calm about it.', 'He said one crack lets in water. Water makes two cracks. Two make ten. Ten bring the wall down, and then the whole village.', 'It made sense, step by step. So I will not build walls any more. Walls only fall.'],
        options: [
          { text: 'Each step needs its own proof. Does one crack really make two?', right: true },
          { text: 'He is right that water gets into cracks, so the safest thing is to build nothing that can crack.' },
          { text: 'That wall is old and badly built. Yours will be better, so it will never crack at all.' },
          { text: 'The preacher has never laid a stone in his life, so nothing he says about walls counts.' }
        ],
        right: ['Does one crack make two? Only if nobody fills it. I fill cracks. That is my job.', 'He ran the steps together, and I ran after him. Not any more.'],
        wrong: ['Yes. Nothing that can crack. So, nothing.', 'Mo sits on a pile of stone he will not use.'] }
    ],
    wren: [
      { fallacy: 'postHoc', topic: 'The dry spring',
        intro: ['The preacher walked past the spring on the hill on Monday. On Tuesday the spring ran dry.', 'He says the ground is angry with us because we dig where we should not. He said it, and then the spring dried up.', 'If I dig for you again, the river might dry up next. I cannot risk that.'],
        options: [
          { text: 'Walking past came first. Did it cause the drying? What else happened?', right: true },
          { text: 'That is a strange thing to happen the very next day, so it is wise to stop digging until we understand it.' },
          { text: 'Springs dry up in summer all the time, and this one dried up because it is old, not because of any preacher.' },
          { text: 'The preacher is only trying to scare you, and people who scare others should not be listened to.' }
        ],
        right: ['What else happened? It has not rained for three weeks. That is what happened.', 'The spring dried because the sky was dry. Coming first is not causing. I forgot that for a moment.'],
        wrong: ['You are right. I will stop digging.', 'The spring comes back with the rain, and nobody says sorry.'] },
      { fallacy: 'falseDilemma', topic: "The preacher's two paths",
        intro: ['The preacher says every well is a choice. Either we trust the old river, as our grandparents did, or we trust holes in the ground and lose the river.', 'He put it so simply. River or hole. I cannot choose against the river.'],
        options: [
          { text: 'Why only two? A well and the river can both give water.', right: true },
          { text: 'When you put it like that, the river has kept us alive for years, so the river must come first.' },
          { text: 'Our grandparents drank from the river and they were fine, so the old way is clearly the right way.' },
          { text: 'The preacher wants us to stay thirsty so we stay weak, and a man like that should not choose for us.' }
        ],
        right: ['Both? The well for drinking and the river for the fields.', 'He built two doors and hid the third. I nearly walked through his door.'],
        wrong: ['The river, then. Only the river.', 'The village drinks muddy water for another year.'] }
    ],
    cass: [
      { fallacy: 'tradition', topic: 'Bridges are not our way',
        intro: ['The preacher in grey sat with me for an hour. He knows the old stories of this valley.', 'For three hundred years, he said, the farms used the ferry. Three hundred years cannot be wrong.', 'Who am I to cut a plank against three hundred years?'],
        options: [
          { text: 'Old is not the same as right. Did the ferry serve the farms well?', right: true },
          { text: 'Three hundred years is a long time, and a way that lasts that long has probably earned some respect.' },
          { text: 'Half the farmers want a bridge, so the old way has already lost, whatever the preacher says.' },
          { text: 'The ferry is Gus\'s business, and the preacher is probably a friend of Gus, so of course he wants the ferry.' }
        ],
        right: ['Did it serve them well? Pia loses half her apples every year waiting for the ferry.', 'Three hundred years of rotten apples. Old is not the same as right.'],
        wrong: ['I will not cut against the years.', 'Cass puts her saw away.'] },
      { fallacy: 'strawMan', topic: 'What the builder really wants',
        intro: [{ who: 'cass', text: 'The preacher told me what you really want. You want to pave the whole river and drive the fish away.' }, { who: 'you', text: 'I never said that. I want one bridge.' }, { who: 'cass', text: 'He explained it, though. One bridge, then two, then a road on the water. He was very sure. I cannot help someone who hates fish.' }],
        options: [
          { text: 'That is not what I said. One bridge. Nothing about paving a river.', right: true },
          { text: 'I would never pave the river, I promise, and I like fish very much, so please help me anyway.' },
          { text: 'Even if there were a road on the water one day, more roads bring more trade, so it would not be so bad.' },
          { text: 'The preacher is a liar, and liars should be run out of the valley before they say anything else.' }
        ],
        right: ['Nothing about paving? He said it as if you had said it.', 'He built a scarecrow of you and knocked it down. I clapped. I am sorry.'],
        wrong: ['Hmm. That is what he said you would say.', { text: 'Cass goes back to whittling. The river stays uncrossed.', anim: 'whittle' }] }
    ],
    sy: [
      { fallacy: 'authority', topic: "The preacher's map",
        intro: ['The preacher showed me a map. It has a gold seal from the capital.', 'On the map the river is forty paces wide. I measured twenty-two. But my rope is only a rope, and his map has a seal.', 'I must have measured wrong. I cannot plan anything on a wrong number.'],
        options: [
          { text: 'A seal is not a measurement. Measure it again and trust the rope.', right: true },
          { text: 'A map from the capital was made by trained people with proper tools, so forty paces is the safer number.' },
          { text: 'Twenty-two, forty, it hardly matters, just build everything long enough for both and be done with it.' },
          { text: 'Preachers do not know maps, and a man who cannot measure should not tell a surveyor his business.' }
        ],
        right: [{ text: 'Again? Twenty-two paces. Twenty-two both times.', anim: 'measure' }, 'The seal is pretty. The rope is right. I trust what I can check.'],
        wrong: ['Forty, then. I will plan for forty.', 'Everything is planned twice too long and costs twice too much.'] },
      { fallacy: 'hastyGen', topic: 'One surveyor who lied',
        intro: ['The preacher told me about a surveyor in the north who faked his numbers. A bridge fell. People were hurt.', 'One surveyor did that. So surveyors cannot be trusted, he says, and I am a surveyor.', 'Maybe he is right. Maybe you should not trust my numbers either.'],
        options: [
          { text: 'One surveyor is not every surveyor. Judge your numbers by checking them.', right: true },
          { text: 'It is true that one bad surveyor can do great harm, so double-checking everything you measure is only sensible.' },
          { text: 'That bridge fell because of bad wood, I am sure of it, so the surveyor was probably blamed unfairly.' },
          { text: 'The preacher tells that story to everyone, and a man who tells scary stories should not be believed.' }
        ],
        right: ['Judge the numbers, not the trade. Yes.', 'One man from the north is not me. My head is clearer.'],
        wrong: ['Maybe you should not. I would not.', 'Sy puts his tripod away.'] }
    ],
    ada: [
      { fallacy: 'emotion', topic: 'The children in the rain',
        intro: ['The preacher spoke of the children who walk to school in the rain. Their cold little hands. Their wet shoes.', 'He said a school makes children walk, and walking in rain makes them ill, and could I live with that?', 'I cried, honestly. I cannot run a school that makes children ill.'],
        options: [
          { text: 'Sad pictures are not reasons. Do children who walk to school get ill more?', right: true },
          { text: 'Wet shoes really are miserable, and if even one child gets ill because of the school, that is one too many.' },
          { text: 'Children walk in the rain to the bakery too, so the preacher should complain about bread as well.' },
          { text: 'The preacher has no children of his own, so he has no right to talk about them.' }
        ],
        right: ['Do they? Forty children walked to my library last winter. None of them caught a cold from walking.', 'He painted a picture and I stepped into it. Feelings are not reasons.'],
        wrong: ['One too many. Yes. No school.', { text: 'Ada shuts her book. The children stay untaught, in the dry.', anim: 'read' }] },
      { fallacy: 'redHerring', topic: 'The question he never answered',
        intro: [{ who: 'you', text: 'Ada, the preacher told you the school is a bad idea. Did he say why?' }, { who: 'ada', text: 'He spoke of the stars, and of humility, and of how small we are.' }, { who: 'ada', text: 'It was beautiful. I felt very small. Too small to run a school.' }],
        options: [
          { text: 'But did he answer the question? Why is the school a bad idea?', right: true },
          { text: 'Humility is a fine thing, and a person who feels small is right to be careful with big plans like a school.' },
          { text: 'Stars have nothing to do with schools, so the preacher clearly knows nothing about teaching.' },
          { text: 'If it was beautiful, then he must have been wise, and wise people are worth listening to.' }
        ],
        right: ['Why is it a bad idea? He never said. He talked about the stars until I forgot the question.', 'A beautiful speech about the wrong thing is still about the wrong thing.'],
        wrong: ['Careful with big plans. Yes.', 'Ada looks at the stars. The question stays unanswered.'] }
    ],
    brick: [
      { fallacy: 'bandwagon', topic: 'All the masons agree',
        intro: ['The preacher gathered all the masons at the inn. All of them. He asked who thought the next building would stand.', 'Nobody put a hand up. Not one. When every mason doubts, the doubt must be right.', 'So I doubt it too.'],
        options: [
          { text: 'Nobody raising a hand is not proof. What is wrong with the plan?', right: true },
          { text: 'When every expert in a room agrees, that is as close to proof as you get, so I would listen to them.' },
          { text: 'Masons at an inn have been drinking, and drunk men do not count.' },
          { text: 'They were all afraid of the preacher, so they said nothing, and that means the building is probably fine.' }
        ],
        right: ['What is wrong with it? I looked at the plan. Nothing. The ground is checked. The stone is good.', 'A room of quiet men is not a reason. I nearly let it be one.'],
        wrong: ['I doubt it too, then.', 'Brick puts his trowel down.'] },
      { fallacy: 'sunkCost', topic: 'The old plan',
        intro: ['I spent a month on an old plan before the preacher came. The one with the big tower.', 'He said the tower would fall. He is right, actually. The base is too narrow.', 'But a month! I cannot throw away a month. I will build the tower and hope.'],
        options: [
          { text: 'The month is spent either way. Is the tower worth building? No.', right: true },
          { text: 'A month of work is a lot to lose, so the smart thing is to keep the tower and just make the base a little wider.' },
          { text: 'The preacher only says it will fall because he wants you to fail, so build the tower and prove him wrong.' },
          { text: 'If it falls, it falls, and at least the month was not wasted.' }
        ],
        right: ['Is the tower worth building? No. It falls. I knew that.', 'The month is gone whether I build it or not. That is a hard thing to say out loud.'],
        wrong: ['I will build the tower and hope.', 'The tower falls in the first storm. The month is still gone.'] }
    ],
    fen: [
      { fallacy: 'gambler', topic: "The preacher's calm spell",
        intro: ['The preacher read the sky for me. Three storms hit this valley in three weeks, he said.', 'So the weather owes us calm. It must be calm for months now. We should start the wheel without the flood wall.', 'He is good with skies. Let us skip the wall and save the coins.'],
        options: [
          { text: 'The sky does not keep score. Three storms do not make calm due.', right: true },
          { text: 'Three storms in three weeks is very unusual, so it does stand to reason that we are owed a quiet spell.' },
          { text: 'We should build the flood wall twice as high, because three storms mean this valley is cursed.' },
          { text: 'The preacher cannot read skies, nobody can, so ignore him and just do whatever is cheapest.' }
        ],
        right: ['The sky does not keep score. Neither do dice. I said that once, before.', 'We build the flood wall. Storms do not owe anyone anything.'],
        wrong: ['We skip the wall.', 'The fourth storm takes the wheel. The sky was not keeping count.'] },
      { fallacy: 'falseDilemma', topic: 'Wood or iron',
        intro: ['The preacher says a wheel is either all wood, blessed and old, or all iron, cold and new. There is no other kind.', 'All iron rusts by the river. So it must be all wood. And all wood is too weak for the big wheel. So no wheel.'],
        options: [
          { text: 'Or a wood wheel with iron bands. Two choices were never the only choices.', right: true },
          { text: 'He knows wheels better than either of us, and if he says there are two kinds, then there are two kinds.' },
          { text: 'Then iron, and we paint it every month, because a rusty wheel is better than no wheel.' },
          { text: 'Old blessed wood sounds like nonsense, and a man who blesses wood is not worth listening to.' }
        ],
        right: ['Wood with iron bands. Of course. Every cart wheel in the valley is made that way.', 'Two doors, and a window right there. I keep forgetting the window.'],
        wrong: ['No wheel, then.', 'The miners crush ore by hand for another year.'] }
    ],
    iva: [
      { fallacy: 'adHominem', topic: 'The builder from nowhere',
        intro: ['The preacher asked me where you come from. I did not know. Nobody does.', 'A builder with no home, he said, has no one to answer to. Such a person will leave the lamp half made and vanish.', 'I will not start a lamp for someone who might vanish.'],
        options: [
          { text: 'Where I come from says nothing about the lamp. Look at what I have built here.', right: true },
          { text: 'People with no home are often unreliable, that is just true, so it is fair for Iva to want some proof.' },
          { text: 'The preacher has no home either, he wanders from lodge to lodge, so he should not talk.' },
          { text: 'I will tell you exactly where I was born, and then you will see that I am trustworthy.' }
        ],
        right: ['What you have built here. A well. A bridge. A school. A mill.', 'Where you come from was never the question. What you do is the question.'],
        wrong: ['Some proof. Yes. Bring me proof.', { text: 'Iva bangs a horseshoe flat. The lamp stays unmade.', anim: 'forge' }] },
      { fallacy: 'tradition', topic: 'Bonfires, as always',
        intro: ['The preacher says the cliff bonfires are holy. Every captain for two hundred years lit them.', 'A lamp of iron and glass would put out a holy flame. Who am I to put out two hundred years of fire?', 'I forge horseshoes. Horseshoes are old too.'],
        options: [
          { text: 'Two hundred years is not a reason. Did the bonfires stop the wrecks?', right: true },
          { text: 'A thing that people kept doing for two centuries must have worked, or they would have stopped.' },
          { text: 'The captains lit fires because they had nothing better, and now we do, so they were simply foolish.' },
          { text: 'Light the lamp only on nights without a bonfire, so the holy fire is never put out.' }
        ],
        right: ['Did they stop the wrecks? Captain Hale counted twelve last winter.', 'Old is not the same as right. I forge new things every day.'],
        wrong: ['Who am I. Yes.', 'Iva goes back to horseshoes. The ships keep hitting the rocks.'] }
    ]
  };

  /* ---------------- why task givers refuse you, and how to answer ---------------- */
  D.REFUSE = {
    hana: { fallacy: 'hastyGen', topic: 'A builder like the last one',
      intro: ['A preacher told me about a builder who came to a village in the north. He took the jobs, took the coins, and left a half-dug well.', 'You are a builder too. So you will do the same. No more work for you, I am sorry.'],
      options: [
        { text: 'One builder is not every builder. Judge me by the well in the square.', right: true },
        { text: 'That builder sounds awful, and I understand why you are careful, so I will pay you first and work after.' },
        { text: 'The preacher made that story up, because preachers say anything to get people scared.' },
        { text: 'Every village has a story like that, and stories grow in the telling, so it probably never happened at all.' }
      ],
      right: ['The well in the square. You did dig that, and it is not half.', 'One builder in the north is not you. The buckets are by the river, if you want the work.'],
      wrong: ['I will pay first... no. No, I will not.', 'Hana turns back to her oven.'] },
    idris: { fallacy: 'adHominem', topic: 'You talk to tricksters',
      intro: ['The preacher saw you talking to Pip and to Dodge. Tricksters, both of them.', 'Anyone who talks with tricksters is a trickster, he says. I do not deal with tricksters. Go away.'],
      options: [
        { text: 'Who I talk to says nothing about my work. Look at the fence I fixed.', right: true },
        { text: 'Pip and Dodge are children, not tricksters, so the preacher is simply wrong about them.' },
        { text: 'I only talked to them to catch them out, so really I am the opposite of a trickster.' },
        { text: 'The preacher talks to everyone in the valley, so by his own rule he is a trickster too.' }
      ],
      right: ['The fence. Straighter than mine, I said so myself.', 'Who you talk to. Hm. I talk to the goats and I am not a goat. All right.'],
      wrong: ['Go away, I said.', 'Idris turns his back and counts goats.'] },
    sal: { fallacy: 'emotion', topic: 'Poor Pickle',
      intro: ['The preacher says builders frighten goats. Poor Pickle. She would shake all night with your hammering.', 'I could not bear it. I cannot have you near my cottage any more.'],
      options: [
        { text: 'Pickle shaking is a sad picture, not a reason. Has she shaken once since the well?', right: true },
        { text: 'You are right, I would never want to frighten her, so I will keep away from the cottage.' },
        { text: 'Goats do not have feelings like that, so there is nothing to worry about.' },
        { text: 'The preacher does not even like goats, so why would he care about Pickle?' }
      ],
      right: ['Since the well? She slept through the whole thing. Right by the site.', 'He made me picture her shaking. Nothing shook. Come by when you like, dear.'],
      wrong: ['Keep away, then. Thank you.', 'Sal shuts the cottage door.'] },
    pia: { fallacy: 'postHoc', topic: 'The bruised apples',
      intro: ['The day after you crossed the new bridge, half my apples came up bruised.', 'The preacher says the bridge shakes the ground and bruises the fruit. It came first. So it did it. No more work for you.'],
      options: [
        { text: 'The bridge came first. Did it bruise the apples? What else changed?', right: true },
        { text: 'Bridges do carry heavy carts and heavy carts do shake the ground, so the preacher may well be right.' },
        { text: 'Apples bruise when you pick them badly, so this is your fault and not the bridge.' },
        { text: 'The preacher wants the bridge gone because he hates anything new, so ignore him.' }
      ],
      right: ['What else changed? There was hail that night. Small hail. I forgot the hail.', 'Hail bruises apples. Bridges do not. Coming first is not causing.'],
      wrong: ['He may well be right. Go.', 'Pia sorts bruised apples and blames the bridge.'] },
    ren: { fallacy: 'falseDilemma', topic: 'With the preacher or against him',
      intro: ['The preacher says you are either with the valley or with the builders. I am with the valley.', 'So I cannot be with you. That is how it is, one or the other.'],
      options: [
        { text: 'Why only two? Builders can be with the valley. The bridge is for the valley.', right: true },
        { text: 'If I have to pick, then I pick the valley too, and you can keep your scarecrow money.' },
        { text: 'The preacher is not from the valley, so he does not get to say who is with it.' },
        { text: 'I am with the valley more than you are, because I built the well and you only grow beans.' }
      ],
      right: ['The bridge is for the valley. My carts cross it.', 'One or the other. Or both. He never said both.'],
      wrong: ['You can keep it. Yes.', 'Ren goes back to arguing with Rin.'] },
    rin: { fallacy: 'bandwagon', topic: 'The whole lane agrees',
      intro: ['Everyone on our lane says the preacher is right about you. Every single house.', 'When the whole lane agrees, that is that. I cannot take your milk any more.'],
      options: [
        { text: 'A whole lane agreeing is not proof. What did the preacher say I did?', right: true },
        { text: 'If every house on the lane agrees, then I must have done something, and I am sorry for it.' },
        { text: 'The lane has four houses, and four people are hardly everyone.' },
        { text: 'They only agree because they are afraid of him, so their opinion is worthless.' }
      ],
      right: ['What did he say you did? He did not say. He said everyone knew.', 'Everyone knew, and nobody knew what. I will take the milk.'],
      wrong: ['Something. Yes. Go away, please.', 'Rin looks at the neighbours and says nothing.'] },
    dot: { fallacy: 'slipperySlope', topic: 'One builder, then a city',
      intro: ['The preacher sat in my inn all evening. One builder, he said, brings a school. A school brings students. Students bring noise, noise brings a city, and a city eats an inn like mine.', 'So I cannot help a builder. It ends with my inn gone.'],
      options: [
        { text: 'Each step needs its own proof. Does a school really bring a city?', right: true },
        { text: 'It is true that towns do grow, and a careful innkeeper should think about where it all ends.' },
        { text: 'A city would bring more guests, so you should want a city and thank the builder.' },
        { text: 'The preacher drank three bowls of your soup and did not pay, so why do you listen to him?' }
      ],
      right: ['Does a school bring a city? Market Town is still Market Town.', 'He ran the steps together. I ran with him. Sit down, have some soup.'],
      wrong: ['Where it all ends. Yes. Go on now.', 'Dot wipes the same table twice.'] },
    ossian: { fallacy: 'authority', topic: 'The seal on the letter',
      intro: ['The preacher brought a letter with a seal. It says builders need a permit from the Grey Order.', 'A seal is a seal. I cannot stamp anything for you until you have their permit.'],
      options: [
        { text: 'A seal is not a law. Which law says builders need their permit?', right: true },
        { text: 'Seals are serious things, and a clerk who ignores one could lose his job, so I understand you.' },
        { text: 'Anyone can melt wax and press a ring in it, so the letter is obviously fake.' },
        { text: 'I will go and get their permit, then, if that is what the letter says.' }
      ],
      right: ['Which law? I have every law in this hall. None of them says it.', 'A seal is wax. A law is a law. I had them muddled.'],
      wrong: ['I understand too, but I still cannot stamp it.', 'Ossian files the letter under "important".'] },
    nell: { fallacy: 'sunkCost', topic: "The preacher's pamphlets",
      intro: ['I paid the preacher forty coins for a box of pamphlets about the dangers of builders.', 'Forty coins! If I sell to a builder now, the forty coins were for nothing. So no rope, no nails, no oil for you.'],
      options: [
        { text: 'The forty coins are gone either way. Does refusing me earn them back?', right: true },
        { text: 'Forty coins is a lot for a small shop, so it makes sense to get your money\'s worth out of the pamphlets.' },
        { text: 'The preacher cheated you, and a cheated person should never trust anyone again.' },
        { text: 'Sell the pamphlets to me, then, and you will have your forty back.' }
      ],
      right: ['Does it earn them back? No. It just loses me a customer too.', 'Gone is gone. I will use the pamphlets to wrap nails.'],
      wrong: ['My money\'s worth. Yes. No sale.', 'Nell straightens a pile of pamphlets nobody buys.'] },
    tam: { fallacy: 'strawMan', topic: 'You want to close the mine',
      intro: ['The preacher says a mill means you want to close the mine and put every miner out of work.', 'You said you wanted to crush ore faster. Faster means fewer miners. Fewer means none. I heard it from him. No oil for you.'],
      options: [
        { text: 'That is not what I said. A mill crushes ore. It does not dig it.', right: true },
        { text: 'I would never close the mine, I promise, and I will hire every miner myself if I have to.' },
        { text: 'Fewer miners might be a good thing, honestly, because the mine is dangerous.' },
        { text: 'The preacher has never been down a mine, so he knows nothing about it.' }
      ],
      right: ['It does not dig it. The miners dig. The mill only crushes.', 'He put words in your mouth, and I heard them in his voice. Take the oil.'],
      wrong: ['No oil. I said.', 'Tam turns back to the shift board.'] },
    quill: { fallacy: 'gambler', topic: 'Due for a cave-in',
      intro: ['The preacher counted for me. Twelve safe months in this mine. Twelve! A cave-in is due, he says, and builders bring bad luck.', 'I cannot let a builder near the cart while a cave-in is due.'],
      options: [
        { text: 'Twelve safe months do not make a cave-in due. Rock does not keep count.', right: true },
        { text: 'Twelve months is a long run of luck, so being extra careful right now is only sensible.' },
        { text: 'Cave-ins come from bad timber, and the timber is fine, so there will never be one.' },
        { text: 'The preacher is not a miner, so he cannot say anything about cave-ins.' }
      ],
      right: ['Rock does not keep count. It does not know about months.', 'I put a calendar on a mountain. Silly. The cart needs its wheel.'],
      wrong: ['Extra careful. Yes. Stay away.', 'Quill checks the roof again, for the tenth time today.'] },
    mab: { fallacy: 'redHerring', topic: 'What about the stew?',
      intro: [{ who: 'you', text: 'Mab, why will you not take the ore basket from me any more?' }, { who: 'mab', text: 'Have you tasted the stew today? The preacher says the carrots are too small. Look at the carrots!' }, { who: 'mab', text: 'Tiny. And the onions. Do not get me started on the onions.' }],
      options: [
        { text: 'The carrots can wait. Why will you not take the ore?', right: true },
        { text: 'Those are small carrots, you are right, and I think the onions look a bit sad too.' },
        { text: 'The preacher knows nothing about cooking, so his carrot opinion is worthless.' },
        { text: 'If the stew is bad, then the miners will be grumpy, and grumpy miners are the real problem here.' }
      ],
      right: ['Why? He said builders are trouble. He did not say why. Then we talked about carrots.', 'I never asked him why. I will take the ore.'],
      wrong: ['The onions. Yes. Exactly.', 'You talk about onions for a long time. The ore basket stays full.'] },
    orla: { fallacy: 'emotion', topic: "My father's harbour",
      intro: ['The preacher says builders will change the harbour, and my father\'s harbour will be gone forever. He said it very softly.', 'I cried. I cannot help anyone who would erase my father.'],
      options: [
        { text: 'Missing your father is real, but not a reason. Would a lighthouse erase him?', right: true },
        { text: 'I would never want to hurt your father\'s memory, so I will leave the harbour as it is.' },
        { text: 'Your father is gone and the harbour is not his any more, so let it go.' },
        { text: 'The preacher used your father to make you cry, and a man who does that is wicked.' }
      ],
      right: ['Would it erase him? He rowed out in the dark every winter. A light would have brought him home.', 'The preacher made me cry and called it a reason. The oar job is yours.'],
      wrong: ['Leave it as it is. Yes.', 'Orla looks at the sea.'] },
    lin: { fallacy: 'tradition', topic: 'Fish are sold by hand',
      intro: ['The preacher says fish were always sold by the fisher, on the quay, by hand. Always.', 'Carrying crates for the Tavern is not the old way. So no crates for you.'],
      options: [
        { text: 'Always is not a reason. Does the crate get the fish there fresh?', right: true },
        { text: 'The old ways do keep a harbour together, and I would not want to be the one who broke them.' },
        { text: 'Everyone else sends crates to the Tavern, so you are the odd one out.' },
        { text: 'The preacher has never sold a fish, so he cannot know how fish are sold.' }
      ],
      right: ['Fresh? Fresher than waiting on the quay all day, yes.', 'Always is a long time to do the wrong thing. Take the crate.'],
      wrong: ['I would not break them either. Go.', 'Lin sells fish by hand, slowly.'] },
    bea: { fallacy: 'authority', topic: "The preacher's cookbook",
      intro: ['The preacher has a cookbook older than the Tavern. It says a cook must never take goods from strangers.', 'A book that old must be right. So no ledger, no fish, nothing from you.'],
      options: [
        { text: 'An old book is not a reason. Does it say why?', right: true },
        { text: 'Old cookbooks hold a lot of wisdom, and a cook would be foolish to ignore one.' },
        { text: 'You should burn that book, because old books are always full of nonsense.' },
        { text: 'I am not a stranger, we met last week, so the book does not apply to me.' }
      ],
      right: ['Does it say why? It says "it is written". That is all it says.', 'A book that old, and that is the reason. I will take the ledger.'],
      wrong: ['Foolish to ignore. Yes.', 'Bea stirs the chowder and does not look up.'] }
  };
})();
