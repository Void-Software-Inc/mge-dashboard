import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProductDatatableClientWrapper from './ProductDatatableClientWrapper';
import { Header } from '@/utils/types/datatableTypes';
import {GET as getProducts} from '@/app/api/products/route';

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

  const res = await getProducts();
  const { products } = await res.json();

  if (!products) {
    console.error('No products found');
    return;
  }



  const items = products.map((product: { id: number; name: string; type: string; color: string; stock: number; price: number; description: string; image_url: string; created_at: Date; last_update: Date; }) => ({
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
    <main className="flex min-h-screen flex-col items-center justify-end pb-4">
      <ProductDatatableClientWrapper headers={headers} items={items} />
    </main>
  );
}
