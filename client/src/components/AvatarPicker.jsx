import { AVATAR_ICONS, AVATAR_COLORS, getAvatarIcon, getAvatarColor } from '../avatarConstants.js';

export default function AvatarPicker({ name, avatar, onChange }) {
  const selectedIcon = avatar.icon ? getAvatarIcon(avatar.icon) : null;
  const selectedColor = getAvatarColor(avatar.color);

  const setIcon = (iconId) => onChange({ ...avatar, icon: iconId });
  const setColor = (colorId) => onChange({ ...avatar, color: colorId });

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      {/* Preview */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold select-none transition-all duration-200"
        style={{ backgroundColor: selectedColor.value, color: '#fff' }}
      >
        {selectedIcon ? (
          <span className="leading-none">{selectedIcon.emoji}</span>
        ) : (
          name?.charAt(0).toUpperCase() || '?'
        )}
      </div>

      {/* Icon selection */}
      <div>
        <p className="text-xs text-text-dim text-center mb-1.5">Icon</p>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {/* Default = first initial */}
          <button
            type="button"
            onClick={() => setIcon(null)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all duration-150 border-2 ${
              !avatar.icon
                ? 'border-text bg-surface-2 text-text scale-110'
                : 'border-transparent bg-surface text-text-dim hover:bg-surface-2'
            }`}
          >
            {name?.charAt(0).toUpperCase() || '?'}
          </button>
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              onClick={() => setIcon(icon.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 border-2 ${
                avatar.icon === icon.id
                  ? 'border-text bg-surface-2 scale-110'
                  : 'border-transparent bg-surface hover:bg-surface-2'
              }`}
            >
              <span className="text-base leading-none">{icon.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color selection */}
      <div>
        <p className="text-xs text-text-dim text-center mb-1.5">Color</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => setColor(color.id)}
              className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-150 border-2 ${
                avatar.color === color.id
                  ? 'border-text scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
