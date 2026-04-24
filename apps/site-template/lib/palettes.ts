export type PaletteKey =
  | 'ocean_breeze'
  | 'forest_green'
  | 'sunset_orange'
  | 'midnight_blue'
  | 'rose_gold'
  | 'slate_gray'
  | 'lavender_mist'
  | 'warm_sand';

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export const palettes: Record<PaletteKey, Palette> = {
  ocean_breeze: {
    primary: '#0077B6',
    secondary: '#00B4D8',
    accent: '#90E0EF',
    background: '#F0F9FF',
    surface: '#FFFFFF',
    text: '#03045E',
    textMuted: '#5E8FAE',
  },
  forest_green: {
    primary: '#2D6A4F',
    secondary: '#40916C',
    accent: '#95D5B2',
    background: '#F0FFF4',
    surface: '#FFFFFF',
    text: '#1B4332',
    textMuted: '#52796F',
  },
  sunset_orange: {
    primary: '#E85D04',
    secondary: '#F48C06',
    accent: '#FAA307',
    background: '#FFF8F0',
    surface: '#FFFFFF',
    text: '#370617',
    textMuted: '#AE4E04',
  },
  midnight_blue: {
    primary: '#4361EE',
    secondary: '#3A0CA3',
    accent: '#7209B7',
    background: '#0F0E17',
    surface: '#1A1A2E',
    text: '#FFFFFE',
    textMuted: '#A7A9BE',
  },
  rose_gold: {
    primary: '#C9184A',
    secondary: '#FF4D6D',
    accent: '#FF85A1',
    background: '#FFF0F3',
    surface: '#FFFFFF',
    text: '#590D22',
    textMuted: '#A4133C',
  },
  slate_gray: {
    primary: '#415A77',
    secondary: '#778DA9',
    accent: '#E0E1DD',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#0D1B2A',
    textMuted: '#778DA9',
  },
  lavender_mist: {
    primary: '#7B2D8B',
    secondary: '#9D4EDD',
    accent: '#C77DFF',
    background: '#FAF5FF',
    surface: '#FFFFFF',
    text: '#240046',
    textMuted: '#9A6AB5',
  },
  warm_sand: {
    primary: '#C08552',
    secondary: '#DAA07A',
    accent: '#F2CC8F',
    background: '#FDF8F0',
    surface: '#FFFFFF',
    text: '#5C3D2E',
    textMuted: '#A07850',
  },
};

export function getPalette(key: string): Palette {
  return palettes[(key as PaletteKey)] ?? palettes.ocean_breeze;
}

export function paletteToCSS(palette: Palette): string {
  return `
    --color-primary: ${palette.primary};
    --color-secondary: ${palette.secondary};
    --color-accent: ${palette.accent};
    --color-background: ${palette.background};
    --color-surface: ${palette.surface};
    --color-text: ${palette.text};
    --color-text-muted: ${palette.textMuted};
  `;
}
