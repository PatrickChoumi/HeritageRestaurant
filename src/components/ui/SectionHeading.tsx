import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import { cn } from '@/lib/cn';

export function SectionHeading({
  kicker,
  title,
  intro,
  align = 'left',
  className,
  as: Heading = 'h2',
}: {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      <p className={cn('kicker', align === 'center' && 'justify-center')}>{kicker}</p>
      <Heading className="title-lg mt-6">{title}</Heading>
      {intro && <p className={cn('lead mt-6', align === 'center' && 'mx-auto max-w-2xl')}>{intro}</p>}
    </Reveal>
  );
}
