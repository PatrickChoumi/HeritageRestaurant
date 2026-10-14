import { notFound } from 'next/navigation';

// Toute URL inconnue d'une langue affiche la page 404 traduite (avec en-tête et pied de page)
export default function CatchAll() {
  notFound();
}
