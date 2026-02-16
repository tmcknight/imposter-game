import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We need to import a fresh RoomManager for each test since it's a singleton
// Re-mock the module to get fresh instances
vi.mock('./words.js', () => ({
  getRandomWord: vi.fn(() => ({ word: 'Elephant' })),
}));

// Import the module - it exports a singleton, so we'll work with it directly
import roomManager from './RoomManager.js';

describe('RoomManager', () => {
  beforeEach(() => {
    // Clear all rooms before each test
    roomManager.rooms.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCode', () => {
    it('generates a 4-character code', () => {
      const code = roomManager.generateCode();
      expect(code).toHaveLength(4);
    });

    it('uses only allowed characters (no I or O)', () => {
      for (let i = 0; i < 50; i++) {
        const code = roomManager.generateCode();
        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
      }
    });

    it('generates unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 20; i++) {
        codes.add(roomManager.generateCode());
      }
      expect(codes.size).toBe(20);
    });
  });

  describe('createRoom', () => {
    it('creates a room and stores it', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      expect(room.code).toHaveLength(4);
      expect(room.hostId).toBe('host-1');
      expect(room.players[0].name).toBe('Alice');
      expect(roomManager.rooms.size).toBe(1);
    });

    it('creates multiple rooms', () => {
      roomManager.createRoom('h1', 'Alice');
      roomManager.createRoom('h2', 'Bob');
      expect(roomManager.rooms.size).toBe(2);
    });
  });

  describe('getRoom', () => {
    it('returns the room by code', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      const found = roomManager.getRoom(room.code);
      expect(found).toBe(room);
    });

    it('is case-insensitive', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      const found = roomManager.getRoom(room.code.toLowerCase());
      expect(found).toBe(room);
    });

    it('returns null for unknown code', () => {
      expect(roomManager.getRoom('ZZZZ')).toBeNull();
    });
  });

  describe('removePlayerFromAll', () => {
    it('removes a player from their room', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      room.addPlayer('p2', 'Bob');
      room.addPlayer('p3', 'Charlie');

      const result = roomManager.removePlayerFromAll('p2');
      expect(result).not.toBeNull();
      expect(result.room).toBe(room);
      expect(result.player.id).toBe('p2');
    });

    it('returns null if player not found', () => {
      roomManager.createRoom('host-1', 'Alice');
      expect(roomManager.removePlayerFromAll('unknown')).toBeNull();
    });

    it('schedules cleanup when room becomes empty', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      const spy = vi.spyOn(roomManager, 'scheduleCleanup');
      roomManager.removePlayerFromAll('host-1');
      expect(spy).toHaveBeenCalledWith(room.code);
    });
  });

  describe('scheduleCleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deletes empty room after delay', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      const code = room.code;
      roomManager.removePlayerFromAll('host-1');

      expect(roomManager.rooms.has(code)).toBe(true);
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(roomManager.rooms.has(code)).toBe(false);
    });

    it('does not delete room if players reconnect', () => {
      const room = roomManager.createRoom('host-1', 'Alice');
      room.addPlayer('p2', 'Bob');
      const code = room.code;

      // Remove one player, room is not empty
      roomManager.removePlayerFromAll('host-1');

      // Room should persist after timeout since it still has connected players
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(roomManager.rooms.has(code)).toBe(true);
    });
  });
});
