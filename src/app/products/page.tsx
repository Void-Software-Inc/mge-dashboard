import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Datatable from '@/components/Datatable';
import { Header } from '@/utils/types/datatableTypes';

export default async function Products() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }

  const headers: Header[] = [
    { title: 'Image', value: 'image_url', filterable: false },
    { title: 'ID', value: 'id', filterable: false },
    { title: 'Name', value: 'name', filterable: true },
    { title: 'Type', value: 'type', filterable: true },
    { title: 'Color', value: 'color', filterable: true },
    { title: 'Stock', value: 'stock', filterable: false },
    { title: 'Price', value: 'price', filterable: true },
    { title: 'Description', value: 'description', filterable: true },
    { title: 'Created At', value: 'created_at', filterable: false },
    { title: 'Updated At', value: 'last_update', filterable: false },
    { title: 'Actions', value: 'actions', filterable: false },
  ];

  let { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  if (!products) {
    console.error('No products found');
    return;
  }

  const items = products.map(product => ({
    id: product.id,
    name: product.name,
    type: product.type,
    color: product.color,
    stock: product.stock,
    price: product.price,
    description: product.description,
    image_url: product.image_url,
    created_at: product.created_at,
    last_update: product.last_update,
    actions: 'Edit/Delete',
  }));

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-white text-4xl">Products page</h1>
      <Datatable headers={headers} items={items} />
    </main>
  );
}
