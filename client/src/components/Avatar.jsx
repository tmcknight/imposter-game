import { getAvatarIcon, getAvatarColor } from '../avatarConstants.js';

export default function Avatar({ name, avatar, size = 'md' }) {
  const icon = avatar?.icon ? getAvatarIcon(avatar.icon) : null;
  const color = getAvatarColor(avatar?.color);

  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-14 h-14 text-xl',
  };

  return (
    <span
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shrink-0 select-none`}
      style={{ backgroundColor: color.value, color: '#fff' }}
    >
      {icon ? (
        <span className="leading-none">{icon.emoji}</span>
      ) : (
        name?.charAt(0).toUpperCase() || '?'
      )}
    </span>
  );
}
