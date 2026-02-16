import roomManager from '../game/RoomManager.js';

export default function registerHandlers(io, socket) {
  socket.on('create-room', ({ playerName }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName);
      socket.join(room.code);
      callback({
        ok: true,
        roomCode: room.code,
        playerId: socket.id,
        players: room.getPlayerInfo(),
        hostId: room.hostId,
        hideCategory: room.hideCategory,
      });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });

      room.addPlayer(socket.id, playerName);
      socket.join(room.code);

      // Notify others
      socket.to(room.code).emit('player-joined', {
        players: room.getPlayerInfo(),
        hostId: room.hostId,
      });

      callback({
        ok: true,
        roomCode: room.code,
        playerId: socket.id,
        players: room.getPlayerInfo(),
        hostId: room.hostId,
        hideCategory: room.hideCategory,
      });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('update-settings', ({ roomCode, settings }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });
      if (socket.id !== room.hostId) return callback({ ok: false, error: 'Only the host can change settings' });
      if (room.phase !== 'LOBBY') return callback({ ok: false, error: 'Can only change settings in lobby' });

      if (typeof settings.hideCategory === 'boolean') {
        room.hideCategory = settings.hideCategory;
      }

      io.to(room.code).emit('settings-updated', { hideCategory: room.hideCategory });
      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('start-game', ({ roomCode }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });
      if (socket.id !== room.hostId) return callback({ ok: false, error: 'Only the host can start' });

      room.startGame();

      // Send personalized payloads
      for (const player of room.connectedPlayers) {
        const isImposter = player.id === room.imposterId;
        io.to(player.id).emit('game-started', {
          phase: room.phase,
          word: isImposter ? null : room.word,
          category: (isImposter && room.hideCategory) ? null : room.category,
          isImposter,
          players: room.getPlayerInfo(),
          hostId: room.hostId,
        });
      }

      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('advance-phase', ({ roomCode }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });
      if (socket.id !== room.hostId) return callback({ ok: false, error: 'Only the host can advance' });

      const results = room.advancePhase();

      if (results) {
        // Results phase - send results with player names
        const resultsWithNames = {
          ...results,
          imposterName: room.players.find(p => p.id === results.imposterId)?.name,
          players: room.getPlayerInfo(),
          voteSummary: Object.entries(results.votes).map(([voterId, targetId]) => ({
            voter: room.players.find(p => p.id === voterId)?.name,
            target: room.players.find(p => p.id === targetId)?.name,
          })),
        };
        io.to(room.code).emit('results', resultsWithNames);
      } else {
        io.to(room.code).emit('phase-changed', {
          phase: room.phase,
          players: room.getPlayerInfo(),
        });
      }

      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('cast-vote', ({ roomCode, targetId }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });

      room.castVote(socket.id, targetId);

      io.to(room.code).emit('vote-update', {
        voteCount: room.voteCount,
        expectedVotes: room.expectedVotes,
      });

      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('play-again', ({ roomCode }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });
      if (socket.id !== room.hostId) return callback({ ok: false, error: 'Only the host can restart' });

      room.playAgain();

      for (const player of room.connectedPlayers) {
        const isImposter = player.id === room.imposterId;
        io.to(player.id).emit('game-started', {
          phase: room.phase,
          word: isImposter ? null : room.word,
          category: (isImposter && room.hideCategory) ? null : room.category,
          isImposter,
          players: room.getPlayerInfo(),
          hostId: room.hostId,
        });
      }

      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('return-to-lobby', ({ roomCode }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });
      if (socket.id !== room.hostId) return callback({ ok: false, error: 'Only the host can return to lobby' });

      room.returnToLobby();

      io.to(room.code).emit('phase-changed', {
        phase: room.phase,
        players: room.getPlayerInfo(),
        hostId: room.hostId,
      });

      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    const result = roomManager.removePlayerFromAll(socket.id);
    if (result) {
      const { room } = result;
      socket.to(room.code).emit('player-left', {
        players: room.getPlayerInfo(),
        hostId: room.hostId,
      });
    }
  });
}
