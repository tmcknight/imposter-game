import { describe, it, expect } from 'vitest';
import wordLists, { getRandomWord } from './words.js';

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
