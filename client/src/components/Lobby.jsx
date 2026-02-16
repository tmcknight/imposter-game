import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerList from './PlayerList.jsx';
import Scoreboard from './Scoreboard.jsx';
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon, PlayIcon, EyeSlashIcon, PencilSquareIcon, BookOpenIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Lobby() {
  const {
    roomCode, isHost, startGame, players, leaveRoom,
    hideCategory, customWordsEnabled, includeDefaultWords, requiredWordsPerPlayer,
    updateSettings,
  } = useGame();
  const canStart = players.filter(p => p.connected).length >= 3;
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 flex-1 animate-fade-in">
      <div className="text-center p-5 bg-surface rounded-xl glow-surface card-shimmer">
        <span className="block text-xs text-text-dim mb-2 uppercase tracking-widest">Room Code</span>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl font-extrabold tracking-[0.3em] text-accent title-glow">{roomCode}</span>
          <button
            onClick={copyCode}
            className="btn-hover bg-surface-2 text-text border-none rounded-lg p-2 cursor-pointer relative"
            title="Copy code"
          >
            {copied ? (
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-accent-green" />
            ) : (
              <ClipboardDocumentIcon className="w-6 h-6" />
            )}
            {copied && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-accent-green whitespace-nowrap animate-toast">
                Copied!
              </span>
            )}
          </button>
        </div>
        <p className="text-text-dim text-xs mt-3">Share this code with your friends</p>
      </div>

      <PlayerList />

      <Scoreboard />

      {/* Settings - host only */}
      {isHost && (
        <div className="bg-surface rounded-xl p-4 glow-surface animate-fade-in">
          <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3">Settings</h3>

          {/* Hide category toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2">
              <EyeSlashIcon className="w-4 h-4 text-text-dim" />
              <span className="text-sm">Hide category from imposter</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hideCategory}
              onClick={() => updateSettings({ hideCategory: !hideCategory })}
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                hideCategory ? 'bg-accent' : 'bg-surface-2'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  hideCategory ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          {/* Custom words toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
            <div className="flex items-center gap-2">
              <PencilSquareIcon className="w-4 h-4 text-text-dim" />
              <span className="text-sm">Custom word submissions</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={customWordsEnabled}
              onClick={() => updateSettings({ customWordsEnabled: !customWordsEnabled })}
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                customWordsEnabled ? 'bg-accent' : 'bg-surface-2'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  customWordsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          {/* Custom words sub-options */}
          {customWordsEnabled && (
            <div className="ml-6 mt-3 flex flex-col gap-3 border-l-2 border-surface-2 pl-3 animate-fade-in">
              {/* Include default words */}
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-4 h-4 text-text-dim" />
                  <span className="text-sm text-text-dim">Include default words</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeDefaultWords}
                  onClick={() => updateSettings({ includeDefaultWords: !includeDefaultWords })}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                    includeDefaultWords ? 'bg-accent' : 'bg-surface-2'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                      includeDefaultWords ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>

              {/* Words per player */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-text-dim">Words per player</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => updateSettings({ requiredWordsPerPlayer: n })}
                      className={`w-8 h-8 rounded-lg text-sm font-bold border-none cursor-pointer transition-colors duration-200 ${
                        requiredWordsPerPlayer === n
                          ? 'bg-accent text-white'
                          : 'bg-surface-2 text-text-dim hover:bg-surface-2/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Non-host sees settings as read-only */}
      {!isHost && (hideCategory || customWordsEnabled) && (
        <div className="flex flex-col gap-1.5 px-1">
          {hideCategory && (
            <div className="flex items-center gap-2 text-sm text-text-dim">
              <EyeSlashIcon className="w-4 h-4" />
              <span>Category hidden from imposter</span>
            </div>
          )}
          {customWordsEnabled && (
            <div className="flex items-center gap-2 text-sm text-text-dim">
              <PencilSquareIcon className="w-4 h-4" />
              <span>Custom words enabled ({requiredWordsPerPlayer} per player{includeDefaultWords ? ' + defaults' : ''})</span>
            </div>
          )}
        </div>
      )}

      {isHost ? (
        <button
          onClick={startGame}
          disabled={!canStart}
          className={`btn-hover w-full border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            canStart
              ? 'bg-accent-green text-bg glow-green'
              : 'bg-surface-2 text-text-dim'
          }`}
        >
          <PlayIcon className="w-5 h-5" />
          {canStart ? 'Start Game' : `Need ${3 - players.filter(p => p.connected).length} more player${3 - players.filter(p => p.connected).length !== 1 ? 's' : ''}`}
        </button>
      ) : (
        <p className="text-center text-text-dim italic p-4 animate-pulse">Waiting for host to start...</p>
      )}

      <button
        onClick={leaveRoom}
        className="btn-hover w-full border border-surface-2 bg-transparent rounded-xl py-2.5 px-6 text-sm text-text-dim cursor-pointer flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors duration-200"
      >
        <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
        Leave Room
      </button>
    </div>
  );
}
