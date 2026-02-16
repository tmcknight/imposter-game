import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { PlusIcon, ArrowRightOnRectangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import AvatarPicker from './AvatarPicker.jsx';
import { AVATAR_COLORS } from '../avatarConstants.js';

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].id;
}

export default function JoinScreen() {
  const { createRoom, joinRoom } = useGame();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null);
  const [avatar, setAvatar] = useState({ icon: null, color: randomColor() });

  const handleCreate = () => {
    if (name.trim()) createRoom(name.trim(), avatar);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (name.trim() && code.trim()) joinRoom(code.trim().toUpperCase(), name.trim(), avatar);
  };

  if (!mode) {
    return (
      <div className="flex flex-col gap-4 justify-center flex-1 animate-fade-in">
        <div className="text-center mb-2">
          <p className="text-text-dim text-sm">Find the imposter among your friends</p>
        </div>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className="w-full py-3.5 px-4 border-2 border-surface-2 rounded-xl bg-surface text-text text-lg outline-none transition-all duration-200 focus:border-accent focus:glow-accent placeholder:text-text-dim/50"
        />
        {name.trim() && (
          <AvatarPicker name={name} avatar={avatar} onChange={setAvatar} />
        )}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={() => name.trim() && handleCreate()}
            disabled={!name.trim()}
            className="btn-hover w-full bg-accent text-white border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-accent"
          >
            <PlusIcon className="w-5 h-5" />
            Create Room
          </button>
          <button
            onClick={() => name.trim() && setMode('join')}
            disabled={!name.trim()}
            className="btn-hover w-full bg-surface-2 text-text border-2 border-surface-2 rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors hover:border-accent-green/50"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 justify-center flex-1 animate-fade-in">
      <p className="text-center text-lg text-text-dim">Joining as <strong className="text-text">{name}</strong></p>
      <form onSubmit={handleJoin} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Room code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={4}
          autoFocus
          className="w-full py-4 px-4 border-2 border-surface-2 rounded-xl bg-surface text-text text-2xl outline-none transition-all duration-200 focus:border-accent-green focus:glow-green uppercase text-center tracking-[0.3em] font-bold placeholder:text-text-dim/40 placeholder:font-normal placeholder:text-lg"
        />
        <button
          type="submit"
          disabled={code.length < 4}
          className="btn-hover w-full bg-accent-green text-bg border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-green"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Join
        </button>
        <button
          type="button"
          onClick={() => setMode(null)}
          className="btn-hover w-full bg-surface-2 text-text border-none rounded-xl py-3.5 px-6 text-lg font-semibold cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>
      </form>
    </div>
  );
}
