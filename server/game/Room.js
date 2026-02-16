import { getRandomWord } from './words.js';

const PHASES = ['LOBBY', 'WORD_REVEAL', 'HINTING_1', 'HINTING_2', 'VOTING', 'RESULTS'];

export default class Room {
  constructor(code, hostId, hostName) {
    this.code = code;
    this.phase = 'LOBBY';
    this.players = [{ id: hostId, name: hostName, connected: true }];
    this.hostId = hostId;
    this.word = null;
    this.category = null;
    this.imposterId = null;
    this.votes = {};       // voterId -> targetId
    this.cleanupTimer = null;
    this.hideCategory = false; // hide category from imposter
  }

  addPlayer(id, name) {
    if (this.phase !== 'LOBBY') throw new Error('Game already in progress');
    if (this.players.length >= 12) throw new Error('Room is full');
    if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Name already taken');
    }
    this.players.push({ id, name, connected: true });
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx === -1) return;

    this.players[idx].connected = false;

    // Remove vote from disconnected player
    delete this.votes[id];

    // If host left, promote next connected player
    if (id === this.hostId) {
      const next = this.players.find(p => p.connected);
      if (next) {
        this.hostId = next.id;
      }
    }

    // In lobby, fully remove disconnected players
    if (this.phase === 'LOBBY') {
      this.players.splice(idx, 1);
    }

    return this.connectedPlayers.length === 0;
  }

  get connectedPlayers() {
    return this.players.filter(p => p.connected);
  }

  startGame() {
    if (this.connectedPlayers.length < 3) throw new Error('Need at least 3 players');
    const { word, category } = getRandomWord();
    this.word = word;
    this.category = category;
    this.votes = {};

    // Pick random imposter from connected players
    const connected = this.connectedPlayers;
    this.imposterId = connected[Math.floor(Math.random() * connected.length)].id;
    this.phase = 'WORD_REVEAL';
  }

  advancePhase() {
    const idx = PHASES.indexOf(this.phase);
    if (idx === -1 || idx >= PHASES.length - 1) throw new Error('Cannot advance phase');
    this.phase = PHASES[idx + 1];

    if (this.phase === 'VOTING') {
      this.votes = {};
    }

    if (this.phase === 'RESULTS') {
      return this.tallyVotes();
    }
    return null;
  }

  castVote(voterId, targetId) {
    if (this.phase !== 'VOTING') throw new Error('Not in voting phase');
    if (!this.players.some(p => p.id === targetId)) throw new Error('Invalid target');
    if (voterId === targetId) throw new Error('Cannot vote for yourself');
    this.votes[voterId] = targetId;
  }

  get voteCount() {
    return Object.keys(this.votes).length;
  }

  get expectedVotes() {
    return this.connectedPlayers.length;
  }

  tallyVotes() {
    const counts = {};
    for (const targetId of Object.values(this.votes)) {
      counts[targetId] = (counts[targetId] || 0) + 1;
    }

    // Find max votes
    let maxVotes = 0;
    let accused = [];
    for (const [playerId, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        accused = [playerId];
      } else if (count === maxVotes) {
        accused.push(playerId);
      }
    }

    // Tie = imposter wins
    const isTie = accused.length > 1;
    const imposterCaught = !isTie && accused[0] === this.imposterId;

    return {
      votes: this.votes,
      counts,
      accused,
      isTie,
      imposterId: this.imposterId,
      imposterCaught,
      word: this.word,
      category: this.category,
    };
  }

  playAgain() {
    this.votes = {};
    // Remove disconnected players
    this.players = this.players.filter(p => p.connected);
    this.startGame();
  }

  returnToLobby() {
    this.phase = 'LOBBY';
    this.word = null;
    this.category = null;
    this.imposterId = null;
    this.votes = {};
    // Remove disconnected players
    this.players = this.players.filter(p => p.connected);
  }

  transferHost(newHostId) {
    if (this.phase !== 'LOBBY') throw new Error('Can only transfer host in lobby');
    const target = this.players.find(p => p.id === newHostId && p.connected);
    if (!target) throw new Error('Invalid player');
    if (newHostId === this.hostId) throw new Error('Player is already the host');
    this.hostId = newHostId;
  }

  getPlayerInfo() {
    return this.players.map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
    }));
  }
}
