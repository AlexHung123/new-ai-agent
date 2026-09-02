import type { PptThemeId } from './types';

export type PptTheme = {
  id: PptThemeId;
  nameZh: string;
  vars: Record<string, string>;
};

export const PPT_THEME_MAP: Record<PptThemeId, PptTheme> = {
  'navy-bento': {
    id: 'navy-bento',
    nameZh: '海军便当',
    vars: {
      '--ppt-bg': '#f4f1ea',
      '--ppt-ink': '#1c1917',
      '--ppt-muted': '#57534e',
      '--ppt-card': '#ffffff',
      '--ppt-card-hero': '#1e3a5f',
      '--ppt-card-hero-ink': '#f8fafc',
      '--ppt-accent': '#1e3a5f',
      '--ppt-line': '#d6d3d1',
    },
  },
  'slate-paper': {
    id: 'slate-paper',
    nameZh: '石板纸',
    vars: {
      '--ppt-bg': '#eef2f6',
      '--ppt-ink': '#0f172a',
      '--ppt-muted': '#475569',
      '--ppt-card': '#ffffff',
      '--ppt-card-hero': '#334155',
      '--ppt-card-hero-ink': '#f8fafc',
      '--ppt-accent': '#0f766e',
      '--ppt-line': '#cbd5e1',
    },
  },
  'forest-board': {
    id: 'forest-board',
    nameZh: '森林板',
    vars: {
      '--ppt-bg': '#f3f6f1',
      '--ppt-ink': '#1c1917',
      '--ppt-muted': '#3f4a3c',
      '--ppt-card': '#ffffff',
      '--ppt-card-hero': '#1f4d3a',
      '--ppt-card-hero-ink': '#f7fee7',
      '--ppt-accent': '#166534',
      '--ppt-line': '#d6d3c7',
    },
  },
};

export function themeCssVars(themeId: PptThemeId): string {
  const theme = PPT_THEME_MAP[themeId];
  return Object.entries(theme.vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}
