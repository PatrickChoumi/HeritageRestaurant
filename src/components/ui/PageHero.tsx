import Image, { type StaticImageData } from 'next/image';
import type { ReactNode } from 'react';

/** Bandeau des pages intérieures : photo plein cadre, voile sombre, titre centré. */
export function PageHero({
  image,
  alt,
  kicker,
  title,
  intro,
  position = 'center',
}: {
  image: StaticImageData;
  /** Cadrage de la photo (object-position CSS). */
  position?: string;
  alt: string;
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <section className="relative flex min-h-[72svh] items-end overflow-hidden pt-32 pb-20 md:min-h-[78svh] md:pb-28">
      <Image
        src={image}
        alt={alt}
        fill
        preload
        sizes="100vw"
        placeholder="blur"
        className="animate-[kenburns_18s_ease-out_both] object-cover motion-reduce:animate-none"
        style={{ objectPosition: position }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink" aria-hidden="true" />
      <div className="container-luxe relative text-center">
        <p className="kicker animate-[page-in_1s_0.1s_both] justify-center">{kicker}</p>
        <h1 className="title-xl text-shadow-soft mx-auto mt-6 max-w-4xl animate-[page-in_1.1s_0.2s_both]">{title}</h1>
        {intro && (
          <p className="lead mx-auto mt-6 max-w-2xl animate-[page-in_1.1s_0.35s_both] text-ivory/80">{intro}</p>
        )}
      </div>
    </section>
  );
}
