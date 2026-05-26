import { palette } from './catppuccin.js';

export const semantic = {
  // Interactive
  focus: palette.mauve,
  selection: palette.mauve,
  prompt: palette.mauve,

  // Status
  success: palette.green,
  warning: palette.yellow,
  error: palette.red,
  info: palette.sapphire,
  inProgress: palette.peach,
  parked: palette.pink,

  // Content
  project: palette.blue,
  code: palette.teal,
  highlight: palette.sky,

  // Text
  body: palette.text,
  secondary: palette.subtext1,
  muted: palette.subtext0,
  placeholder: palette.overlay2,
  disabled: palette.overlay1,

  // Surfaces
  background: palette.base,
  panelBg: palette.mantle,
  outerBg: palette.crust,
  border: palette.surface0,
  divider: palette.overlay0,
  hoverBg: palette.surface2,
  selectedBg: palette.surface1,
} as const;
