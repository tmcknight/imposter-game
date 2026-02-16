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
  const allWords = Object.values(wordLists).flat();
  const word = allWords[Math.floor(Math.random() * allWords.length)];
  return { word };
}

export function getAllDefaultWords() {
  const words = [];
  for (const wordList of Object.values(wordLists)) {
    for (const word of wordList) {
      words.push({ word, submittedBy: null, submittedByName: null });
    }
  }
  return words;
}

export default wordLists;
