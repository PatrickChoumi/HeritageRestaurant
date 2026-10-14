// Image de partage (réseaux sociaux, WhatsApp) générée par langue au moment du build.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { routing } from '@/i18n/routing';

export const size = { width: 1200, height: 630 };
// JPEG ≈ 100 Ko : WhatsApp n'affiche pas les aperçus de plus de 300 Ko
export const contentType = 'image/jpeg';
export const alt = 'Héritage — Bastos, Yaoundé';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const asset = (path: string) => readFile(join(process.cwd(), 'src/assets', path));

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [background, cormorant, cormorantItalic, cinzel, inter] = await Promise.all([
    asset('images/og-background.jpg'),
    asset('fonts/cormorant-garamond-latin-300-normal.woff'),
    asset('fonts/cormorant-garamond-latin-400-italic.woff'),
    asset('fonts/cinzel-latin-500-normal.woff'),
    asset('fonts/inter-latin-400-normal.woff'),
  ]);
  const fr = locale !== 'en';
  const src = `data:image/jpeg;base64,${background.toString('base64')}`;

  const png = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0D0D0D' }}>
        <img src={src} alt="" width={1200} height={630} style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            backgroundImage: 'linear-gradient(90deg, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.8) 50%, rgba(13,13,13,0.2) 100%)',
          }}
        />
        <div style={{ position: 'absolute', top: 28, left: 28, width: 1144, height: 574, border: '1px solid rgba(212,175,55,0.45)', display: 'flex' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', width: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 56, height: 1, background: '#D4AF37' }} />
            <div style={{ fontFamily: 'Inter', fontSize: 18, letterSpacing: 6, color: '#D4AF37' }}>BASTOS · YAOUNDÉ</div>
          </div>
          <div style={{ fontFamily: 'Cinzel', fontSize: 92, letterSpacing: 22, color: '#D4AF37', marginTop: 28 }}>HÉRITAGE</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18, fontFamily: 'Cormorant', fontSize: 46, lineHeight: 1.15, color: '#F5F5F5' }}>
            <span>{fr ? 'Cuisine camerounaise' : 'Contemporary'}</span>
            <span style={{ fontFamily: 'Cormorant Italic', color: '#E9CF75' }}>{fr ? 'contemporaine' : 'Cameroonian cuisine'}</span>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 20, letterSpacing: 4, color: '#A0A0A0', marginTop: 40 }}>
            {fr ? 'RÉSERVEZ VOTRE TABLE EN LIGNE' : 'BOOK YOUR TABLE ONLINE'}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Cormorant', data: cormorant, weight: 300, style: 'normal' },
        { name: 'Cormorant Italic', data: cormorantItalic, weight: 400, style: 'italic' },
        { name: 'Cinzel', data: cinzel, weight: 500, style: 'normal' },
        { name: 'Inter', data: inter, weight: 400, style: 'normal' },
      ],
    },
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, immutable' },
  });
}
