import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../socket.js';

const GameContext = createContext(null);

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [state, setState] = useState({
    phase: null,       // null = not in a room
    roomCode: null,
    playerId: null,
    playerName: null,
    players: [],
    hostId: null,
    word: null,
    category: null,
    isImposter: false,
    voteCount: 0,
    expectedVotes: 0,
    hasVoted: false,
    results: null,
    error: null,
    hideCategory: false,
  });

  useEffect(() => {
    socket.connect();

    socket.on('player-joined', ({ players, hostId }) => {
      setState(s => ({ ...s, players, hostId }));
    });

    socket.on('player-left', ({ players, hostId }) => {
      setState(s => ({ ...s, players, hostId }));
    });

    socket.on('game-started', ({ phase, word, category, isImposter, players, hostId }) => {
      setState(s => ({
        ...s,
        phase,
        word,
        category,
        isImposter,
        players,
        hostId,
        hasVoted: false,
        voteCount: 0,
        expectedVotes: 0,
        results: null,
      }));
    });

    socket.on('phase-changed', ({ phase, players, hostId }) => {
      setState(s => ({
        ...s,
        phase,
        players: players || s.players,
        hostId: hostId || s.hostId,
        hasVoted: false,
        voteCount: 0,
        expectedVotes: 0,
      }));
    });

    socket.on('vote-update', ({ voteCount, expectedVotes }) => {
      setState(s => ({ ...s, voteCount, expectedVotes }));
    });

    socket.on('host-changed', ({ hostId, players }) => {
      setState(s => ({ ...s, hostId, players }));
    });

    socket.on('settings-updated', ({ hideCategory }) => {
      setState(s => ({ ...s, hideCategory }));
    });

    socket.on('results', (results) => {
      setState(s => ({ ...s, phase: 'RESULTS', results }));
    });

    return () => {
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('phase-changed');
      socket.off('vote-update');
      socket.off('host-changed');
      socket.off('settings-updated');
      socket.off('results');
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName) => {
    socket.emit('create-room', { playerName }, (res) => {
      if (res.ok) {
        setState(s => ({
          ...s,
          phase: 'LOBBY',
          roomCode: res.roomCode,
          playerId: res.playerId,
          playerName,
          players: res.players,
          hostId: res.hostId,
          hideCategory: res.hideCategory ?? false,
          error: null,
        }));
      } else {
        setState(s => ({ ...s, error: res.error }));
      }
    });
  }, []);

  const joinRoom = useCallback((roomCode, playerName) => {
    socket.emit('join-room', { roomCode, playerName }, (res) => {
      if (res.ok) {
        setState(s => ({
          ...s,
          phase: 'LOBBY',
          roomCode: res.roomCode,
          playerId: res.playerId,
          playerName,
          players: res.players,
          hostId: res.hostId,
          hideCategory: res.hideCategory ?? false,
          error: null,
        }));
      } else {
        setState(s => ({ ...s, error: res.error }));
      }
    });
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start-game', { roomCode: state.roomCode }, (res) => {
      if (!res.ok) setState(s => ({ ...s, error: res.error }));
    });
  }, [state.roomCode]);

  const advancePhase = useCallback(() => {
    socket.emit('advance-phase', { roomCode: state.roomCode }, (res) => {
      if (!res.ok) setState(s => ({ ...s, error: res.error }));
    });
  }, [state.roomCode]);

  const castVote = useCallback((targetId) => {
    socket.emit('cast-vote', { roomCode: state.roomCode, targetId }, (res) => {
      if (res.ok) {
        setState(s => ({ ...s, hasVoted: true }));
      } else {
        setState(s => ({ ...s, error: res.error }));
      }
    });
  }, [state.roomCode]);

  const playAgain = useCallback(() => {
    socket.emit('play-again', { roomCode: state.roomCode }, (res) => {
      if (!res.ok) setState(s => ({ ...s, error: res.error }));
    });
  }, [state.roomCode]);

  const returnToLobby = useCallback(() => {
    socket.emit('return-to-lobby', { roomCode: state.roomCode }, (res) => {
      if (!res.ok) setState(s => ({ ...s, error: res.error }));
    });
  }, [state.roomCode]);

  const transferHost = useCallback((newHostId) => {
    socket.emit('transfer-host', { roomCode: state.roomCode, newHostId }, (res) => {
      if (!res.ok) setState(s => ({ ...s, error: res.error }));
    });
  }, [state.roomCode]);

  const updateSettings = useCallback((settings) => {
    socket.emit('update-settings', { roomCode: state.roomCode, settings }, (res) => {
      if (!res.ok) setState(s => ({ ...s, error: res.error }));
    });
  }, [state.roomCode]);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  const isHost = state.playerId === state.hostId;

  return (
    <GameContext.Provider value={{
      ...state,
      isHost,
      createRoom,
      joinRoom,
      startGame,
      advancePhase,
      castVote,
      playAgain,
      returnToLobby,
      transferHost,
      updateSettings,
      clearError,
    }}>
      {children}
    </GameContext.Provider>
  );
}
