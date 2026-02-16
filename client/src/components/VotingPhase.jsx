import { useGame } from '../context/GameContext.jsx';
import { HandRaisedIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function VotingPhase() {
  const { players, playerId, castVote, hasVoted, voteCount, expectedVotes, isHost, advancePhase } = useGame();
  const connectedPlayers = players.filter(p => p.connected);
  const allVoted = voteCount >= expectedVotes && expectedVotes > 0;
  const progress = expectedVotes > 0 ? (voteCount / expectedVotes) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <h2 className="text-center text-2xl font-bold flex items-center justify-center gap-2">
        <HandRaisedIcon className="w-6 h-6 text-accent" />
        Vote for the Imposter
      </h2>

      {/* Progress bar */}
      <div className="px-1">
        <div className="flex justify-between text-xs text-text-dim mb-1.5">
          <span>Votes cast</span>
          <span className="font-bold text-text">{voteCount} / {expectedVotes}</span>
        </div>
        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {hasVoted ? (
        <div className="text-center p-6 bg-accent-green/10 border border-accent-green/20 rounded-xl animate-scale-in">
          <CheckCircleIcon className="w-10 h-10 text-accent-green mx-auto mb-2" />
          <p className="text-accent-green font-semibold">Your vote is in!</p>
          <p className="text-text-dim text-sm mt-1">Waiting for others...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {connectedPlayers
            .filter(p => p.id !== playerId)
            .map((p, i) => (
              <button
                key={p.id}
                onClick={() => castVote(p.id)}
                className={`vote-btn animate-fade-in-up stagger-${Math.min(i + 1, 6)} w-full bg-surface text-white border-2 border-surface-2 rounded-xl py-4 px-6 text-lg font-semibold cursor-pointer flex items-center gap-3`}
              >
                <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-sm font-bold text-text-dim shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                {p.name}
              </button>
            ))}
        </div>
      )}

      {isHost && allVoted && (
        <button
          onClick={advancePhase}
          className="btn-hover w-full mt-2 bg-accent text-white border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer flex items-center justify-center gap-2 glow-accent animate-pulse-glow"
        >
          Reveal Results
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
