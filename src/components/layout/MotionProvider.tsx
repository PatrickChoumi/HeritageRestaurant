'use client';

import { MotionConfig } from 'motion/react';

/** Respecte le réglage système « réduire les animations » pour toutes les animations Motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
