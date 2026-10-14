'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
  y?: number;
  as?: 'div' | 'li' | 'section' | 'figure' | 'article';
};

/** Apparition en fondu au défilement (une seule fois). Sans JavaScript, le contenu reste visible. */
export function Reveal({ delay = 0, y = 32, as = 'div', children, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      data-reveal=""
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </Component>
  );
}
