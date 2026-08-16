/* reading.js — the Reading Room library.
   Curated public-domain literature excerpts and original informational
   passages, each with comprehension questions. Self-contained. */
(function (global) {
  'use strict';

  var READING = [
    {
      id: 'tortoise', title: 'The Tortoise and the Hare', author: 'Aesop', genre: 'Fable',
      level: 'K-2', minutes: 2,
      text: [
        'A Hare was making fun of a Tortoise one day for being so slow.',
        '"Do you ever get anywhere?" he asked with a mocking laugh.',
        '"Yes," replied the Tortoise, "and I get there sooner than you think. Let us have a race and prove it."',
        'The Hare was much amused at the idea of racing the Tortoise, but for the fun of it he agreed. So the Fox, who had been chosen to be the judge, marked the distance and started the runners off.',
        'The Hare was soon far out of sight, and to make the Tortoise feel how silly it was to try, he lay down beside the road to take a nap until the Tortoise should catch up.',
        'The Tortoise meanwhile kept going slowly but steadily, and after a time passed the place where the Hare was sleeping. But the Hare slept on very peacefully, and when at last he awoke, the Tortoise was near the goal.',
        'The Hare now ran his swiftest, but he could not overtake the Tortoise in time.'
      ],
      questions: [
        { q: 'Why did the Hare stop to take a nap?', choices: ['He was very tired', 'He thought he had plenty of time to win', 'He hurt his foot', 'The Fox told him to rest'], answer: 'He thought he had plenty of time to win' },
        { q: 'How did the Tortoise win the race?', choices: ['He took a shortcut', 'He kept going slowly but steadily', 'The Hare gave up', 'The Fox helped him'], answer: 'He kept going slowly but steadily' },
        { q: 'What is the lesson (moral) of this fable?', choices: ['Slow and steady wins the race', 'Always take a nap', 'Hares are faster than tortoises', 'Never race a friend'], answer: 'Slow and steady wins the race' }
      ]
    },
    {
      id: 'ant', title: 'The Ant and the Grasshopper', author: 'Aesop', genre: 'Fable',
      level: 'K-2', minutes: 2,
      text: [
        'In a field one summer\'s day a Grasshopper was hopping about, chirping and singing to its heart\'s content.',
        'An Ant passed by, bearing along with great effort an ear of corn he was taking to the nest.',
        '"Why not come and chat with me," said the Grasshopper, "instead of toiling and moiling in that way?"',
        '"I am helping to lay up food for the winter," said the Ant, "and recommend you to do the same."',
        '"Why bother about winter?" said the Grasshopper. "We have got plenty of food at present." But the Ant went on its way and continued its toil.',
        'When the winter came the Grasshopper had no food, and found itself dying of hunger, while it saw the ants distributing every day corn and grain from the stores they had collected in the summer.',
        'Then the Grasshopper knew: it is best to prepare for the days of need.'
      ],
      questions: [
        { q: 'What was the Ant doing in the summer?', choices: ['Singing songs', 'Storing food for winter', 'Sleeping', 'Chatting with the Grasshopper'], answer: 'Storing food for winter' },
        { q: 'Why did the Grasshopper suffer in winter?', choices: ['It was too cold', 'It had not stored any food', 'The ants took its food', 'It got lost'], answer: 'It had not stored any food' },
        { q: 'What does this fable teach?', choices: ['Prepare for times of need', 'Singing is bad', 'Winter never comes', 'Ants are unfriendly'], answer: 'Prepare for times of need' }
      ]
    },
    {
      id: 'honey', title: 'How Bees Make Honey', author: 'Mastermind Academy', genre: 'Informational',
      level: '3-5', minutes: 3,
      text: [
        'Honey begins with a flower. When a honeybee lands on a blossom, it uses a long, straw-like tongue called a proboscis to sip a sugary liquid called nectar. The bee stores the nectar in a special pouch inside its body known as the honey stomach, which is separate from the stomach it uses to digest its own food.',
        'A single bee may visit more than a thousand flowers before its honey stomach is full. As it flies from bloom to bloom, it also spreads pollen, helping plants make seeds. This is why bees are so important to the food we eat.',
        'Back at the hive, the bee passes the nectar to other worker bees, mouth to mouth. As the bees pass it along, the nectar mixes with special chemicals called enzymes that slowly change it into honey.',
        'The bees then spread the honey into the tiny six-sided cells of the honeycomb. The honey is still watery, so the bees beat their wings to fan it, drying it out until it becomes thick and sweet. Finally they seal each cell with a cap of wax to keep the honey fresh.',
        'A hive of bees may fly the equivalent of twice around the world to gather enough nectar for a single pound of honey. The next time you taste it, remember the long journey of thousands of tiny workers.'
      ],
      questions: [
        { q: 'What is the sugary liquid bees collect from flowers called?', choices: ['Pollen', 'Nectar', 'Wax', 'Syrup'], answer: 'Nectar' },
        { q: 'How do bees help plants while collecting nectar?', choices: ['They water them', 'They spread pollen so plants make seeds', 'They eat harmful bugs', 'They dig the soil'], answer: 'They spread pollen so plants make seeds' },
        { q: 'Why do bees fan the honey with their wings?', choices: ['To cool the hive', 'To dry it until it is thick', 'To call other bees', 'To clean it'], answer: 'To dry it until it is thick' },
        { q: 'What changes the nectar into honey?', choices: ['Sunlight', 'Enzymes from the bees', 'Cold air', 'Rainwater'], answer: 'Enzymes from the bees' }
      ]
    },
    {
      id: 'water', title: 'The Water Cycle', author: 'Mastermind Academy', genre: 'Informational',
      level: '3-5', minutes: 3,
      text: [
        'The water you drink today is the same water that dinosaurs drank millions of years ago. That is because Earth\'s water is used again and again in a never-ending journey called the water cycle.',
        'The journey often begins in the ocean. When the sun warms the surface of the water, some of it turns into an invisible gas called water vapor and rises into the sky. This process is called evaporation.',
        'High in the cooler air, the water vapor changes back into tiny droplets. Millions of these droplets gather together to form clouds. This step is called condensation.',
        'When the droplets in a cloud become heavy enough, they fall back to Earth as rain, snow, sleet, or hail. Scientists call this precipitation.',
        'The water that lands on the ground flows into streams and rivers, and most of it eventually returns to the ocean, where the cycle begins all over again. Some water also soaks into the ground, where it may be taken up by plants or stored deep underground for years.'
      ],
      questions: [
        { q: 'What is it called when the sun turns water into vapor?', choices: ['Condensation', 'Precipitation', 'Evaporation', 'Collection'], answer: 'Evaporation' },
        { q: 'How are clouds formed?', choices: ['Vapor condenses into tiny droplets', 'Rain freezes in the sky', 'Rivers rise into the air', 'The sun burns the sky'], answer: 'Vapor condenses into tiny droplets' },
        { q: 'Rain, snow, and hail are all forms of...', choices: ['evaporation', 'precipitation', 'condensation', 'humidity'], answer: 'precipitation' },
        { q: 'Why does the author say the water cycle is "never-ending"?', choices: ['It only happens in summer', 'The same water is used again and again', 'It takes exactly one year', 'It happens only over oceans'], answer: 'The same water is used again and again' }
      ]
    },
    {
      id: 'alice', title: 'Down the Rabbit-Hole', author: 'Lewis Carroll', genre: 'Classic Fiction',
      level: '3-5', minutes: 4,
      text: [
        'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"',
        'So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
        'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.',
        'Burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.',
        'In another moment down went Alice after it, never once considering how in the world she was to get out again.'
      ],
      questions: [
        { q: 'Why was Alice bored at the start?', choices: ['She was hungry', 'Her sister\'s book had no pictures or conversations', 'It was raining', 'She had lost her daisy-chain'], answer: 'Her sister\'s book had no pictures or conversations' },
        { q: 'What did Alice find truly remarkable about the Rabbit?', choices: ['It had pink eyes', 'It spoke aloud', 'It took a watch out of its waistcoat-pocket', 'It ran very fast'], answer: 'It took a watch out of its waistcoat-pocket' },
        { q: 'What does the last line suggest about Alice?', choices: ['She was very careful and planned ahead', 'She acted on curiosity without thinking of the consequences', 'She was afraid of the Rabbit', 'She wanted to go home'], answer: 'She acted on curiosity without thinking of the consequences' }
      ]
    },
    {
      id: 'moon', title: 'The Race to the Moon', author: 'Mastermind Academy', genre: 'Informational',
      level: '6-8', minutes: 4,
      text: [
        'On July 20, 1969, two American astronauts became the first human beings to walk on the surface of another world. Their journey was the result of nearly a decade of effort, sparked by a bold promise and a fierce competition between nations.',
        'In 1961, President John F. Kennedy declared that the United States should commit itself to "landing a man on the Moon and returning him safely to the Earth" before the decade was out. At the time, the goal seemed almost impossible. The Soviet Union had already launched the first satellite and the first human into space, and the United States was behind.',
        'Reaching the Moon required solving countless problems. Engineers had to build a rocket, the Saturn V, taller than a 36-story building and powerful enough to escape Earth\'s gravity. They had to design a spacecraft that could keep astronauts alive in the airless cold of space, and a fragile lander light enough to touch down gently on the lunar surface.',
        'When Neil Armstrong finally stepped onto the Moon, he spoke words that are still remembered: "That\'s one small step for man, one giant leap for mankind." Millions of people around the world watched on television, holding their breath.',
        'The Moon landing showed what humans can accomplish when they set a clear goal and work together toward it. It was not just a victory in a race, but a milestone for all of humanity.'
      ],
      questions: [
        { q: 'What bold goal did President Kennedy set in 1961?', choices: ['To build the tallest building', 'To land a person on the Moon and return safely before the decade ended', 'To launch the first satellite', 'To beat the Soviet Union at chess'], answer: 'To land a person on the Moon and return safely before the decade ended' },
        { q: 'Why did the goal seem almost impossible at the time?', choices: ['No one wanted to go', 'The Soviet Union was ahead in the space race', 'Rockets had not been invented', 'The Moon was too far to see'], answer: 'The Soviet Union was ahead in the space race' },
        { q: 'The Saturn V rocket is described as being...', choices: ['smaller than a car', 'taller than a 36-story building', 'made of paper', 'unable to leave the ground'], answer: 'taller than a 36-story building' },
        { q: 'What is the main idea of the final paragraph?', choices: ['Television was invented in 1969', 'Humans can achieve great things with a clear goal and teamwork', 'The Moon is made of rock', 'Racing is dangerous'], answer: 'Humans can achieve great things with a clear goal and teamwork' }
      ]
    },
    {
      id: 'tom', title: 'The Whitewashed Fence', author: 'Mark Twain', genre: 'Classic Fiction',
      level: '6-8', minutes: 4,
      text: [
        'Saturday morning was come, and all the summer world was bright and fresh, and brimming with life. Tom appeared on the sidewalk with a bucket of whitewash and a long-handled brush. He surveyed the fence, and all gladness left him and a deep melancholy settled down upon his spirit. Thirty yards of board fence nine feet high. Life to him seemed hollow, and existence but a burden.',
        'He began to think of the fun he had planned for this day, and his sorrows multiplied. Soon the free boys would come tripping along on all sorts of delicious expeditions, and they would make a world of fun of him for having to work.',
        'At this dark and hopeless moment an inspiration burst upon him! Nothing less than a great, magnificent inspiration. He took up his brush and went tranquilly to work. Ben Rogers hove in sight presently, eating an apple.',
        'Tom went on whitewashing, and paid no attention to the steamboat noises Ben was making. Ben stared a moment and then said: "Hello, old chap, you got to work, hey?"',
        '"Why, it\'s you, Ben! I warn\'t noticing." "Say, I\'m going in a-swimming, I am. Don\'t you wish you could? But of course you\'d druther work, wouldn\'t you? Course you would!"',
        'Tom contemplated the boy a bit, and said: "What do you call work?" "Why, ain\'t that work?" Tom resumed his whitewashing, and answered carelessly: "Well, maybe it is, and maybe it ain\'t. All I know is, it suits Tom Sawyer." Before long Ben was begging for the chance to paint, and had traded his apple for the privilege.'
      ],
      questions: [
        { q: 'How did Tom feel at the start about painting the fence?', choices: ['Excited and proud', 'Deeply gloomy and burdened', 'Curious', 'Grateful'], answer: 'Deeply gloomy and burdened' },
        { q: 'What was Tom\'s clever "inspiration"?', choices: ['To run away', 'To pretend the work was a rare privilege so others would want it', 'To finish quickly', 'To hire a painter'], answer: 'To pretend the work was a rare privilege so others would want it' },
        { q: 'Why did Ben end up begging to paint?', choices: ['He was ordered to', 'Tom made the work look desirable', 'He wanted the bucket', 'It started to rain'], answer: 'Tom made the work look desirable' },
        { q: 'This passage best shows that Tom is...', choices: ['lazy but clever', 'honest and hardworking', 'shy and quiet', 'cruel'], answer: 'lazy but clever' }
      ]
    },
    {
      id: 'reading-daily', title: 'The Case for Reading Every Day', author: 'Mastermind Academy', genre: 'Persuasive',
      level: '9-12', minutes: 5,
      text: [
        'In an age of endless notifications and short videos, the quiet act of reading a book can feel almost old-fashioned. Yet decades of research suggest that few habits do more for the developing mind than reading regularly. If you want to think more clearly, write more persuasively, and understand other people more deeply, the evidence points to a single, unglamorous practice: read every day.',
        'Consider vocabulary. Spoken conversation, even among educated adults, relies on a surprisingly small set of words. Books, by contrast, expose readers to rare and precise language in meaningful contexts. A student who reads twenty minutes a day encounters millions more words per year than one who reads only a few minutes, and that gap compounds over time into a dramatic difference in verbal ability.',
        'Reading also builds what psychologists call theory of mind, the capacity to imagine the thoughts and feelings of others. When you follow a character through a difficult decision, you are quietly rehearsing empathy. Studies have found that readers of literary fiction tend to score higher on tests of emotional understanding, a skill that matters as much in friendships and workplaces as it does on the page.',
        'There is a cognitive benefit as well. Deep reading, the slow and focused engagement with a long text, strengthens attention and the ability to hold complex ideas in mind. This kind of concentration is precisely what a world of constant interruption erodes. To read a chapter without reaching for your phone is, in a small way, to train your mind to resist distraction.',
        'None of this requires heroic effort. The goal is not to finish a hundred books a year, but to make reading an ordinary part of the day, like eating or sleeping. Keep a book where you can see it. Read a few pages before bed. Choose subjects that genuinely interest you rather than the ones you think you should like. Consistency, not intensity, is what turns reading from a chore into a source of lifelong advantage.'
      ],
      questions: [
        { q: 'What is the author\'s main claim?', choices: ['Books are old-fashioned', 'Reading every day powerfully benefits the mind', 'Videos are better than books', 'Vocabulary does not matter'], answer: 'Reading every day powerfully benefits the mind' },
        { q: 'According to the passage, why do books build vocabulary better than conversation?', choices: ['Books are longer', 'Books use rare, precise words in meaningful contexts', 'Conversation is boring', 'Books are read aloud'], answer: 'Books use rare, precise words in meaningful contexts' },
        { q: 'What does "theory of mind" refer to?', choices: ['A scientific theory about brains', 'The ability to imagine others\' thoughts and feelings', 'A reading speed record', 'A type of book'], answer: 'The ability to imagine others\' thoughts and feelings' },
        { q: 'What does the author recommend for building the habit?', choices: ['Finishing a hundred books a year', 'Reading only difficult classics', 'Making reading an ordinary daily routine', 'Reading as fast as possible'], answer: 'Making reading an ordinary daily routine' },
        { q: 'The phrase "Consistency, not intensity" suggests the author values...', choices: ['reading a lot all at once', 'reading a little, regularly', 'reading only intense books', 'avoiding reading'], answer: 'reading a little, regularly' }
      ]
    }
  ];

  global.READING = READING;
})(window);
