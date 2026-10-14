import { Monogram } from '@/components/brand/Logo';

/** Script lancé avant l'affichage : le rideau d'ouverture n'est joué qu'une fois par visite. */
export const introScript = `try{if(sessionStorage.getItem('heritage-intro')){document.documentElement.classList.add('intro-seen')}else{sessionStorage.setItem('heritage-intro','1')}}catch(e){}`;

/** Rideau d'ouverture (CSS pur, 2 s maximum, désactivé si l'utilisateur limite les animations). */
export function IntroCurtain({ label }: { label: string }) {
  return (
    <div className="intro-curtain" role="presentation" aria-label={label}>
      <div className="flex flex-col items-center gap-6">
        <Monogram draw className="size-20" />
        <span className="intro-word font-logo text-xl text-gold">HÉRITAGE</span>
      </div>
    </div>
  );
}
