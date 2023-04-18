export const generateLocalSessionId = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const generateRandomUser = () => {
  const adjectives = [
    'Adventurous',
    'Brave',
    'Creative',
    'Daring',
    'Eager',
    'Friendly',
    'Generous',
    'Happy',
    'Inquisitive',
    'Jovial',
    'Kind',
    'Lively',
    'Mighty',
    'Noble',
    'Optimistic',
    'Passionate',
    'Quirky',
    'Reliable',
    'Sincere',
    'Thoughtful',
    'Unique',
    'Valiant',
    'Wise',
    'Xenodochial',
    'Youthful',
    'Zealous',
  ];
  const nouns = [
    'Artist',
    'Builder',
    'Chef',
    'Dancer',
    'Engineer',
    'Farmer',
    'Gardener',
    'Hiker',
    'Inventor',
    'Jester',
    'Knight',
    'Linguist',
    'Musician',
    'Nurse',
    'Officer',
    'Painter',
    'Quizzer',
    'Ranger',
    'Scientist',
    'Traveler',
    'Unicorn',
    'Volunteer',
    'Writer',
    'Xenophile',
    'Yogi',
    'Zookeeper',
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  const randomNumber = Math.floor(Math.random() * 1000);

  return randomAdjective + randomNoun + randomNumber;
};
