const wordLists = {
  animals: [
    'Elephant', 'Penguin', 'Giraffe', 'Dolphin', 'Kangaroo',
    'Octopus', 'Flamingo', 'Chameleon', 'Porcupine', 'Platypus',
    'Cheetah', 'Hamster', 'Jellyfish', 'Peacock', 'Koala',
  ],
  food: [
    'Pizza', 'Sushi', 'Taco', 'Pancake', 'Burrito',
    'Croissant', 'Dumpling', 'Pretzel', 'Waffle', 'Lasagna',
    'Guacamole', 'Popcorn', 'Meatball', 'Brownie', 'Ramen',
  ],
  places: [
    'Beach', 'Library', 'Airport', 'Casino', 'Museum',
    'Volcano', 'Subway', 'Lighthouse', 'Gym', 'Aquarium',
    'Hospital', 'Carnival', 'Cemetery', 'Waterfall', 'Stadium',
  ],
  movies: [
    'Titanic', 'Jaws', 'Shrek', 'Frozen', 'Rocky',
    'Gladiator', 'Inception', 'Avatar', 'Bambi', 'Aladdin',
    'Ghostbusters', 'Jumanji', 'Ratatouille', 'Psycho', 'Up',
  ],
  occupations: [
    'Astronaut', 'Plumber', 'Detective', 'Pirate', 'Dentist',
    'Firefighter', 'Chef', 'Lifeguard', 'Magician', 'Mechanic',
    'Barber', 'Pilot', 'Architect', 'Comedian', 'Veterinarian',
  ],
  sports: [
    'Basketball', 'Surfing', 'Fencing', 'Bowling', 'Hockey',
    'Gymnastics', 'Wrestling', 'Archery', 'Volleyball', 'Skateboarding',
    'Dodgeball', 'Lacrosse', 'Badminton', 'Curling', 'Polo',
  ],
};

export function getRandomWord() {
  const categories = Object.keys(wordLists);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const words = wordLists[category];
  const word = words[Math.floor(Math.random() * words.length)];
  return { category, word };
}

export function getAllDefaultWords() {
  const words = [];
  for (const [category, wordList] of Object.entries(wordLists)) {
    for (const word of wordList) {
      words.push({ word, category, submittedBy: null, submittedByName: null });
    }
  }
  return words;
}

export default wordLists;
