import { useGame } from '../context/GameContext.jsx';
import { TrophyIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar.jsx';

export default function Scoreboard({ pointsAwarded }) {
  const { players } = useGame();

  const sorted = [...players]
    .filter(p => p.connected)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const hasScores = sorted.some(p => p.score > 0);

  if (!hasScores && !pointsAwarded) return null;

  return (
    <div className="bg-surface rounded-xl p-4 glow-surface animate-fade-in">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-text-dim flex items-center gap-1.5">
        <TrophyIcon className="w-4 h-4" />
        Scoreboard
      </h3>
      <ul className="list-none flex flex-col gap-2">
        {sorted.map((p, i) => {
          const earned = pointsAwarded?.[p.id] || 0;
          return (
            <li key={p.id} className="flex items-center gap-2.5 text-sm">
              <span className={`w-5 text-center font-bold ${i === 0 && p.score > 0 ? 'text-accent-green' : 'text-text-dim'}`}>
                {i + 1}
              </span>
              <Avatar name={p.name} avatar={p.avatar} size="sm" />
              <span className="flex-1">{p.name}</span>
              {earned > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-bold animate-scale-in">
                  +{earned}
                </span>
              )}
              <span className={`font-bold tabular-nums ${p.score > 0 ? 'text-accent-green' : 'text-text-dim'}`}>
                {p.score || 0}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
