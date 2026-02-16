import Room from './Room.js';

const CLEANUP_DELAY = 5 * 60 * 1000; // 5 minutes

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O to avoid confusion
    let code;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostId, hostName, hostAvatar) {
    const code = this.generateCode();
    const room = new Room(code, hostId, hostName, hostAvatar);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code.toUpperCase()) || null;
  }

  removePlayerFromAll(socketId) {
    for (const [code, room] of this.rooms) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        const empty = room.removePlayer(socketId);
        if (empty) {
          this.scheduleCleanup(code);
        }
        return { room, player };
      }
    }
    return null;
  }

  scheduleCleanup(code) {
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    room.cleanupTimer = setTimeout(() => {
      if (room.connectedPlayers.length === 0) {
        this.rooms.delete(code);
      }
    }, CLEANUP_DELAY);
  }
}

export default new RoomManager();
