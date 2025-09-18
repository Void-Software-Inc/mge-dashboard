"use client"

import * as React from "react"

import { getCodesPromos } from "@/services/codesPromos"

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
  PaginationState,
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
import { CodePromo } from "@/utils/types/codesPromos"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppContext } from "@/app/context/AppContext"
import { useRouter } from 'next/navigation'
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, Cross2Icon } from "@radix-ui/react-icons"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
}

export function DataTable({
  columns,
}: Omit<DataTableProps<CodePromo, any>, 'data'>) {
  const router = useRouter()

  const [codesPromos, setCodesPromos] = React.useState<CodePromo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { codesPromosShouldRefetch, setCodesPromosShouldRefetch } = useAppContext()
  const [isMounted, setIsMounted] = React.useState(false)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const fetchCodesPromos = async () => {
    setIsLoading(true)
    try {
      const codesPromos = await getCodesPromos()
      setCodesPromos(codesPromos)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cachedCodesPromos', JSON.stringify(codesPromos))
      }
    } catch (error) {
      console.error('Error fetching codes promos:', error)
    }
    setCodesPromosShouldRefetch(false)
    setIsLoading(false)
  }

  React.useEffect(() => {
    setIsMounted(true)
    const savedState = sessionStorage.getItem('codesPromosTableState')
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      setSorting(parsedState.sorting || [])
      setColumnFilters(parsedState.columnFilters || [])
      setColumnVisibility(parsedState.columnVisibility || {})
      setPagination(parsedState.pagination || { pageIndex: 0, pageSize: 10 })
    }

    if (codesPromosShouldRefetch) {
      fetchCodesPromos()
    } else {
      if (typeof window !== 'undefined') {
        const cachedCodesPromos = sessionStorage.getItem('cachedCodesPromos')
        if (cachedCodesPromos) {
          setCodesPromos(JSON.parse(cachedCodesPromos))
          setIsLoading(false)
        } else {
          fetchCodesPromos()
        }
      }
    }
  }, [codesPromosShouldRefetch])

  React.useEffect(() => {
    if (isMounted) {
      const state = {
        sorting,
        columnFilters,
        columnVisibility,
        pagination,
      }
      sessionStorage.setItem('codesPromosTableState', JSON.stringify(state))
    }
  }, [isMounted, sorting, columnFilters, columnVisibility, pagination])

  const memoizedCodesPromos = React.useMemo(() => codesPromos, [codesPromos])
  
  const table = useReactTable({
    data : memoizedCodesPromos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection, 
      pagination,
    },
  })

  const handleCreateCodePromo = React.useCallback(() => {
    router.push('/promos/create')
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

  const getDisplayFilterValue = (columnId: string, value: any): string => {
    if (columnId === "is_active") {
      return value === true ? "Actif" : value === false ? "Inactif" : "Tous"
    }
    return String(value)
  }

  const getDisplayColumnName = (columnId: string): string => {
    switch (columnId) {
      case "code_promo": return "Code Promo"
      case "amount": return "Pourcentage"
      case "is_active": return "Statut"
      case "created_at": return "Date de création"
      default: return columnId
    }
  }

  return (
    <div>
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
        <div className="w-full md:w-auto md:flex-grow">
          <Input
            placeholder="Chercher par code promo..."
            value={(table.getColumn("code_promo")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("code_promo")?.setFilterValue(event.target.value)
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
          <Button 
            onClick={handleCreateCodePromo}
            className="flex-grow md:flex-grow-0 bg-lime-300 hover:bg-lime-400 text-black w-2/5 md:w-auto"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Créer un code promo
          </Button>
        </div>
      </div>
      
      {/* Active Filters Display */}
      <div className="mb-4 min-h-[40px]">
        {(columnFilters.length > 0 || sorting.length > 0) ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-1">Filtres actifs:</span>
            
            {/* Display column filters */}
            {columnFilters.map((filter) => {
              const column = table.getColumn(filter.id);
              const columnName = getDisplayColumnName(filter.id);
              const filterValue = getDisplayFilterValue(filter.id, filter.value);
              
              return (
                <div 
                  key={`filter-${filter.id}-${filterValue}`}
                  className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
                >
                  <span className="font-medium">{columnName}:</span>
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
              const columnName = getDisplayColumnName(sort.id);
              
              return (
                <div 
                  key={`sort-${sort.id}`}
                  className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
                >
                  <span className="font-medium">Tri: {columnName}</span>
                  {sort.desc ? (
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  )}
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
                  className="h-16"
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
                  Aucun code promo trouvé.
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