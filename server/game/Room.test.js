import { describe, it, expect, beforeEach, vi } from 'vitest';
import Room from './Room.js';

// Mock getRandomWord and getAllDefaultWords
vi.mock('./words.js', () => ({
  getRandomWord: vi.fn(() => ({ category: 'animals', word: 'Elephant' })),
  getAllDefaultWords: vi.fn(() => [
    { word: 'Elephant', category: 'animals', submittedBy: null, submittedByName: null },
    { word: 'Pizza', category: 'food', submittedBy: null, submittedByName: null },
  ]),
}));

describe('Room', () => {
  let room;

  beforeEach(() => {
    room = new Room('ABCD', 'host-1', 'Alice');
  });

  describe('constructor', () => {
    it('initializes with correct defaults', () => {
      expect(room.code).toBe('ABCD');
      expect(room.phase).toBe('LOBBY');
      expect(room.hostId).toBe('host-1');
      expect(room.players).toHaveLength(1);
      expect(room.players[0]).toEqual({ id: 'host-1', name: 'Alice', connected: true, avatar: null });
      expect(room.word).toBeNull();
      expect(room.category).toBeNull();
      expect(room.imposterId).toBeNull();
      expect(room.votes).toEqual({});
      expect(room.hideCategory).toBe(false);
      expect(room.customWordsEnabled).toBe(false);
      expect(room.includeDefaultWords).toBe(false);
      expect(room.requiredWordsPerPlayer).toBe(2);
      expect(room.customWordPool).toEqual([]);
      expect(room.wordSubmissions).toEqual({});
      expect(room.wordSubmittedBy).toBeNull();
    });
  });

  describe('addPlayer', () => {
    it('adds a player to the room', () => {
      room.addPlayer('player-2', 'Bob');
      expect(room.players).toHaveLength(2);
      expect(room.players[1]).toEqual({ id: 'player-2', name: 'Bob', connected: true, avatar: null });
    });

    it('throws if game is in progress', () => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
      expect(() => room.addPlayer('p4', 'Dave')).toThrow('Game already in progress');
    });

    it('throws if room is full (12 players)', () => {
      for (let i = 2; i <= 12; i++) {
        room.addPlayer(`p${i}`, `Player${i}`);
      }
      expect(room.players).toHaveLength(12);
      expect(() => room.addPlayer('p13', 'Player13')).toThrow('Room is full');
    });

    it('throws on duplicate name (case-insensitive)', () => {
      expect(() => room.addPlayer('p2', 'alice')).toThrow('Name already taken');
      expect(() => room.addPlayer('p2', 'ALICE')).toThrow('Name already taken');
    });
  });

  describe('removePlayer', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
    });

    it('marks player as disconnected', () => {
      room.removePlayer('p2');
      expect(room.players.find(p => p.id === 'p2')).toBeUndefined(); // removed in lobby
    });

    it('removes player from the list in LOBBY phase', () => {
      room.removePlayer('p2');
      expect(room.players).toHaveLength(2);
      expect(room.players.some(p => p.id === 'p2')).toBe(false);
    });

    it('keeps disconnected player in list during game', () => {
      room.startGame();
      room.removePlayer('p2');
      expect(room.players).toHaveLength(3);
      expect(room.players.find(p => p.id === 'p2').connected).toBe(false);
    });

    it('promotes next connected player as host when host leaves', () => {
      room.removePlayer('host-1');
      expect(room.hostId).toBe('p2');
    });

    it('removes vote from disconnected player', () => {
      room.startGame();
      // Advance to voting phase
      room.advancePhase(); // HINTING_1
      room.advancePhase(); // HINTING_2
      room.advancePhase(); // VOTING
      room.castVote('p2', 'host-1');
      room.removePlayer('p2');
      expect(room.votes['p2']).toBeUndefined();
    });

    it('returns true when room is empty', () => {
      room.removePlayer('p2');
      room.removePlayer('p3');
      const empty = room.removePlayer('host-1');
      expect(empty).toBe(true);
    });

    it('returns false when players remain', () => {
      const empty = room.removePlayer('p2');
      expect(empty).toBe(false);
    });

    it('does nothing for unknown player id', () => {
      room.removePlayer('unknown');
      expect(room.players).toHaveLength(3);
    });

    it('cleans up score when removing player in LOBBY', () => {
      expect(room.scores['p2']).toBe(0);
      room.removePlayer('p2');
      expect(room.scores['p2']).toBeUndefined();
    });

    it('transfers host to next connected player when host leaves in LOBBY', () => {
      room.removePlayer('host-1');
      expect(room.hostId).toBe('p2');
      expect(room.players.some(p => p.id === 'host-1')).toBe(false);
      expect(room.scores['host-1']).toBeUndefined();
    });
  });

  describe('connectedPlayers', () => {
    it('returns only connected players', () => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
      room.removePlayer('p2');
      expect(room.connectedPlayers).toHaveLength(2);
      expect(room.connectedPlayers.every(p => p.connected)).toBe(true);
    });
  });

  describe('startGame', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
    });

    it('requires at least 3 players', () => {
      const smallRoom = new Room('XYZW', 'h1', 'Host');
      smallRoom.addPlayer('p2', 'Bob');
      expect(() => smallRoom.startGame()).toThrow('Need at least 3 players');
    });

    it('sets word, category, imposterId, and phase', () => {
      room.startGame();
      expect(room.word).toBe('Elephant');
      expect(room.category).toBe('animals');
      expect(room.imposterId).toBeTruthy();
      expect(room.phase).toBe('WORD_REVEAL');
      expect(room.votes).toEqual({});
    });

    it('picks imposter from connected players', () => {
      room.startGame();
      const ids = room.connectedPlayers.map(p => p.id);
      expect(ids).toContain(room.imposterId);
    });
  });

  describe('advancePhase', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
    });

    it('advances through phases in order', () => {
      expect(room.phase).toBe('WORD_REVEAL');

      room.advancePhase();
      expect(room.phase).toBe('HINTING_1');

      room.advancePhase();
      expect(room.phase).toBe('HINTING_2');

      room.advancePhase();
      expect(room.phase).toBe('VOTING');
    });

    it('resets votes when entering VOTING phase', () => {
      room.advancePhase(); // HINTING_1
      room.advancePhase(); // HINTING_2
      room.votes = { 'p1': 'p2' }; // stale votes
      room.advancePhase(); // VOTING
      expect(room.votes).toEqual({});
    });

    it('returns tally results when entering RESULTS phase', () => {
      room.advancePhase(); // HINTING_1
      room.advancePhase(); // HINTING_2
      room.advancePhase(); // VOTING

      room.castVote('host-1', 'p2');
      room.castVote('p2', 'host-1');
      room.castVote('p3', 'host-1');

      const results = room.advancePhase(); // RESULTS
      expect(results).not.toBeNull();
      expect(results.votes).toBeDefined();
      expect(results.counts).toBeDefined();
      expect(results.imposterId).toBe(room.imposterId);
    });

    it('returns null for non-RESULTS phases', () => {
      const result = room.advancePhase(); // HINTING_1
      expect(result).toBeNull();
    });

    it('throws when already at RESULTS', () => {
      room.advancePhase(); // HINTING_1
      room.advancePhase(); // HINTING_2
      room.advancePhase(); // VOTING
      room.advancePhase(); // RESULTS
      expect(() => room.advancePhase()).toThrow('Cannot advance phase');
    });
  });

  describe('castVote', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
      room.advancePhase(); // HINTING_1
      room.advancePhase(); // HINTING_2
      room.advancePhase(); // VOTING
    });

    it('records a vote', () => {
      room.castVote('host-1', 'p2');
      expect(room.votes['host-1']).toBe('p2');
    });

    it('throws if not in voting phase', () => {
      const r = new Room('TEST', 'h', 'Host');
      r.addPlayer('p2', 'Bob');
      r.addPlayer('p3', 'Charlie');
      r.startGame();
      expect(() => r.castVote('h', 'p2')).toThrow('Not in voting phase');
    });

    it('throws for invalid target', () => {
      expect(() => room.castVote('host-1', 'nonexistent')).toThrow('Invalid target');
    });

    it('throws when voting for yourself', () => {
      expect(() => room.castVote('host-1', 'host-1')).toThrow('Cannot vote for yourself');
    });

    it('allows changing your vote', () => {
      room.castVote('host-1', 'p2');
      room.castVote('host-1', 'p3');
      expect(room.votes['host-1']).toBe('p3');
    });
  });

  describe('voteCount and expectedVotes', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
      room.advancePhase();
      room.advancePhase();
      room.advancePhase(); // VOTING
    });

    it('tracks vote count', () => {
      expect(room.voteCount).toBe(0);
      room.castVote('host-1', 'p2');
      expect(room.voteCount).toBe(1);
      room.castVote('p2', 'p3');
      expect(room.voteCount).toBe(2);
    });

    it('expectedVotes equals connected player count', () => {
      expect(room.expectedVotes).toBe(3);
    });
  });

  describe('tallyVotes', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
      room.imposterId = 'p3'; // fix imposter for deterministic tests
      room.advancePhase();
      room.advancePhase();
      room.advancePhase(); // VOTING
    });

    it('correctly identifies when imposter is caught', () => {
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');

      const results = room.tallyVotes();
      expect(results.imposterCaught).toBe(true);
      expect(results.isTie).toBe(false);
      expect(results.accused).toEqual(['p3']);
    });

    it('imposter wins on tie', () => {
      room.castVote('host-1', 'p2');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');

      const results = room.tallyVotes();
      expect(results.isTie).toBe(true);
      expect(results.imposterCaught).toBe(false);
    });

    it('imposter wins when wrong person accused', () => {
      room.castVote('host-1', 'p2');
      room.castVote('p2', 'host-1');
      room.castVote('p3', 'p2');

      const results = room.tallyVotes();
      expect(results.imposterCaught).toBe(false);
      expect(results.accused).toEqual(['p2']);
    });

    it('includes word and category in results', () => {
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');

      const results = room.tallyVotes();
      expect(results.word).toBe('Elephant');
      expect(results.category).toBe('animals');
    });
  });

  describe('scoreboard', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
      room.imposterId = 'p3'; // fix imposter for deterministic tests
      room.advancePhase();
      room.advancePhase();
      room.advancePhase(); // VOTING
    });

    it('initializes scores to 0 for all players', () => {
      expect(room.scores['host-1']).toBe(0);
      expect(room.scores['p2']).toBe(0);
      expect(room.scores['p3']).toBe(0);
    });

    it('awards +1 to players who correctly voted for imposter', () => {
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');

      const results = room.tallyVotes();
      expect(results.pointsAwarded['host-1']).toBe(1);
      expect(results.pointsAwarded['p2']).toBe(1);
      expect(results.pointsAwarded['p3']).toBeUndefined();
      expect(room.scores['host-1']).toBe(1);
      expect(room.scores['p2']).toBe(1);
      expect(room.scores['p3']).toBe(0);
    });

    it('awards +3 to imposter when imposter wins (wrong person accused)', () => {
      room.castVote('host-1', 'p2');
      room.castVote('p2', 'host-1');
      room.castVote('p3', 'p2');

      const results = room.tallyVotes();
      expect(results.pointsAwarded['p3']).toBe(3);
      expect(room.scores['p3']).toBe(3);
      expect(room.scores['host-1']).toBe(0);
      expect(room.scores['p2']).toBe(0);
    });

    it('awards +3 to imposter on tie', () => {
      room.castVote('host-1', 'p2');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');

      const results = room.tallyVotes();
      expect(results.pointsAwarded['p3']).toBe(3);
      expect(room.scores['p3']).toBe(3);
    });

    it('accumulates scores across multiple rounds', () => {
      // Round 1: imposter caught
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');
      room.tallyVotes();
      expect(room.scores['host-1']).toBe(1);

      // Round 2
      room.playAgain();
      room.imposterId = 'host-1';
      room.advancePhase(); // HINTING_1
      room.advancePhase(); // HINTING_2
      room.advancePhase(); // VOTING

      room.castVote('host-1', 'p2');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'p2');
      room.tallyVotes();
      // host-1 (imposter) wins -> +3
      expect(room.scores['host-1']).toBe(1 + 3);
    });

    it('includes scores in getPlayerInfo()', () => {
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');
      room.tallyVotes();

      const info = room.getPlayerInfo();
      const alice = info.find(p => p.id === 'host-1');
      expect(alice.score).toBe(1);
    });

    it('resets scores on returnToLobby', () => {
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');
      room.tallyVotes();
      expect(room.scores['host-1']).toBe(1);

      room.returnToLobby();
      expect(room.scores['host-1']).toBe(0);
      expect(room.scores['p2']).toBe(0);
      expect(room.scores['p3']).toBe(0);
    });

    it('preserves scores across playAgain', () => {
      room.castVote('host-1', 'p3');
      room.castVote('p2', 'p3');
      room.castVote('p3', 'host-1');
      room.tallyVotes();

      room.playAgain();
      expect(room.scores['host-1']).toBe(1);
      expect(room.scores['p2']).toBe(1);
      expect(room.scores['p3']).toBe(0);
    });

    it('cleans up disconnected player scores on playAgain', () => {
      const r = new Room('TEST', 'h1', 'Alice');
      r.addPlayer('p2', 'Bob');
      r.addPlayer('p3', 'Charlie');
      r.addPlayer('p4', 'Dave');
      r.startGame();
      r.scores['p2'] = 5;
      r.removePlayer('p2');
      r.playAgain();
      expect(r.scores['p2']).toBeUndefined();
    });
  });

  describe('playAgain', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
    });

    it('resets votes and starts a new game', () => {
      room.votes = { 'host-1': 'p2' };
      room.playAgain();
      expect(room.votes).toEqual({});
      expect(room.phase).toBe('WORD_REVEAL');
      expect(room.imposterId).toBeTruthy();
    });

    it('removes disconnected players', () => {
      // Need 4 players so removing one still leaves 3 (minimum to start)
      const r = new Room('TEST', 'h1', 'Alice');
      r.addPlayer('p2', 'Bob');
      r.addPlayer('p3', 'Charlie');
      r.addPlayer('p4', 'Dave');
      r.startGame();
      r.removePlayer('p2');
      r.playAgain();
      expect(r.players).toHaveLength(3);
      expect(r.players.every(p => p.connected)).toBe(true);
      expect(r.players.some(p => p.id === 'p2')).toBe(false);
    });
  });

  describe('returnToLobby', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.startGame();
    });

    it('resets room to lobby state', () => {
      room.returnToLobby();
      expect(room.phase).toBe('LOBBY');
      expect(room.word).toBeNull();
      expect(room.category).toBeNull();
      expect(room.imposterId).toBeNull();
      expect(room.votes).toEqual({});
    });

    it('removes disconnected players', () => {
      room.removePlayer('p2');
      room.returnToLobby();
      expect(room.players).toHaveLength(2);
    });
  });

  describe('transferHost', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
    });

    it('transfers host to another player', () => {
      room.transferHost('p2');
      expect(room.hostId).toBe('p2');
    });

    it('throws if not in LOBBY phase', () => {
      room.startGame();
      expect(() => room.transferHost('p2')).toThrow('Can only transfer host in lobby');
    });

    it('throws for invalid player id', () => {
      expect(() => room.transferHost('nonexistent')).toThrow('Invalid player');
    });

    it('throws if target is already the host', () => {
      expect(() => room.transferHost('host-1')).toThrow('Player is already the host');
    });

    it('throws for disconnected player', () => {
      room.startGame();
      room.removePlayer('p2');
      room.returnToLobby();
      expect(() => room.transferHost('p2')).toThrow('Invalid player');
    });
  });

  describe('getPlayerInfo', () => {
    it('returns sanitized player info', () => {
      room.addPlayer('p2', 'Bob');
      const info = room.getPlayerInfo();
      expect(info).toEqual([
        { id: 'host-1', name: 'Alice', connected: true, avatar: null, score: 0 },
        { id: 'p2', name: 'Bob', connected: true, avatar: null, score: 0 },
      ]);
    });
  });

  describe('custom words', () => {
    beforeEach(() => {
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');
      room.customWordsEnabled = true;
      room.requiredWordsPerPlayer = 2;
    });

    describe('startGame with custom words', () => {
      it('enters WORD_SUBMISSION phase when custom words enabled', () => {
        room.startGame();
        expect(room.phase).toBe('WORD_SUBMISSION');
        expect(room.customWordPool).toEqual([]);
        expect(room.wordSubmissions).toEqual({});
      });

      it('does not pick a word or imposter in WORD_SUBMISSION phase', () => {
        room.startGame();
        expect(room.word).toBeNull();
        expect(room.imposterId).toBeNull();
      });
    });

    describe('submitWords', () => {
      beforeEach(() => {
        room.startGame(); // enters WORD_SUBMISSION
      });

      it('adds words to the pool', () => {
        room.submitWords('host-1', ['Banana', 'Cherry']);
        expect(room.customWordPool).toHaveLength(2);
        expect(room.customWordPool[0]).toEqual({
          word: 'Banana',
          category: 'Custom',
          submittedBy: 'host-1',
          submittedByName: 'Alice',
        });
      });

      it('tracks submissions per player', () => {
        room.submitWords('host-1', ['Banana', 'Cherry']);
        expect(room.wordSubmissions['host-1']).toEqual(['Banana', 'Cherry']);
      });

      it('trims whitespace from words', () => {
        room.submitWords('host-1', ['  Banana  ', '  Cherry  ']);
        expect(room.wordSubmissions['host-1']).toEqual(['Banana', 'Cherry']);
        expect(room.customWordPool[0].word).toBe('Banana');
      });

      it('throws if not in WORD_SUBMISSION phase', () => {
        room.returnToLobby();
        expect(() => room.submitWords('host-1', ['Banana', 'Cherry'])).toThrow('Not in word submission phase');
      });

      it('throws if wrong number of words', () => {
        expect(() => room.submitWords('host-1', ['Banana'])).toThrow('Must submit exactly 2 word(s)');
      });

      it('throws if words are empty', () => {
        expect(() => room.submitWords('host-1', ['Banana', ''])).toThrow('Words cannot be empty');
        expect(() => room.submitWords('host-1', ['Banana', '   '])).toThrow('Words cannot be empty');
      });

      it('throws for unknown player', () => {
        expect(() => room.submitWords('unknown', ['Banana', 'Cherry'])).toThrow('Player not found');
      });

      it('allows re-submission (replaces previous)', () => {
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('host-1', ['Mango', 'Grape']);
        expect(room.customWordPool).toHaveLength(2);
        expect(room.wordSubmissions['host-1']).toEqual(['Mango', 'Grape']);
        expect(room.customWordPool[0].word).toBe('Mango');
      });
    });

    describe('getSubmissionStatus', () => {
      beforeEach(() => {
        room.startGame();
      });

      it('returns status for all connected players', () => {
        const status = room.getSubmissionStatus();
        expect(status.submissions).toEqual({
          'host-1': false,
          'p2': false,
          'p3': false,
        });
        expect(status.submittedCount).toBe(0);
        expect(status.totalCount).toBe(3);
      });

      it('tracks submitted players', () => {
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('p2', ['Mango', 'Grape']);
        const status = room.getSubmissionStatus();
        expect(status.submissions['host-1']).toBe(true);
        expect(status.submissions['p2']).toBe(true);
        expect(status.submissions['p3']).toBe(false);
        expect(status.submittedCount).toBe(2);
        expect(status.totalCount).toBe(3);
      });
    });

    describe('advancePhase from WORD_SUBMISSION', () => {
      beforeEach(() => {
        room.startGame();
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('p2', ['Mango', 'Grape']);
        room.submitWords('p3', ['Apple', 'Lemon']);
      });

      it('picks a word and imposter when advancing to WORD_REVEAL', () => {
        room.advancePhase();
        expect(room.phase).toBe('WORD_REVEAL');
        expect(room.word).toBeTruthy();
        expect(room.imposterId).toBeTruthy();
      });

      it('picks word from custom pool', () => {
        room.advancePhase();
        const poolWords = room.customWordPool.map(w => w.word);
        expect(poolWords).toContain(room.word);
      });

      it('sets wordSubmittedBy to the submitter name', () => {
        room.advancePhase();
        expect(room.wordSubmittedBy).toBeTruthy();
        // wordSubmittedBy should be one of the player names
        const names = ['Alice', 'Bob', 'Charlie'];
        expect(names).toContain(room.wordSubmittedBy);
      });

      it('does not pick word submitter as imposter', () => {
        // Run multiple times to verify statistically
        for (let i = 0; i < 50; i++) {
          room.phase = 'WORD_SUBMISSION';
          room.advancePhase();
          const chosenWord = room.customWordPool.find(w => w.word === room.word);
          expect(room.imposterId).not.toBe(chosenWord.submittedBy);
        }
      });

      it('throws if no words available', () => {
        room.customWordPool = [];
        expect(() => room.advancePhase()).toThrow('No words available');
        expect(room.phase).toBe('WORD_SUBMISSION'); // phase should not have changed
      });
    });

    describe('advancePhase with includeDefaultWords', () => {
      beforeEach(() => {
        room.includeDefaultWords = true;
        room.startGame();
      });

      it('can advance even with no custom submissions if defaults included', () => {
        // With includeDefaultWords, pool includes defaults even without custom submissions
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('p2', ['Mango', 'Grape']);
        room.submitWords('p3', ['Apple', 'Lemon']);
        room.advancePhase();
        expect(room.phase).toBe('WORD_REVEAL');
        expect(room.word).toBeTruthy();
      });
    });

    describe('tallyVotes with custom words', () => {
      beforeEach(() => {
        room.startGame();
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('p2', ['Mango', 'Grape']);
        room.submitWords('p3', ['Apple', 'Lemon']);
        room.advancePhase(); // WORD_REVEAL
        room.advancePhase(); // HINTING_1
        room.advancePhase(); // HINTING_2
        room.advancePhase(); // VOTING
      });

      it('includes wordSubmittedBy in results', () => {
        room.castVote('host-1', 'p2');
        room.castVote('p2', 'p3');
        room.castVote('p3', 'host-1');
        const results = room.tallyVotes();
        expect(results).toHaveProperty('wordSubmittedBy');
        expect(typeof results.wordSubmittedBy).toBe('string');
      });
    });

    describe('playAgain with custom words', () => {
      beforeEach(() => {
        room.startGame();
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('p2', ['Mango', 'Grape']);
        room.submitWords('p3', ['Apple', 'Lemon']);
        room.advancePhase(); // WORD_REVEAL
      });

      it('re-uses custom word pool on playAgain', () => {
        const poolBefore = [...room.customWordPool];
        room.playAgain();
        expect(room.phase).toBe('WORD_REVEAL');
        expect(room.word).toBeTruthy();
        expect(room.customWordPool).toEqual(poolBefore);
      });

      it('does not make submitter the imposter on playAgain', () => {
        for (let i = 0; i < 50; i++) {
          room.playAgain();
          const chosenWord = room.customWordPool.find(w => w.word === room.word);
          expect(room.imposterId).not.toBe(chosenWord.submittedBy);
        }
      });
    });

    describe('returnToLobby clears custom words', () => {
      it('clears custom word state', () => {
        room.startGame();
        room.submitWords('host-1', ['Banana', 'Cherry']);
        room.submitWords('p2', ['Mango', 'Grape']);
        room.submitWords('p3', ['Apple', 'Lemon']);
        room.advancePhase(); // WORD_REVEAL

        room.returnToLobby();
        expect(room.customWordPool).toEqual([]);
        expect(room.wordSubmissions).toEqual({});
        expect(room.wordSubmittedBy).toBeNull();
      });
    });
  });
});
