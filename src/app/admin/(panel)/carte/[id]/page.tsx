import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DishForm } from '@/components/admin/DishForm';
import { ArrowLeft } from '@/components/icons';
import { requireAdmin } from '@/lib/auth/session';
import { adminMenu } from '@/lib/admin/queries';

export const metadata: Metadata = { title: 'Modifier un plat' };

export default async function DishPage({ params, searchParams }: PageProps<'/admin/carte/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  const { categorie } = await searchParams;
  const menu = await adminMenu();
  const categories = menu.map((c) => ({ id: c.id, name: c.fr.name }));
  const isNew = id === 'nouveau';
  const dish = isNew ? undefined : menu.flatMap((c) => c.dishes).find((d) => d.id === Number(id));
  if (!isNew && !dish) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/carte"
        className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-mist uppercase hover:text-ivory"
      >
        <ArrowLeft size={14} /> La carte
      </Link>
      <h1 className="title-md mt-4 mb-10">{dish ? dish.fr.name : 'Nouveau plat'}</h1>
      <DishForm dish={dish} categories={categories} defaultCategoryId={Number(categorie) || undefined} />
    </div>
  );
}
