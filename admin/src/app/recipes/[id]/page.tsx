import { createClient } from '@/lib/supabase-server';
import { rowToRecipe } from '@/lib/types';
import RecipeForm from '@/components/recipe-form';
import { notFound } from 'next/navigation';

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (!data) notFound();

  const recipe = rowToRecipe(data);

  return <RecipeForm initial={recipe} />;
}
