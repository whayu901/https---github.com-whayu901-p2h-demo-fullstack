/**
 * Central design tokens. Keep all colors, spacing, radii, and typography here
 * so the whole app can be restyled from one place.
 */

export const colors = {
  charcoal: '#1F2328',
  background: '#F6F6F4',
  surface: '#FFFFFF',
  border: '#E4E4E0',
  mutedText: '#6B6F76',
  amber: '#F2A900',
  success: '#2E7D4F',
  danger: '#C0392B',
  dangerStrong: '#8E2418',
  white: '#FFFFFF',
} as const;

/**
 * Visual tone for each P2H hazard code (`KodeBahaya`), used by the checklist
 * item chip: AA/A read as strongly dangerous, B as a milder warning, C as
 * informational/muted.
 */
export const kodeBahayaTone: Record<'AA' | 'A' | 'B' | 'C', { background: string; text: string }> = {
  AA: { background: colors.dangerStrong, text: colors.white },
  A: { background: '#F4D9D4', text: colors.danger },
  B: { background: '#FBEBC5', text: '#8A6400' },
  C: { background: colors.border, text: colors.mutedText },
};

/** Visual tone for each P2H operational verdict (`StatusKelayakan`). */
export const statusKelayakanTone: Record<
  'STOP_OPERASI' | 'OPERASI_DENGAN_PERHATIAN' | 'LAYAK_OPERASI',
  { background: string; text: string }
> = {
  STOP_OPERASI: { background: colors.danger, text: colors.white },
  OPERASI_DENGAN_PERHATIAN: { background: colors.amber, text: colors.charcoal },
  LAYAK_OPERASI: { background: colors.success, text: colors.white },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.charcoal },
  subtitle: { fontSize: 15, fontWeight: '400' as const, color: colors.mutedText },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.charcoal },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.charcoal },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.charcoal },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.mutedText },
};

/** Minimum touch target height for gloved operators. */
export const minTouchTarget = 48;
/** Touch target height for P2H checklist result buttons. */
export const resultButtonHeight = 56;
