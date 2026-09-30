/* Fog of Fallacy - the hidden mini-games and the little animated scenes.

   Pressing A on some things in the Valley opens a small animated picture instead of a
   line of narration: the goat bleats, the fountain splashes, the boat bobs. A few of them
   hide a mini-game you can actually play. Each game is short, works with keys, mouse and
   touch, and pays a few coins (with a cooldown, like the jobs). Where a game fits a trick,
   it teaches the trick too: the cup game is always rigged, and the card table asks whether
   black is "due".

   Writing rules (same as js/data.js): short sentences, every sentence has a verb, words a
   seven-year-old can read. The right answer must never be the longest option.
   Every string under `lines` is spoken or shown as it is; nothing here is composed at runtime. */

(function () {
  const D = window.FOG;

  /* `place` is the decoration id that starts the game (see World.decor). `needs` is a flag that must be
     set first. `pay` is the most coins one round can give; `cooldown` (seconds) is how long until it pays again.
     `fallacy` names the trick the game teaches; `lesson` holds the question asked after the game. */
  D.GAMES = {
    cups: { fallacy: 'bandwagon', pay: 0, cooldown: 0,
      lines: {
        watch: 'Watch the pea. Watch the cups.',
        shuffle: 'The cups move faster and faster.',
        pick: 'Which cup hides the pea? Pick one.',
        empty: 'Empty. Dodge lifts the other cups. They are empty too.',
        palm: 'Look at his other hand. The pea was there the whole time.',
        show: 'Watch his left hand this time. Slowly.',
        fair: 'This time the pea stays under a cup. Find it.',
        fairWin: 'You found it! A fair game is a different game.',
        fairLose: 'Not that one. But this time the pea was really there.'
      } },
    streak: { place: 'cards', pay: 10, cooldown: 60, fallacy: 'gambler',
      lines: {
        title: 'Red or black',
        intro: 'Six cards. Guess the colour of each one. There\'s nothing to pay.',
        prompt: 'Red or black?',
        red: 'Red', black: 'Black',
        run: 'The same colour again! Is the other one due now?',
        question: 'Red came up four times in a row. What about the next card?',
        options: [
          { text: 'Red or black. One in two, like always.', right: true },
          { text: 'Black is due now. Black is much more likely.' },
          { text: 'Red is hot now. Red is much more likely.' }
        ],
        right: 'Cards don\'t remember. Every card starts fresh. Take 10 coins for a clear head.',
        wrong: 'The cards don\'t know what came before. Every card is a fresh one in two.'
      } },
    stones: { place: 'stones', pay: 12, cooldown: 60,
      lines: {
        title: 'Skipping stones',
        intro: 'Press when the marker is in the green. You have three stones.',
        done: 'Three good throws! A coin for every skip.',
        none: 'Plop. Plop. Plop. Try a flatter stone next time.'
      } },
    crows: { place: 'scarecrow', needs: 'task:scarecrow', pay: 12, cooldown: 60,
      lines: {
        title: 'Shoo the crows',
        intro: 'The crows are back! Tap them before they eat the seeds.',
        done: 'The crows fly off in a huff. A coin for every crow.',
        none: 'The crows ate every seed. They look very pleased.'
      } },
    fish: { place: 'rod', pay: 15, cooldown: 60,
      lines: {
        title: 'Fishing',
        intro: 'Wait for the float to dip. Then press!',
        herring: 'A red herring! It looks tasty, but it isn\'t what you were fishing for.',
        done: 'You pack up the rod. Bigger fish pay more.',
        none: 'Nothing bit. The fish are laughing at you.'
      } }
  };

  /* Narration for the new things on the map. */
  D.FLAVOR.stones = 'Flat stones by the water. They are good for skipping.';
  D.FLAVOR.rod = 'A fishing rod leans on a post. The line is already in the water.';
  D.FLAVOR.cart = 'An ore cart with a missing wheel. It wobbles when you touch it.';

  /* Dodge shows the trick after you beat it, and lets you play a fair round for fun. */
  D.TRICKS.dodgeCups.right.splice(2, 0, { who: 'dodge', text: 'Look, I\'ll show you how it works. Nobody ever wins.' }, { game: 'cups', mode: 'reveal' });
  D.TRICKS.dodgeCups.ok.splice(1, 0, { game: 'cups', mode: 'trick' });
  D.TRICKS.dodgeCups.ok[2].text = 'You pick a cup. It\'s empty. The pea was never under any of them.';
  D.NPCS.find(n => n.id === 'dodge').after.push({ who: 'dodge', text: 'Do you want a fair round, for fun? No coins this time.' }, { game: 'cups', mode: 'fair' });
})();
