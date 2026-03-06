export const theme = {
  bg: '#080A0C',
  bg2: '#0F1215',
  cream: '#F0EBE0',
  cyan: '#00D9C0',
  magenta: '#E8197A',
  muted: '#4A5560',
  muted2: '#2A3038',
} as const;

export type ThemeColor = keyof typeof theme;
