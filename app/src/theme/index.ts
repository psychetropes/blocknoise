// matches preview/index.html :root variables
export const colors = {
  blue: '#0012FF',
  black: '#0A0A0A',
  white: '#F2F0ED',
  grey: '#666666',
  dark: '#1A1A1A',
  pureBlack: '#000000',
} as const;

// backward-compat tokens used by existing screens
export const theme = {
  bg: colors.blue,       // primary screen background
  bg2: colors.black,     // black blocks/sections on blue
  cream: colors.white,   // primary text (warm off-white)
  cyan: colors.white,    // was accent — now white in new design
  magenta: colors.white, // was pro badge — now white in new design
  muted: colors.grey,    // labels, secondary text
  muted2: colors.dark,   // dividers, subtle borders
} as const;

export type ThemeColor = keyof typeof theme;

// typography
export const fonts = {
  solar: 'ABCSolar-Bold',
  mono: 'JetBrainsMono-Regular',
  monoBold: 'JetBrainsMono-Bold',
  grotesk: 'SpaceGrotesk-Bold',
} as const;
