export const icons = {
  // Project status
  active: '●',
  parked: '◌',
  archived: '▢',

  // Review / check
  approved: '✓',
  draft: '◐',
  blocked: '✗',

  // Input / navigation
  prompt: '❯',
  selected: '▶',
  warning: '!',

  // Spinner frames (braille pattern, 10 frames)
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const,
} as const;
