import { useGame } from '../context/GameContext.jsx';
import PlayerList from './PlayerList.jsx';
import { LightBulbIcon, ChatBubbleLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function HintPhase() {
  const { word, isImposter, isHost, advancePhase, category } = useGame();

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <LightBulbIcon className="w-6 h-6 text-accent" />
          Hints
        </h2>
        {category && (
          <p className="text-sm text-text-dim mt-1 uppercase tracking-widest">
            Category: <strong className="text-text">{category}</strong>
          </p>
        )}
      </div>

      <div className={`text-center p-4 rounded-xl card-shimmer ${isImposter ? 'bg-accent/10 border border-accent/20' : 'bg-accent-green/10 border border-accent-green/20'}`}>
        {isImposter ? (
          <p className="text-accent text-lg font-semibold">You are the IMPOSTER</p>
        ) : (
          <p className="text-accent-green text-lg">Word: <strong className="text-xl">{word}</strong></p>
        )}
      </div>

      <p className="text-center text-text-dim text-sm flex items-center justify-center gap-2">
        <ChatBubbleLeftIcon className="w-4 h-4" />
        Take turns giving a one-word hint out loud!
      </p>

      <PlayerList />

      {isHost && (
        <button
          onClick={advancePhase}
          className="btn-hover w-full mt-2 bg-accent-green text-bg border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer flex items-center justify-center gap-2 glow-green"
        >
          Start Voting
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
