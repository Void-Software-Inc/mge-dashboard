"use client"

import * as React from "react"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Product } from "@/utils/types/products"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductsContext } from '../context/ProductsContext'
import { useRouter } from 'next/navigation'
import { PlusIcon } from "@radix-ui/react-icons"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
}

export function DataTable({
  columns,
}: Omit<DataTableProps<Product, any>, 'data'>) {
  const router = useRouter()

  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { shouldRefetch, setShouldRefetch } = useProductsContext()
  const [isMounted, setIsMounted] = React.useState(false)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/products')
      const { products } = await res.json()
      const cleanProducts = products.map((product: Product) => ({
        id: product.id,
        name: product.name,
        type: product.type,
        color: product.color,
        stock: product.stock,
        price: product.price,
        description: product.description,
        image_url: product.image_url,
      }))
      setProducts(cleanProducts)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cachedProducts', JSON.stringify(cleanProducts))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setShouldRefetch(false)
    setIsLoading(false)
  }

  React.useEffect(() => {
    setIsMounted(true)
    if (shouldRefetch) {
      fetchProducts()
    } else {
      if (typeof window !== 'undefined') {
        const cachedProducts = sessionStorage.getItem('cachedProducts')
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts))
          setIsLoading(false)
        } else {
          fetchProducts()
        }
      }
    }
  }, [shouldRefetch])

  const memoizedProducts = React.useMemo(() => products, [products])
  
  const table = useReactTable({
    data : memoizedProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection, 
    },
  })

  const handleCreateProduct = React.useCallback(() => {
    router.push('/products/create')
  }, [router])

  if (!isMounted) {
    return null
  }

  else if (isLoading) {
    return (
      <div className="flex flex-col space bg-transparent">
        <div className="flex items-center py-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[100px] ml-2" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: columns.length }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-8 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="h-20">
                  {Array.from({ length: columns.length }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
    )
  }

  return (
    <div>
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
        <div className="w-full md:w-auto md:flex-grow">
          <Input
            placeholder="Chercher par produit..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="w-full"
          />
        </div>
        <div className="flex w-full md:w-auto justify-between md:justify-start gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-3/5 md:w-auto flex-grow md:flex-grow-0">
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) => column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={handleCreateProduct}
            className="flex-grow md:flex-grow-0 bg-lime-300 hover:bg-lime-4000 text-black w-2/5 md:w-auto"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Create Product
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-20"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
