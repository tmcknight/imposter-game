import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { EyeIcon, ShieldExclamationIcon, CheckBadgeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function WordReveal() {
  const { word, isImposter, isHost, advancePhase } = useGame();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 flex-1 justify-center text-center animate-fade-in">
      {!revealed ? (
        <button
          className="btn-hover w-full py-12 px-6 text-xl bg-surface border-2 border-dashed border-text-dim/40 rounded-xl text-text-dim font-semibold cursor-pointer flex flex-col items-center justify-center gap-3 glow-surface"
          onClick={() => setRevealed(true)}
        >
          <EyeIcon className="w-8 h-8" />
          <span>Tap to reveal your role</span>
          <span className="text-xs text-text-dim/60">Make sure no one else can see your screen</span>
        </button>
      ) : isImposter ? (
        <div className="animate-scale-in flex flex-col items-center gap-3 py-10 px-6 rounded-xl w-full bg-gradient-to-br from-accent to-[#c23152] text-white animate-pulse-glow">
          <ShieldExclamationIcon className="w-12 h-12" />
          <span className="text-xs opacity-80 uppercase tracking-[0.2em]">You are the</span>
          <span className="text-5xl font-extrabold tracking-wider">IMPOSTER</span>
          <span className="text-sm opacity-70 mt-1">You don't know the word. Blend in!</span>
        </div>
      ) : (
        <div className="animate-scale-in flex flex-col items-center gap-3 py-10 px-6 rounded-xl w-full bg-gradient-to-br from-accent-green to-[#2d8f6f] text-white animate-pulse-glow-green">
          <CheckBadgeIcon className="w-12 h-12" />
          <span className="text-xs opacity-80 uppercase tracking-[0.2em]">The word is</span>
          <span className="text-5xl font-extrabold">{word}</span>
          <span className="text-sm opacity-70 mt-1">Give hints without being too obvious!</span>
        </div>
      )}

      {isHost && revealed && (
        <button
          onClick={advancePhase}
          className="btn-hover w-full mt-2 bg-accent-green text-bg border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer flex items-center justify-center gap-2 glow-green animate-fade-in-up"
        >
          Start Hints Round 1
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
