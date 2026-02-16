import { describe, it, expect } from 'vitest';
import wordLists, { getRandomWord, getAllDefaultWords } from './words.js';

describe('wordLists', () => {
  it('has 6 word groups', () => {
    const groups = Object.keys(wordLists);
    expect(groups).toHaveLength(6);
    expect(groups).toEqual(
      expect.arrayContaining(['animals', 'food', 'places', 'movies', 'occupations', 'sports'])
    );
  });

  it('has 15 words per group', () => {
    for (const [group, words] of Object.entries(wordLists)) {
      expect(words, `${group} should have 15 words`).toHaveLength(15);
    }
  });

  it('has no duplicate words within a group', () => {
    for (const [group, words] of Object.entries(wordLists)) {
      const lower = words.map(w => w.toLowerCase());
      const unique = new Set(lower);
      expect(unique.size, `${group} has duplicates`).toBe(words.length);
    }
  });

  it('all words are non-empty strings', () => {
    for (const words of Object.values(wordLists)) {
      for (const word of words) {
        expect(typeof word).toBe('string');
        expect(word.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getRandomWord', () => {
  it('returns an object with word', () => {
    const result = getRandomWord();
    expect(result).toHaveProperty('word');
  });

  it('returns a word from the word lists', () => {
    const allWords = Object.values(wordLists).flat();
    for (let i = 0; i < 20; i++) {
      const { word } = getRandomWord();
      expect(allWords).toContain(word);
    }
  });
});

describe('getAllDefaultWords', () => {
  it('returns an array of all words', () => {
    const allWords = getAllDefaultWords();
    // 6 groups x 15 words = 90
    expect(allWords).toHaveLength(90);
  });

  it('each entry has word, submittedBy null, submittedByName null', () => {
    const allWords = getAllDefaultWords();
    for (const entry of allWords) {
      expect(entry).toHaveProperty('word');
      expect(entry.submittedBy).toBeNull();
      expect(entry.submittedByName).toBeNull();
      expect(typeof entry.word).toBe('string');
    }
  });
});
