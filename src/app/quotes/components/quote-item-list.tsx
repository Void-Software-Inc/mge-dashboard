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
    onTotalCostChange: (totalCost: number) => void;
    disabled: boolean;
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
  quoteId,
  onTotalCostChange,
  disabled,
}: QuoteItemListProps) {
  const [productDetails, setProductDetails] = useState<Record<number, Product>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [neededProducts, setNeededProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const allItems = useMemo(() => [...items, ...createdItems], [items, createdItems]);
  
  const itemsPerPage = 5;
  

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

  const calculateTotalCost = useCallback(() => {
    const totalCost = allItems.reduce((sum, item) => {
      if (taintedItems.has(item.id)) {
        return sum;
      }
      const product = productDetails[item.product_id];
      const quantity = editedItems.get(item.id) ?? item.quantity;
      return sum + (product ? quantity * product.price : 0);
    }, 0);
    return totalCost;
  }, [allItems, productDetails, taintedItems, editedItems]);

  useEffect(() => {
    const totalCost = calculateTotalCost();
    onTotalCostChange(totalCost); 
  }, [calculateTotalCost, onTotalCostChange]);

  const handleEditStart = (itemId: number) => {
    if (!taintedItems.has(itemId)) {
      setEditingId(itemId);
    }
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseInt(value, 10);
    const item = allItems.find(i => i.id === itemId);
    const product = item ? productDetails[item.product_id] : null;
    
    if (product && !isNaN(numValue) && numValue >= 0 && numValue <= product.stock) {
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

  const totalPages = Math.ceil(allItems.length / itemsPerPage);

  // Get current items
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return allItems.slice(indexOfFirstItem, indexOfLastItem);
  }, [allItems, currentPage]);

  const handlePreviousPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

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
              <TableRow className="h-16">
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
                      <div className="w-12 h-12 relative"> {/* Fixed size container for image */}
                        <Image 
                          src={product.image_url} 
                          alt={product.name} 
                          layout="fill" 
                          objectFit="cover" 
                          className="rounded-md"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {product ? product.name : 'Loading...'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {editingId === item.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={currentQuantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onBlur={handleEditEnd}
                          className="w-20 text-base"
                          min="0"
                          max={product ? product.stock : undefined}
                          disabled={disabled}
                        />
                        <span className="text-sm text-gray-500">/ {product ? product.stock : 'N/A'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2 text-base">{currentQuantity}</span>
                        {!isTainted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStart(item.id)}
                            className="text-blue-500 hover:text-blue-700"
                            disabled={disabled}
                          >
                            <Pencil1Icon className="h-4 w-4" />
                          </Button>
                        )}
                        <span className="ml-2 text-sm text-gray-500">/ {product ? product.stock : 'N/A'}</span>
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
                      disabled={disabled}
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
      {allItems.length > 0 && (
      <div className="text-center text-sm text-gray-400 pt-4">
          Prix total des produits HT : {calculateTotalCost().toFixed(2)} €
        </div>
      )}
      <div className="flex items-center justify-between mt-4">
        {allItems.length > 0 && (
          <>
            <Button 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              variant='outline'
            >
              Précédent
            </Button>
            <span className='text-sm text-gray-500'>Page {currentPage} sur {totalPages}</span>
            <Button 
              onClick={handleNextPage}
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
              disabled={disabled}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-4xl">
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
                <DrawerClose className="" asChild>
                  <Button variant="outline">Annuler</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}