'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";
import { getProduct } from "@/services/products";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Cross2Icon } from '@radix-ui/react-icons';

interface QuoteItemListProps {
    items: QuoteItem[];
    taintedItems: Set<number>;
    onItemTaint: (itemId: number) => void;
}

export function QuoteItemList({ items, taintedItems, onItemTaint }: QuoteItemListProps) {
  const [productDetails, setProductDetails] = useState<Record<number, Product>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchProductDetails = async () => {
      const details: Record<number, Product> = {};
      for (const item of items) {
        try {
          const product = await getProduct(item.product_id);
          details[item.product_id] = product;
        } catch (error) {
          console.error(`Failed to fetch details for product ${item.product_id}:`, error);
        }
      }
      setProductDetails(details);
    };

    fetchProductDetails();
  }, [items]);

  const calculateTotalPrice = (item: QuoteItem) => {
    const product = productDetails[item.product_id];
    return product ? item.quantity * product.price : 0;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(items.length / itemsPerPage);


  return (
    <div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="h-12">
              <TableHead className="w-1/6 whitespace-nowrap">Image</TableHead>
              <TableHead className="w-1/3 whitespace-nowrap">Nom</TableHead>
              <TableHead className="w-1/6 whitespace-nowrap">Quantité</TableHead>
              <TableHead className="w-1/6 whitespace-nowrap">Prix unitaire</TableHead>
              <TableHead className="w-1/6 whitespace-nowrap">Total</TableHead>
              <TableHead className="w-1/6 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              const product = productDetails[item.product_id];
              const isTainted = taintedItems.has(item.id);
              return (
                <TableRow 
                  key={item.id} 
                  className={`h-16 ${isTainted ? 'bg-red-50 hover:bg-red-50' : ''}`}
                >
                  <TableCell className="whitespace-nowrap">
                    {product && product.image_url && (
                      <Image src={product.image_url} alt={product.name} width={45} height={45} />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {product ? product.name : 'Loading...'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{item.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {product ? `${product.price} €` : 'Loading...'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{`${calculateTotalPrice(item)} €`}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onItemTaint(item.id);
                      }}
                      className={isTainted ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:text-red-600 hover:bg-gray-50'}
                    >
                      <Cross2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <Button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          variant='outline'
        >
          Précédent
        </Button>
        <span className='text-sm text-gray-500'>Page {currentPage} sur {totalPages}</span>
        <Button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          variant='outline'
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}