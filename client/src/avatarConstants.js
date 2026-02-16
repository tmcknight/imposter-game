export const AVATAR_ICONS = [
  { id: 'ghost', emoji: '\u{1F47B}' },
  { id: 'masks', emoji: '\u{1F3AD}' },
  { id: 'fox', emoji: '\u{1F98A}' },
  { id: 'cat', emoji: '\u{1F431}' },
  { id: 'robot', emoji: '\u{1F916}' },
  { id: 'alien', emoji: '\u{1F47D}' },
  { id: 'octopus', emoji: '\u{1F419}' },
  { id: 'owl', emoji: '\u{1F989}' },
];

export const AVATAR_COLORS = [
  { id: 'red', value: '#e94560' },
  { id: 'blue', value: '#3b82f6' },
  { id: 'purple', value: '#8b5cf6' },
  { id: 'teal', value: '#2dd4bf' },
  { id: 'orange', value: '#f97316' },
  { id: 'pink', value: '#ec4899' },
  { id: 'cyan', value: '#06b6d4' },
  { id: 'green', value: '#22c55e' },
];

export function getAvatarIcon(iconId) {
  return AVATAR_ICONS.find(i => i.id === iconId) || null;
}

export function getAvatarColor(colorId) {
  return AVATAR_COLORS.find(c => c.id === colorId) || AVATAR_COLORS[0];
}
