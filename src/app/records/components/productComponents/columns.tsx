"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
  MixerVerticalIcon,
  SymbolIcon,
  Cross1Icon
} from "@radix-ui/react-icons"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import Image from "next/image"
import { ProductRecord, productTypes, productColors, productCategories } from "@/utils/types/products"
import { useState } from "react"
import { useAppContext } from "@/app/context/AppContext"
import { toast } from "sonner"
import { restoreProductRecord, deleteProductRecord } from "@/services/products"
import { ColorDisplay } from "@/components/shared/ColorDisplay"

export const columns: ColumnDef<ProductRecord>[] = [
  /*{
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
  },*/
  {
    id: "actions",
    header: () => {
      return (
        <div className={cn("text-center whitespace-nowrap overflow-hidden overflow-ellipsis")}>
          <span>Actions</span>
        </div>
      );
    },
    cell: ({ row }) => {
      const productRecord = row.original
      const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
      const { setProductsShouldRefetch, setProductsRecordsShouldRefetch } = useAppContext()

      const handleRestoreProduct = async () => {
        try {
          await restoreProductRecord([productRecord.id]);
          setProductsShouldRefetch(true);
          setProductsRecordsShouldRefetch(true);
          toast.success('Produit restauré avec succès');
        } catch (error) {
          console.error('Erreur lors de la restauration du produit:', error);
          toast.error('Erreur lors de la restauration du produit');
        } finally {
          setIsRestoreDialogOpen(false);
        }
      };

      const handleDeleteProduct = async () => {
        try {
          await deleteProductRecord([productRecord.id]);
          setProductsRecordsShouldRefetch(true);
          toast.success('Produit supprimé avec succès');
        } catch (error) {
          console.error('Erreur lors de la suppression du produit:', error);
          toast.error('Erreur lors de la suppression du produit');
        } finally {
          setIsDeleteDialogOpen(false);
        }
      };

      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsRestoreDialogOpen(true)}
            size="icon"
            className="text-blue-500 hover:text-blue-600 hover:bg-gray-50"
          >
            <SymbolIcon className="h-4 w-4" />
          </Button>

          <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes vous sûr de vouloir restaurer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action restaurera le produit.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestoreProduct}>
                  Restaurer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            onClick={() => setIsDeleteDialogOpen(true)}
            size="icon"
            className="text-black hover:text-red-500 hover:bg-gray-50"
          >
            <Cross1Icon className="h-4 w-4" />
          </Button>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes vous sûr de vouloir supprimer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement le produit et toutes les données associées.
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
    accessorKey: "category",
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
                <span>Catégorie</span>
                <MixerVerticalIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <ScrollArea className="h-fit w-full rounded-md">
                {productCategories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.value}
                    className="capitalize"
                    checked={column.getFilterValue() === category.value}
                    onCheckedChange={(value) => {
                      if (value) {
                        column.setFilterValue(category.value);
                      } else {
                        column.setFilterValue(null);
                      }
                    }}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    cell: ({ row }) => {
      const categoryValue = row.getValue("category") as string;
      const category = productCategories.find(c => c.value === categoryValue);
      
      return (
        <Badge variant="outline" className="whitespace-nowrap overflow-hidden overflow-ellipsis">
          {category ? category.name : categoryValue || "Non défini"}
        </Badge>
      );
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
      const typeValue = row.getValue("type") as string;
      const type = productTypes.find(t => t.value === typeValue);
      return (
        <Badge variant="outline" className="whitespace-nowrap overflow-hidden overflow-ellipsis">
          {type ? type.name : typeValue}
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
                      <ColorDisplay colorValue={color.value} className="mr-2" />
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
              <ColorDisplay colorValue={colorValue} className="mr-2" />
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

