import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { TrophyIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar.jsx';

export default function Scoreboard({ pointsAwarded }) {
  const { players } = useGame();
  const rafRef = useRef(null);
  const rowRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(0);

  const connected = players.filter(p => p.connected);
  const hasNewPoints = pointsAwarded && Object.values(pointsAwarded).some(v => v > 0);

  // state.players has OLD scores (pre-round), pointsAwarded has this round's deltas
  const oldScoreOf = (p) => p.score || 0;
  const newScoreOf = (p) => (p.score || 0) + (pointsAwarded?.[p.id] || 0);

  // Stable sort by score desc, then name asc for tie-breaking
  const stableSort = (arr, scoreFn) =>
    [...arr].sort((a, b) => scoreFn(b) - scoreFn(a) || a.name.localeCompare(b.name));

  const oldSorted = stableSort(connected, oldScoreOf);
  const newSorted = stableSort(connected, newScoreOf);
  const hasScores = connected.some(p => newScoreOf(p) > 0);

  // Animation phases: show-points → count-up → reorder → done
  const [phase, setPhase] = useState(() => hasNewPoints ? 'show-points' : 'done');
  const [displayScores, setDisplayScores] = useState(() => {
    if (!hasNewPoints) return {};
    const init = {};
    connected.forEach(p => { init[p.id] = oldScoreOf(p); });
    return init;
  });

  // Measure first row height before paint (for transform offsets)
  useLayoutEffect(() => {
    if (rowRef.current && rowHeight === 0) {
      setRowHeight(rowRef.current.getBoundingClientRect().height + 8); // 8px = gap-2
    }
  });

  // Animation phase timers (all set once on mount, advance through phases)
  useEffect(() => {
    if (!hasNewPoints) return;
    const timers = [
      setTimeout(() => setPhase('count-up'), 1000),
      setTimeout(() => setPhase('reorder'), 1600),
      setTimeout(() => setPhase('done'), 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [pointsAwarded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate score numbers counting up
  useEffect(() => {
    if (phase !== 'count-up') return;

    const starts = {};
    const ends = {};
    connected.forEach(p => {
      starts[p.id] = oldScoreOf(p);
      ends[p.id] = newScoreOf(p);
    });

    const duration = 500;
    const t0 = performance.now();

    const tick = (now) => {
      const t = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const scores = {};
      connected.forEach(p => {
        scores[p.id] = Math.round(starts[p.id] + (ends[p.id] - starts[p.id]) * ease);
      });
      setDisplayScores(scores);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasScores && !hasNewPoints) return null;

  const inOldPosition = phase === 'show-points' || phase === 'count-up';
  const isReordering = phase === 'reorder';

  const scoreFor = (p) => {
    if (phase === 'done') return newScoreOf(p);
    return displayScores[p.id] ?? oldScoreOf(p);
  };

  return (
    <div className="bg-surface rounded-xl p-4 glow-surface animate-fade-in">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-text-dim flex items-center gap-1.5">
        <TrophyIcon className="w-4 h-4" />
        Scoreboard
      </h3>
      <ul className="list-none flex flex-col gap-2">
        {newSorted.map((p, newIdx) => {
          const oldIdx = oldSorted.findIndex(op => op.id === p.id);
          const earned = pointsAwarded?.[p.id] || 0;
          const yOffset = inOldPosition && rowHeight > 0 ? (oldIdx - newIdx) * rowHeight : 0;
          const score = scoreFor(p);
          const rank = inOldPosition ? oldIdx + 1 : newIdx + 1;
          const showBadge = earned > 0 && (phase === 'show-points' || phase === 'count-up');
          const isCounting = phase === 'count-up' && earned > 0;

          return (
            <li
              key={p.id}
              ref={newIdx === 0 ? rowRef : null}
              className="flex items-center gap-2.5 text-sm"
              style={{
                transform: `translateY(${yOffset}px)`,
                transition: isReordering
                  ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none',
              }}
            >
              <span className={`w-5 text-center font-bold ${rank === 1 && score > 0 ? 'text-accent-green' : 'text-text-dim'}`}>
                {rank}
              </span>
              <Avatar name={p.name} avatar={p.avatar} size="sm" />
              <span className="flex-1">{p.name}</span>
              {showBadge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-bold ${
                  isCounting ? 'animate-badge-merge' : 'animate-scale-in'
                }`}>
                  +{earned}
                </span>
              )}
              <span className={`font-bold tabular-nums min-w-[2ch] text-right ${
                score > 0 ? 'text-accent-green' : 'text-text-dim'
              } ${isCounting ? 'score-glow' : ''}`}>
                {score}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
