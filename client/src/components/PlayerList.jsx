import { useGame } from '../context/GameContext.jsx';
import { StarIcon } from '@heroicons/react/24/solid';
import { SignalSlashIcon, UserCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function PlayerList() {
  const { players, hostId, isHost, phase, transferHost } = useGame();
  const canTransfer = isHost && phase === 'LOBBY';

  return (
    <ul className="list-none bg-surface rounded-xl overflow-hidden glow-surface">
      {players.map((p, i) => (
        <li
          key={p.id}
          className={`animate-slide-in-right stagger-${Math.min(i + 1, 6)} py-3.5 px-4 flex items-center gap-2.5 border-b border-bg/50 last:border-b-0 text-base transition-opacity duration-300 ${!p.connected ? 'opacity-40' : ''}`}
        >
          <UserCircleIcon className={`w-5 h-5 shrink-0 ${p.connected ? 'text-accent-green' : 'text-text-dim'}`} />
          <span className="flex-1">{p.name}</span>
          {p.id === hostId && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-accent/20 text-accent border border-accent/30 inline-flex items-center gap-1">
              <StarIcon className="w-3 h-3" />
              Host
            </span>
          )}
          {canTransfer && p.id !== hostId && p.connected && (
            <button
              onClick={() => transferHost(p.id)}
              className="btn-hover text-xs px-2 py-0.5 rounded-full font-semibold bg-surface-2 text-text-dim border border-text-dim/30 cursor-pointer inline-flex items-center gap-1 hover:text-accent hover:border-accent/30 transition-colors"
              title={`Make ${p.name} host`}
            >
              <ArrowRightStartOnRectangleIcon className="w-3 h-3" />
              Make Host
            </button>
          )}
          {!p.connected && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-text-dim/20 text-text-dim border border-text-dim/30 inline-flex items-center gap-1">
              <SignalSlashIcon className="w-3 h-3" />
              DC
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
