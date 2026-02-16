import { describe, it, expect, beforeEach, vi } from 'vitest';
import Room from './Room.js';

// Mock getRandomWord
vi.mock('./words.js', () => ({
  getRandomWord: vi.fn(() => ({ category: 'animals', word: 'Elephant' })),
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
      expect(room.players[0]).toEqual({ id: 'host-1', name: 'Alice', connected: true });
      expect(room.word).toBeNull();
      expect(room.category).toBeNull();
      expect(room.imposterId).toBeNull();
      expect(room.votes).toEqual({});
      expect(room.hideCategory).toBe(false);
    });
  });

  describe('addPlayer', () => {
    it('adds a player to the room', () => {
      room.addPlayer('player-2', 'Bob');
      expect(room.players).toHaveLength(2);
      expect(room.players[1]).toEqual({ id: 'player-2', name: 'Bob', connected: true });
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

  describe('getPlayerInfo', () => {
    it('returns sanitized player info', () => {
      room.addPlayer('p2', 'Bob');
      const info = room.getPlayerInfo();
      expect(info).toEqual([
        { id: 'host-1', name: 'Alice', connected: true },
        { id: 'p2', name: 'Bob', connected: true },
      ]);
    });
  });
});
