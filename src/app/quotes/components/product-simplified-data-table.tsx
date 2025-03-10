'use client'
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Product } from "@/utils/types/products";
import { QuoteItem } from "@/utils/types/quotes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

interface ProductSimplifiedDataTableProps {
    products: Product[];
    existingItems: QuoteItem[];
    isLoading: boolean;
    onProductsSelected: (selectedProducts: { productId: number; quantity: number }[]) => void;
}

export function ProductSimplifiedDataTable({ products, existingItems, isLoading, onProductsSelected }: ProductSimplifiedDataTableProps) {
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 3;

    const existingProductIds = useMemo(() => new Set(existingItems.map(item => item.product_id)), [existingItems]);


    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleProductSelect = (productId: number) => {
        if (existingProductIds.has(productId)) return;
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleQuantityChange = (productId: number, value: string) => {
        if (existingProductIds.has(productId)) return;
        const numValue = parseInt(value, 10);
        const product = products.find(p => p.id === productId);
        if (product && !isNaN(numValue) && numValue >= 0 && numValue <= product.stock) {
          setQuantities(prev => ({ ...prev, [productId]: numValue }));
        }
    };

    const handleAddProducts = () => {
        const productsToAdd = Array.from(selectedProducts).map(productId => ({
            productId,
            quantity: quantities[productId] || 1
        }));
        onProductsSelected(productsToAdd);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4 relative">
                <Input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="overflow-x-auto">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="h-12">
                            <TableHead className="w-1/12"></TableHead>
                            <TableHead className="w-1/6">Image</TableHead>
                            <TableHead className="w-1/3">Nom</TableHead>
                            <TableHead className="w-1/6">Prix</TableHead>
                            <TableHead className="w-1/6">Quantité</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentProducts.map((product) => {
                            const isExisting = existingProductIds.has(product.id);
                            return (
                                <TableRow 
                                    key={product.id} 
                                    className={`h-16 ${isExisting ? 'bg-gray-100' : ''}`}
                                >
                                    <TableCell>
                                        {isExisting ? (
                                            <span className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">Déjà ajouté</span>
                                        ) : (
                                            <Checkbox
                                                checked={selectedProducts.has(product.id)}
                                                onCheckedChange={() => handleProductSelect(product.id)}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {product.image_url && (
                                            <Image src={product.image_url} alt={product.name} width={45} height={45} />
                                        )}
                                    </TableCell>
                                    <TableCell className={`whitespace-nowrap overflow-hidden text-ellipsis ${isExisting ? 'text-gray-500' : ''}`}>
                                        {product.name}
                                    </TableCell>
                                    <TableCell className={isExisting ? 'text-gray-500' : ''}>
                                        {`${product.price} €`}
                                    </TableCell>
                                    <TableCell>
                                        {isExisting ? (
                                            <span className="text-sm text-gray-500">-</span>
                                        ) : (
                                          <div className="flex items-center space-x-2">
                                          <Input
                                              type="number"
                                              value={quantities[product.id] || ''}
                                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                              className="w-20 text-base"
                                              min="0"
                                              max={product.stock}
                                              disabled={!selectedProducts.has(product.id)}
                                          />
                                            <span className="text-sm text-gray-500">/ {product.stock}</span>
                                          </div>
                                        )}
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
            <div className="mt-4">
                <Button onClick={handleAddProducts} className="w-full">
                    Ajouter les produits sélectionnés
                </Button>
            </div>
        </div>
    );
}