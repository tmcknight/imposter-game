import { getRandomWord, getAllDefaultWords } from './words.js';

const PHASES = ['LOBBY', 'WORD_SUBMISSION', 'WORD_REVEAL', 'HINTING_1', 'HINTING_2', 'VOTING', 'RESULTS'];

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

    // Custom words settings
    this.customWordsEnabled = false;
    this.includeDefaultWords = false;
    this.requiredWordsPerPlayer = 2;

    // Custom words state (per-round)
    this.customWordPool = [];    // [{ word, category, submittedBy, submittedByName }]
    this.wordSubmissions = {};   // playerId -> [words]
    this.wordSubmittedBy = null; // name of player who submitted the chosen word
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
    this.votes = {};

    if (this.customWordsEnabled) {
      this.customWordPool = [];
      this.wordSubmissions = {};
      this.wordSubmittedBy = null;
      this.phase = 'WORD_SUBMISSION';
    } else {
      this._pickWordAndImposter();
      this.phase = 'WORD_REVEAL';
    }
  }

  _pickWordAndImposter() {
    const { word, category } = getRandomWord();
    this.word = word;
    this.category = category;
    this.wordSubmittedBy = null;

    const connected = this.connectedPlayers;
    this.imposterId = connected[Math.floor(Math.random() * connected.length)].id;
  }

  _pickWordFromPool() {
    let pool = [...this.customWordPool];
    if (this.includeDefaultWords) {
      pool = [...pool, ...getAllDefaultWords()];
    }

    if (pool.length === 0) throw new Error('No words available');

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.word = chosen.word;
    this.category = chosen.category || 'Custom';
    this.wordSubmittedBy = chosen.submittedByName || null;

    // Pick imposter, excluding the word submitter
    const connected = this.connectedPlayers;
    let eligible = connected;
    if (chosen.submittedBy) {
      eligible = connected.filter(p => p.id !== chosen.submittedBy);
    }
    if (eligible.length === 0) eligible = connected;

    this.imposterId = eligible[Math.floor(Math.random() * eligible.length)].id;
  }

  submitWords(playerId, words) {
    if (this.phase !== 'WORD_SUBMISSION') throw new Error('Not in word submission phase');
    const player = this.players.find(p => p.id === playerId && p.connected);
    if (!player) throw new Error('Player not found');
    if (!Array.isArray(words) || words.length !== this.requiredWordsPerPlayer) {
      throw new Error(`Must submit exactly ${this.requiredWordsPerPlayer} word(s)`);
    }
    if (words.some(w => typeof w !== 'string' || w.trim().length === 0)) {
      throw new Error('Words cannot be empty');
    }

    // Remove previous submissions from this player (allows re-submission)
    this.customWordPool = this.customWordPool.filter(w => w.submittedBy !== playerId);

    // Store submissions
    this.wordSubmissions[playerId] = words.map(w => w.trim());

    // Add to pool
    for (const word of words) {
      this.customWordPool.push({
        word: word.trim(),
        category: 'Custom',
        submittedBy: playerId,
        submittedByName: player.name,
      });
    }
  }

  getSubmissionStatus() {
    const submissions = {};
    for (const player of this.connectedPlayers) {
      submissions[player.id] = !!this.wordSubmissions[player.id];
    }
    return {
      submissions,
      submittedCount: Object.values(submissions).filter(Boolean).length,
      totalCount: this.connectedPlayers.length,
    };
  }

  advancePhase() {
    const idx = PHASES.indexOf(this.phase);
    if (idx === -1 || idx >= PHASES.length - 1) throw new Error('Cannot advance phase');

    const nextPhase = PHASES[idx + 1];

    // If transitioning from WORD_SUBMISSION, pick word before updating phase
    if (this.phase === 'WORD_SUBMISSION' && nextPhase === 'WORD_REVEAL') {
      this._pickWordFromPool();
    }

    this.phase = nextPhase;

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
      wordSubmittedBy: this.wordSubmittedBy,
    };
  }

  playAgain() {
    this.votes = {};
    // Remove disconnected players
    this.players = this.players.filter(p => p.connected);

    if (this.connectedPlayers.length < 3) throw new Error('Need at least 3 players');

    if (this.customWordsEnabled && this.customWordPool.length > 0) {
      this._pickWordFromPool();
    } else {
      this._pickWordAndImposter();
    }
    this.phase = 'WORD_REVEAL';
  }

  returnToLobby() {
    this.phase = 'LOBBY';
    this.word = null;
    this.category = null;
    this.imposterId = null;
    this.votes = {};
    this.wordSubmittedBy = null;
    this.customWordPool = [];
    this.wordSubmissions = {};
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
