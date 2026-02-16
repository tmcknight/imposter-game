import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { PencilSquareIcon, CheckCircleIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function WordSubmission() {
  const {
    isHost,
    advancePhase,
    submitWords,
    hasSubmittedWords,
    wordSubmissionStatus,
    requiredWordsPerPlayer,
    players,
    playerId,
  } = useGame();

  const [words, setWords] = useState(() => Array(requiredWordsPerPlayer).fill(''));

  const allFilled = words.every(w => w.trim().length > 0);
  const allSubmitted = wordSubmissionStatus
    && wordSubmissionStatus.submittedCount === wordSubmissionStatus.totalCount;
  const connectedPlayers = players.filter(p => p.connected);

  const handleSubmit = () => {
    if (allFilled) {
      submitWords(words.map(w => w.trim()));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < requiredWordsPerPlayer - 1) {
        // Focus next input
        const next = e.target.parentElement.parentElement.querySelector(`input[data-index="${index + 1}"]`);
        if (next) next.focus();
      } else if (allFilled) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 flex-1 animate-fade-in">
      {/* Header */}
      <div className="text-center p-5 bg-surface rounded-xl glow-surface card-shimmer">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 mb-3">
          <PencilSquareIcon className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-text">Submit Your Words</h2>
        <p className="text-text-dim text-sm mt-1">
          Enter {requiredWordsPerPlayer} word{requiredWordsPerPlayer !== 1 ? 's' : ''} for the game
        </p>
      </div>

      {/* Word inputs or submitted confirmation */}
      {!hasSubmittedWords ? (
        <div className="bg-surface rounded-xl p-4 glow-surface animate-fade-in-up stagger-2">
          <div className="flex flex-col gap-3">
            {words.map((word, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label className="text-xs text-text-dim uppercase tracking-widest">Word {i + 1}</label>
                <input
                  data-index={i}
                  type="text"
                  value={word}
                  onChange={e => {
                    const newWords = [...words];
                    newWords[i] = e.target.value;
                    setWords(newWords);
                  }}
                  onKeyDown={e => handleKeyDown(e, i)}
                  placeholder={`Enter a word...`}
                  maxLength={40}
                  className="bg-surface-2 text-text border-none rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-text-dim/40"
                  autoFocus={i === 0}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allFilled}
            className={`btn-hover w-full mt-4 border-none rounded-xl py-3 px-6 text-base font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              allFilled
                ? 'bg-accent text-white glow-accent'
                : 'bg-surface-2 text-text-dim'
            }`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            Submit Words
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl p-6 text-center glow-surface animate-scale-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-green/20 mb-3">
            <CheckCircleIcon className="w-7 h-7 text-accent-green" />
          </div>
          <p className="text-lg font-semibold text-accent-green">Words Submitted!</p>
          <p className="text-text-dim text-sm mt-1">Waiting for other players...</p>
        </div>
      )}

      {/* Submission progress */}
      <div className="bg-surface rounded-xl p-4 glow-surface animate-fade-in-up stagger-4">
        <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3">Submission Progress</h3>

        {wordSubmissionStatus && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-text-dim mb-1.5">
              <span>Players submitted</span>
              <span>{wordSubmissionStatus.submittedCount} / {wordSubmissionStatus.totalCount}</span>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-green rounded-full transition-all duration-500 progress-fill"
                style={{ width: `${(wordSubmissionStatus.submittedCount / wordSubmissionStatus.totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <ul className="list-none flex flex-col gap-1.5">
          {connectedPlayers.map(p => {
            const submitted = wordSubmissionStatus?.submissions[p.id];
            return (
              <li key={p.id} className={`text-sm flex items-center gap-2 ${p.id === playerId ? 'font-semibold' : ''}`}>
                {submitted ? (
                  <CheckCircleIcon className="w-4 h-4 text-accent-green shrink-0" />
                ) : (
                  <ClockIcon className="w-4 h-4 text-text-dim/50 shrink-0" />
                )}
                <span className={submitted ? 'text-text' : 'text-text-dim'}>
                  {p.name}{p.id === playerId ? ' (you)' : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Host advance button */}
      {isHost && allSubmitted && (
        <button
          onClick={advancePhase}
          className="btn-hover w-full bg-accent-green text-bg border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer flex items-center justify-center gap-2 glow-green animate-fade-in-up"
        >
          Begin Round
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}

      {isHost && !allSubmitted && (
        <p className="text-center text-text-dim italic text-sm animate-pulse">
          Waiting for all players to submit...
        </p>
      )}

      {!isHost && allSubmitted && (
        <p className="text-center text-text-dim italic text-sm animate-pulse">
          Waiting for host to begin the round...
        </p>
      )}
    </div>
  );
}
