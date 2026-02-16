import roomManager from '../game/RoomManager.js';

export default function registerHandlers(io, socket) {
  socket.on('create-room', ({ playerName, avatar }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName, avatar);
      socket.join(room.code);
      callback({
        ok: true,
        roomCode: room.code,
        playerId: socket.id,
        players: room.getPlayerInfo(),
        hostId: room.hostId,
        hideCategory: room.hideCategory,
        customWordsEnabled: room.customWordsEnabled,
        includeDefaultWords: room.includeDefaultWords,
        requiredWordsPerPlayer: room.requiredWordsPerPlayer,
      });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('join-room', ({ roomCode, playerName, avatar }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });

      room.addPlayer(socket.id, playerName, avatar);
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
        customWordsEnabled: room.customWordsEnabled,
        includeDefaultWords: room.includeDefaultWords,
        requiredWordsPerPlayer: room.requiredWordsPerPlayer,
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
      if (typeof settings.customWordsEnabled === 'boolean') {
        room.customWordsEnabled = settings.customWordsEnabled;
      }
      if (typeof settings.includeDefaultWords === 'boolean') {
        room.includeDefaultWords = settings.includeDefaultWords;
      }
      if (typeof settings.requiredWordsPerPlayer === 'number') {
        const n = Math.floor(settings.requiredWordsPerPlayer);
        if (n >= 1 && n <= 5) {
          room.requiredWordsPerPlayer = n;
        }
      }

      io.to(room.code).emit('settings-updated', {
        hideCategory: room.hideCategory,
        customWordsEnabled: room.customWordsEnabled,
        includeDefaultWords: room.includeDefaultWords,
        requiredWordsPerPlayer: room.requiredWordsPerPlayer,
      });
      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('transfer-host', ({ roomCode, newHostId }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });
      if (socket.id !== room.hostId) return callback({ ok: false, error: 'Only the host can transfer host' });

      room.transferHost(newHostId);

      io.to(room.code).emit('host-changed', {
        hostId: room.hostId,
        players: room.getPlayerInfo(),
      });

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

      if (room.phase === 'WORD_SUBMISSION') {
        // Custom words mode - broadcast phase change, no word info yet
        io.to(room.code).emit('phase-changed', {
          phase: room.phase,
          players: room.getPlayerInfo(),
          hostId: room.hostId,
        });
      } else {
        // Normal mode - send personalized payloads
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
      }

      callback({ ok: true });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  socket.on('submit-words', ({ roomCode, words }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });

      room.submitWords(socket.id, words);

      // Broadcast submission status update
      io.to(room.code).emit('word-submissions-update', room.getSubmissionStatus());

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

      const prevPhase = room.phase;
      const results = room.advancePhase();

      if (results) {
        // Results phase - send results with player names
        const imposterPlayer = room.players.find(p => p.id === results.imposterId);
        const resultsWithNames = {
          ...results,
          imposterName: imposterPlayer?.name,
          imposterAvatar: imposterPlayer?.avatar || null,
          players: room.getPlayerInfo(),
          voteSummary: Object.entries(results.votes).map(([voterId, targetId]) => {
            const voterPlayer = room.players.find(p => p.id === voterId);
            const targetPlayer = room.players.find(p => p.id === targetId);
            return {
              voter: voterPlayer?.name,
              voterAvatar: voterPlayer?.avatar || null,
              target: targetPlayer?.name,
              targetAvatar: targetPlayer?.avatar || null,
            };
          }),
        };
        io.to(room.code).emit('results', resultsWithNames);
      } else if (prevPhase === 'WORD_SUBMISSION' && room.phase === 'WORD_REVEAL') {
        // Transitioning from word submission - send personalized payloads
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

  socket.on('leave-room', ({ roomCode }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ ok: false, error: 'Room not found' });

      const empty = room.removePlayer(socket.id);
      socket.leave(room.code);

      if (empty) {
        roomManager.scheduleCleanup(room.code);
      } else {
        socket.to(room.code).emit('player-left', {
          players: room.getPlayerInfo(),
          hostId: room.hostId,
        });
      }

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

      // If in word submission phase, update submission status
      if (room.phase === 'WORD_SUBMISSION') {
        socket.to(room.code).emit('word-submissions-update', room.getSubmissionStatus());
      }
    }
  });
}
