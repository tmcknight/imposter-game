import { useGame } from '../context/GameContext.jsx';
import { TrophyIcon, FaceFrownIcon, ArrowPathIcon, ArrowUturnLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar.jsx';
import Scoreboard from './Scoreboard.jsx';

export default function Results() {
  const { results, isHost, playAgain, returnToLobby } = useGame();

  if (!results) return null;

  const caught = results.imposterCaught;

  return (
    <div className="flex flex-col gap-5 flex-1 animate-fade-in">
      {/* Outcome banner */}
      <div className={`text-center py-6 px-4 rounded-xl animate-scale-in ${
        caught
          ? 'bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/30'
          : 'bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30'
      }`}>
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 ${
          caught ? 'bg-accent-green/20' : 'bg-accent/20'
        }`}>
          {caught ? (
            <TrophyIcon className="w-8 h-8 text-accent-green" />
          ) : (
            <FaceFrownIcon className="w-8 h-8 text-accent" />
          )}
        </div>
        <h2 className={`text-3xl font-bold ${caught ? 'text-accent-green' : 'text-accent'}`}>
          {caught ? 'Imposter Caught!' : 'Imposter Wins!'}
        </h2>
        {results.isTie && <p className="text-accent/80 text-sm mt-2">It was a tie — imposter wins!</p>}
      </div>

      {/* Reveal cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-2">
        <div className="bg-surface rounded-xl p-4 text-center glow-surface flex flex-col items-center">
          <span className="block text-xs text-text-dim uppercase tracking-widest mb-2">Imposter</span>
          <Avatar name={results.imposterName} avatar={results.imposterAvatar} size="lg" />
          <span className="text-lg font-bold text-accent mt-1.5">{results.imposterName}</span>
        </div>
        <div className="bg-surface rounded-xl p-4 text-center glow-surface">
          <span className="block text-xs text-text-dim uppercase tracking-widest mb-1">The Word</span>
          <span className="text-lg font-bold text-accent-green">{results.word}</span>
          <span className="block text-xs text-text-dim mt-0.5">{results.category}</span>
          {results.wordSubmittedBy && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent mt-1.5">
              <PencilSquareIcon className="w-3 h-3" />
              {results.wordSubmittedBy}
            </span>
          )}
        </div>
      </div>

      {/* Vote breakdown */}
      <div className="bg-surface rounded-xl p-4 glow-surface animate-fade-in-up stagger-4">
        <h3 className="mb-3 text-xs uppercase tracking-widest text-text-dim">Vote Breakdown</h3>
        <ul className="list-none flex flex-col gap-2">
          {results.voteSummary.map((v, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <Avatar name={v.voter} avatar={v.voterAvatar} size="sm" />
              <span className="text-text-dim">{v.voter}</span>
              <span className="text-text-dim/50">→</span>
              <Avatar name={v.target} avatar={v.targetAvatar} size="sm" />
              <strong className={v.target === results.imposterName ? 'text-accent-green' : 'text-text'}>
                {v.target}
              </strong>
              {v.target === results.imposterName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-bold uppercase">correct</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Scoreboard pointsAwarded={results.pointsAwarded} />

      {isHost ? (
        <div className="flex flex-col gap-2.5 mt-2 animate-fade-in-up stagger-6">
          {results.allCustomWordsUsed && (
            <p className="text-center text-amber-400 text-sm font-medium py-2">All custom words have been used!</p>
          )}
          <button
            onClick={playAgain}
            disabled={results.allCustomWordsUsed}
            className={`btn-hover w-full bg-accent text-white border-none rounded-xl py-3.5 px-6 text-lg font-semibold flex items-center justify-center gap-2 glow-accent ${
              results.allCustomWordsUsed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <ArrowPathIcon className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={returnToLobby}
            className="btn-hover w-full bg-surface-2 text-text border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            Back to Lobby
          </button>
        </div>
      ) : (
        <div className="animate-fade-in-up stagger-6">
          {results.allCustomWordsUsed && (
            <p className="text-center text-amber-400 text-sm font-medium py-2">All custom words have been used!</p>
          )}
          <p className="text-center text-text-dim italic p-4 animate-pulse">Waiting for host to decide...</p>
        </div>
      )}
    </div>
  );
}
