"use client"

import * as React from "react"

import { getProductsRecords } from "@/services/products"

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
import { ProductRecord } from "@/utils/types/products"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppContext } from "@/app/context/AppContext"
import { Cross2Icon, TrashIcon } from "@radix-ui/react-icons"
import { getDisplayColumnName, getDisplayFilterValue } from "@/components/shared/ColumnUtils"
import { ColorDisplay } from "@/components/shared/ColorDisplay"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
}

export function DataTable({
  columns,
}: Omit<DataTableProps<ProductRecord, any>, 'data'>) {
  
  const [productsRecords, setProductsRecords] = React.useState<ProductRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { productsRecordsShouldRefetch, setProductsRecordsShouldRefetch } = useAppContext()
  const [isMounted, setIsMounted] = React.useState(false)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const productsRecords = await getProductsRecords()
      console.log("Fetched product records:", productsRecords);
      setProductsRecords(productsRecords)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cachedProductsRecords', JSON.stringify(productsRecords))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setProductsRecordsShouldRefetch(false)
    setIsLoading(false)
  }

  React.useEffect(() => {
    setIsMounted(true)
    if (productsRecordsShouldRefetch) {
      fetchProducts()
    } else {
      if (typeof window !== 'undefined') {
        const cachedProductsRecords = sessionStorage.getItem('cachedProductsRecords')
        if (cachedProductsRecords) {
          setProductsRecords(JSON.parse(cachedProductsRecords))
          setIsLoading(false)
        } else {
          fetchProducts()
        }
      }
    }
  }, [productsRecordsShouldRefetch])

  const memoizedProductsRecords = React.useMemo(() => productsRecords, [productsRecords])
  
  const table = useReactTable({
    data : memoizedProductsRecords,
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
                      {getDisplayColumnName(column.id)}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-4 min-h-[40px]">
        {(columnFilters.length > 0 || sorting.length > 0) ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-1">Filtres actifs:</span>
            
            {/* Display column filters */}
            {columnFilters.map((filter) => {
              const column = table.getColumn(filter.id);
              const columnName = getDisplayColumnName(filter.id);
              const filterValue = getDisplayFilterValue(filter.id, filter.value as string);
              
              return (
                <div 
                  key={`filter-${filter.id}-${filterValue}`}
                  className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
                >
                  <span className="font-medium">{columnName}:</span>
                  {filter.id === "color" && (
                    <ColorDisplay colorValue={filter.value as string} className="mr-2" />
                  )}
                  <span>{filterValue}</span>
                  <button
                    onClick={() => {
                      column?.setFilterValue(undefined);
                    }}
                    className="ml-2 rounded-full hover:bg-muted p-1 h-6 w-6 inline-flex items-center justify-center hover:text-red-500 transition-colors"
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            
            {/* Display sorting */}
            {sorting.map((sort) => {
              const column = table.getColumn(sort.id);
              const columnName = getDisplayColumnName(sort.id);
              
              return (
                <div 
                  key={`sort-${sort.id}`}
                  className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
                >
                  <span className="font-medium">{columnName}:</span>
                  <span>{sort.desc ? 'Décroissant' : 'Croissant'}</span>
                  <button
                    onClick={() => {
                      setSorting(sorting.filter(s => s.id !== sort.id));
                    }}
                    className="ml-2 rounded-full hover:bg-muted p-1 h-6 w-6 inline-flex items-center justify-center hover:text-red-500 transition-colors"
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            
            {/* Clear all button */}
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                // Clear all filters
                columnFilters.forEach((filter) => {
                  table.getColumn(filter.id)?.setFilterValue(undefined);
                });
                // Clear all sorting
                setSorting([]);
              }}
              className="ml-1 flex items-center gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              Effacer tous les filtres
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Aucun filtre sélectionné
          </div>
        )}
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
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
