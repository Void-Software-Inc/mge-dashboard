'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";
import { getProduct } from "@/services/products";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrashIcon, Pencil1Icon } from '@radix-ui/react-icons';
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface QuoteItemListProps {
    items: QuoteItem[];
    taintedItems: Set<number>;
    editedItems: Map<number, number>;
    onItemTaint: (itemId: number) => void;
    onItemEdit: (itemId: number, quantity: number) => void;
    isLoading: boolean;
}

export function QuoteItemList({ items, taintedItems, editedItems, onItemTaint, onItemEdit, isLoading }: QuoteItemListProps) {
  const [productDetails, setProductDetails] = useState<Record<number, Product>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const handleEditStart = (itemId: number) => {
    if (!taintedItems.has(itemId)) {
      setEditingId(itemId);
    }
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onItemEdit(itemId, numValue);
    }
  };

  const handleEditEnd = () => {
    setEditingId(null);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

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
              const isEdited = editedItems.has(item.id);
              const currentQuantity = editedItems.get(item.id) ?? item.quantity;
              return (
                <TableRow 
                  key={item.id} 
                  className={`h-16 ${isTainted ? 'bg-red-50 hover:bg-red-50' : 
                                     isEdited ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                >
                  <TableCell className="whitespace-nowrap">
                    {product && product.image_url && (
                      <Image src={product.image_url} alt={product.name} width={45} height={45} />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {product ? product.name : 'Loading...'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={currentQuantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        onBlur={handleEditEnd}
                        className="w-20"
                        min="0"
                      />
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2">{currentQuantity}</span>
                        {!isTainted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStart(item.id)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Pencil1Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
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
                        handleEditEnd();
                      }}
                      className={isTainted ? 'text-red-500 hover:text-red-500 hover:bg-red-50' : 'text-black hover:text-red-500 hover:bg-gray-50'}
                    >
                      <TrashIcon className="h-4 w-4" />
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