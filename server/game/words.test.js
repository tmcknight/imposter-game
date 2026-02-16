import { describe, it, expect } from 'vitest';
import wordLists, { getRandomWord, getAllDefaultWords } from './words.js';

describe('wordLists', () => {
  it('has 6 categories', () => {
    const categories = Object.keys(wordLists);
    expect(categories).toHaveLength(6);
    expect(categories).toEqual(
      expect.arrayContaining(['animals', 'food', 'places', 'movies', 'occupations', 'sports'])
    );
  });

  it('has 15 words per category', () => {
    for (const [category, words] of Object.entries(wordLists)) {
      expect(words, `${category} should have 15 words`).toHaveLength(15);
    }
  });

  it('has no duplicate words within a category', () => {
    for (const [category, words] of Object.entries(wordLists)) {
      const lower = words.map(w => w.toLowerCase());
      const unique = new Set(lower);
      expect(unique.size, `${category} has duplicates`).toBe(words.length);
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
  it('returns an object with category and word', () => {
    const result = getRandomWord();
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('word');
  });

  it('returns a valid category', () => {
    const categories = Object.keys(wordLists);
    for (let i = 0; i < 20; i++) {
      const { category } = getRandomWord();
      expect(categories).toContain(category);
    }
  });

  it('returns a word that belongs to the returned category', () => {
    for (let i = 0; i < 20; i++) {
      const { category, word } = getRandomWord();
      expect(wordLists[category]).toContain(word);
    }
  });
});

describe('getAllDefaultWords', () => {
  it('returns an array of all words from all categories', () => {
    const allWords = getAllDefaultWords();
    // 6 categories x 15 words = 90
    expect(allWords).toHaveLength(90);
  });

  it('each entry has word, category, submittedBy null, submittedByName null', () => {
    const allWords = getAllDefaultWords();
    for (const entry of allWords) {
      expect(entry).toHaveProperty('word');
      expect(entry).toHaveProperty('category');
      expect(entry.submittedBy).toBeNull();
      expect(entry.submittedByName).toBeNull();
      expect(typeof entry.word).toBe('string');
      expect(typeof entry.category).toBe('string');
    }
  });

  it('contains words from every category', () => {
    const allWords = getAllDefaultWords();
    const categories = new Set(allWords.map(w => w.category));
    expect(categories.size).toBe(6);
    expect([...categories]).toEqual(
      expect.arrayContaining(['animals', 'food', 'places', 'movies', 'occupations', 'sports'])
    );
  });
});
