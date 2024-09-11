"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
  MixerVerticalIcon,
  Pencil1Icon,
  TrashIcon,
  DownloadIcon,
} from "@radix-ui/react-icons"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { Product, productTypes, productColors } from "@/utils/types/products"
import { useState } from "react"
import { useAppContext } from "@/app/context/AppContext"
import { toast } from "sonner"
import { deleteProduct, getProduct } from "@/services/products"

import { getProductImages } from "@/services/products"
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const getMetallicBackground = (color: string) => {
  if (color === 'gold') {
    return `linear-gradient(45deg, #B8860B, #FFD700, #DAA520)`;
  } else if (color === 'silver') {
    return `linear-gradient(45deg, #C0C0C0, #E8E8E8, #A9A9A9)`;
  }
  return '';
};

const handleBulkDownloadMedia = async (productIds: number[]) => {
  try {
    const zip = new JSZip();

    for (const productId of productIds) {
      const product = await getProduct(productId);
      
      // Download main image
      const mainImageResponse = await fetch(product.image_url);
      const mainImageBlob = await mainImageResponse.blob();
      const fileExtension = getFileExtension(product.image_url);
      zip.file(`${product.name}.${fileExtension}`, mainImageBlob);
    }

    // Generate and save zip file
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `telechargementsImages.zip`);
    toast.success('Media downloaded successfully');
  } catch (error) {
    console.error('Error downloading media:', error);
    toast.error('Failed to download media');
  }
};

const getFileExtension = (url: string): string => {
  const extension = url.split('.').pop();
  return extension || 'jpg'; // Default to jpg if no extension found
};


export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    header: ({ table }) => {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const isAnyRowSelected = selectedRows.length > 0;

      const handleDownloadSelected = () => {
        const selectedProductIds = selectedRows.map(row => row.original.id);
        handleBulkDownloadMedia(selectedProductIds);
      };

      return (
        <div className={cn("flex items-center space-x-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
              >
                <span>Actions</span>
                <MixerVerticalIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem 
                onClick={handleDownloadSelected}
                disabled={!isAnyRowSelected}
                className={cn(
                  !isAnyRowSelected && "cursor-not-allowed opacity-50"
                )}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Télécharger les photos
              </DropdownMenuItem>
              {/* Add more bulk actions here if needed */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    cell: ({ row }) => {
      const product = row.original
      const router = useRouter()
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
      const { setProductsShouldRefetch, setProductsRecordsShouldRefetch, setPopularProductsShouldRefetch } = useAppContext()

      const handleDeleteProduct = async () => {
        try {
          await deleteProduct([product.id]);
          setProductsShouldRefetch(true);
          setProductsRecordsShouldRefetch(true);
          setPopularProductsShouldRefetch(true);
          toast.success('Product deleted successfully');
        } catch (error) {
          console.error('Error deleting product:', error);
          toast.error('Failed to delete product');
        } finally {
          setIsDeleteDialogOpen(false);
        }
      };

      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push(`/products/${product.id}`)}
            size="icon"
            className="text-blue-500 hover:text-blue-700 hover:bg-gray-50"
          >
            <Pencil1Icon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsDeleteDialogOpen(true)}
            size="icon"
            className="text-black hover:text-red-500 hover:bg-gray-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes vous sûr de vouloir supprimer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cela supprimera le produit "{product.name}" et le déplacera dans les archives.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduct}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image_url",
    header: "Image",
    cell: ({ row }) => {
      const image_url = row.original.image_url
      return <Image sizes="100vw" width="0" height="0" src={image_url} alt={row.original.name} className="h-12 w-12" />
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <div className={cn("flex items-center space-x-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
              >
                <span>Produit</span>
                {column.getIsSorted() === "desc" ? (
                  <ArrowDownIcon className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "asc" ? (
                  <ArrowUpIcon className="ml-2 h-4 w-4" />
                ) : (
                  <CaretSortIcon className="ml-2 h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Desc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Masquer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <div className={cn("flex items-center space-x-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
              >
                <span>Type</span>
                <MixerVerticalIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <ScrollArea className="h-[300px] w-full rounded-md">
                {productTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.value}
                    className="capitalize"
                    checked={column.getFilterValue() === type.value}
                    onCheckedChange={(value) => {
                      if (value) {
                        column.setFilterValue(type.value);
                      } else {
                        column.setFilterValue(null);
                      }
                    }}
                  >
                    {type.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <Badge variant="outline" className="whitespace-nowrap overflow-hidden overflow-ellipsis">
          {String(type)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "color",
    header: ({ column }) => {
      return (
        <div className={cn("flex items-center space-x-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
              >
                <span>Couleur</span>
                <MixerVerticalIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <ScrollArea className="h-[300px] w-full rounded-md">
                {productColors.map((color) => (
                  <DropdownMenuCheckboxItem
                    key={color.value}
                    className="capitalize"
                    checked={column.getFilterValue() === color.value}
                    onCheckedChange={(value) => {
                      if (value) {
                        column.setFilterValue(color.value);
                      } else {
                        column.setFilterValue(null);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {color.value === 'transparent' ? (
                        <div className="w-4 h-4 mr-2 rounded-full overflow-hidden border border-gray-300 bg-white relative">
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-50" style={{
                            backgroundImage: `
                              linear-gradient(45deg, #ccc 25%, transparent 25%),
                              linear-gradient(-45deg, #ccc 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #ccc 75%),
                              linear-gradient(-45deg, transparent 75%, #ccc 75%)
                            `,
                            backgroundSize: '4px 4px',
                            backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                          }} />
                        </div>
                      ) : color.value === 'multicolore' ? (
                        <div className="w-4 h-4 mr-2 rounded-full overflow-hidden flex flex-wrap">
                          <div className="w-2 h-2 bg-yellow-400"></div>
                          <div className="w-2 h-2 bg-green-500"></div>
                          <div className="w-2 h-2 bg-pink-400"></div>
                          <div className="w-2 h-2 bg-blue-500"></div>
                        </div>
                      ) : color.value === 'gold' || color.value === 'silver' ? (
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ background: getMetallicBackground(color.value) }}
                        />
                      ) : (
                        <div 
                          className={`w-4 h-4 rounded-full mr-2 ${color.value === 'blanc' ? 'border border-gray-300' : ''}`}
                          style={{ backgroundColor: color.hex }}
                        />
                      )}
                      {color.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    cell: ({ row }) => {
      const colorValue = row.getValue("color") as string;
      const color = productColors.find(c => c.value === colorValue);
      return (
        <div className="flex items-center">
          {color && (
            <>
              {color.value === 'transparent' ? (
                <div className="w-4 h-4 mr-2 rounded-full overflow-hidden border border-gray-300 bg-white relative">
                  <div className="absolute inset-0 bg-gray-200 bg-opacity-50" style={{
                    backgroundImage: `
                      linear-gradient(45deg, #ccc 25%, transparent 25%),
                      linear-gradient(-45deg, #ccc 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #ccc 75%),
                      linear-gradient(-45deg, transparent 75%, #ccc 75%)
                    `,
                    backgroundSize: '4px 4px',
                    backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                  }} />
                </div>
              ) : color.value === 'multicolore' ? (
                <div className="w-4 h-4 mr-2 rounded-full overflow-hidden flex flex-wrap">
                  <div className="w-2 h-2 bg-yellow-400"></div>
                  <div className="w-2 h-2 bg-green-500"></div>
                  <div className="w-2 h-2 bg-pink-400"></div>
                  <div className="w-2 h-2 bg-blue-500"></div>
                </div>
              ) : color.value === 'gold' || color.value === 'silver' ? (
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ background: getMetallicBackground(color.value) }}
                />
              ) : (
                <div 
                  className={`w-4 h-4 rounded-full mr-2 ${color.value === 'blanc' ? 'border border-gray-300' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
              )}
              <span>{color.name}</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "price",
    header: () => <div className="">Prix</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
       return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">{row.getValue("description")}</div>
    },
  },
]

