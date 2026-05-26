import { Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';
import { icons } from '../theme/icons.js';
import { semantic } from '../theme/semantic.js';

type SpinnerStyle = 'dots' | 'line' | 'arc';

interface SpinnerProps {
  style?: SpinnerStyle;
}

const LINE_FRAMES = ['|', '/', '-', '\\'] as const;
const ARC_FRAMES = ['◜', '◠', '◝', '◞', '◡', '◟'] as const;

const FRAMES: Record<SpinnerStyle, readonly string[]> = {
  dots: icons.spinner,
  line: LINE_FRAMES,
  arc: ARC_FRAMES,
};

export function Spinner({ style = 'dots' }: SpinnerProps): React.JSX.Element {
  const [frame, setFrame] = useState(0);
  const frames = FRAMES[style];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, [frames.length]);

  return <Text color={semantic.inProgress}>{frames[frame % frames.length] ?? '⠋'}</Text>;
}
