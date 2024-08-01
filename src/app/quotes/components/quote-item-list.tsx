'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";
import { getProduct } from "@/services/products";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrashIcon, Pencil1Icon, PlusIcon } from '@radix-ui/react-icons';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductSimplifiedDataTable } from './product-simplified-data-table';
import { getAvailableProducts } from '@/services/quotes';

interface QuoteItemListProps {
    items: QuoteItem[];
    taintedItems: Set<number>;
    editedItems: Map<number, number>;
    createdItems: QuoteItem[];
    onItemTaint: (itemId: number) => void;
    onItemEdit: (itemId: number, quantity: number) => void;
    onItemCreate: (items: QuoteItem[]) => void;
    onItemRemove: (itemId: number) => void;
    isLoading: boolean;
    quoteId: number;
}

export function QuoteItemList({ 
  items, 
  taintedItems, 
  editedItems,
  createdItems,
  onItemTaint, 
  onItemEdit, 
  onItemCreate,
  onItemRemove,
  isLoading, 
  quoteId 
}: QuoteItemListProps) {
  const [productDetails, setProductDetails] = useState<Record<number, Product>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [neededProducts, setNeededProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const allItems = useMemo(() => [...items, ...createdItems], [items, createdItems]);
  
  const itemsPerPage = 10;
  

  const fetchProductDetails = useCallback(async (productIds: number[]) => {
    const newDetails: Record<number, Product> = { ...productDetails };
    let hasNewDetails = false;

    for (const productId of productIds) {
      if (!newDetails[productId]) {
        try {
          const product = await getProduct(productId);
          newDetails[productId] = product;
          hasNewDetails = true;
        } catch (error) {
          console.error(`Failed to fetch details for product ${productId}:`, error);
        }
      }
    }

    if (hasNewDetails) {
      setProductDetails(newDetails);
    }
  }, [productDetails]);

  useEffect(() => {
    const missingProductIds = allItems
      .map(item => item.product_id)
      .filter(id => !productDetails[id]);

    if (missingProductIds.length > 0) {
      fetchProductDetails(missingProductIds);
    }
  }, [allItems, productDetails, fetchProductDetails]);

  const fetchNeededProducts = useCallback(async () => {
    if (neededProducts.length > 0) return;
    setIsProductsLoading(true);
    try {
      const products = await getAvailableProducts(quoteId);
      setNeededProducts(products);
    } catch (error) {
      console.error('Failed to fetch needed products:', error);
    } finally {
      setIsProductsLoading(false);
    }
  }, [neededProducts, quoteId]);

  const handleDrawerOpen = useCallback(() => {
    setIsDrawerOpen(true);
    fetchNeededProducts();
  }, [fetchNeededProducts]);

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
      const isCreatedItem = createdItems.some(item => item.id === itemId);
      if (isCreatedItem) {
        // Update the quantity of the existing created item
        onItemCreate(createdItems.map(item => 
          item.id === itemId ? { ...item, quantity: numValue } : item
        ));
      } else {
        onItemEdit(itemId, numValue);
      }
    }
  };

  const handleProductsSelected = (selectedProducts: { productId: number; quantity: number }[]) => {
    const newItems = selectedProducts.map(product => ({
      id: Math.random(), // Temporary ID for new items
      product_id: product.productId,
      quantity: product.quantity,
      quote_id: quoteId,
    }));
    onItemCreate(newItems);
    setIsDrawerOpen(false);
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
        {allItems.length > 0 ? (
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
            {allItems.map((item) => {
              const product = productDetails[item.product_id];
              const isTainted = taintedItems.has(item.id);
              const isEdited = editedItems.has(item.id);
              const isCreated = createdItems.some(createdItem => createdItem.id === item.id);
              const currentQuantity = isCreated 
                ? item.quantity 
                : (editedItems.get(item.id) ?? item.quantity);

              return (
                <TableRow 
                  key={item.id} 
                  className={`h-16 ${
                    isTainted ? 'bg-red-50 hover:bg-red-50' : 
                    isCreated ? 'bg-green-50 hover:bg-green-50' :
                    isEdited ? 'bg-blue-50 hover:bg-blue-50' : ''
                  }`}
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
                        className="w-20 text-base"
                        min="0"
                      />
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2 text-base">{currentQuantity}</span>
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
                        if (isCreated) {
                          onItemRemove(item.id);
                        } else {
                          onItemTaint(item.id);
                        }
                        handleEditEnd();
                      }}
                      className={isTainted || isCreated ? 'text-red-500 hover:text-red-500 hover:bg-red-50' : 'text-black hover:text-red-500 hover:bg-gray-50'}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
        ) : (
          <div className="justify-center text-center text-sm text-gray-400 pt-8">
            Aucun produit ajouté au devis.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-4">
        {items.length > 0 && (
          <>
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
          </>
        )}
      </div>
      <div className="mb-4 mt-4">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button 
              variant='outline' 
              className="text-lime-500 hover:text-lime-700 w-full"
              onClick={handleDrawerOpen}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Ajouter un produit au devis</DrawerTitle>
              <DrawerDescription>
                Sélectionnez les produits que vous souhaitez ajouter au devis.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0 overflow-x-auto">
              <ProductSimplifiedDataTable 
                products={neededProducts}
                existingItems={[...items, ...createdItems]}
                isLoading={isProductsLoading}
                onProductsSelected={handleProductsSelected} 
              />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Annuler</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}