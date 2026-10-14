'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Image en parallaxe : le contenu glisse plus lentement que la page. */
export function Parallax({ children, className, strength = 12 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div style={reduce ? undefined : { y }} className="absolute -inset-y-[14%] inset-x-0">
        {children}
      </motion.div>
    </div>
  );
}
