"use client"

import * as React from "react"

import { getQuotes } from "@/services/quotes"

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
import { Quote } from "@/utils/types/quotes"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuotesContext } from "@/app/quotes/context/QuotesContext"
import { useRouter } from 'next/navigation'
import { PlusIcon } from "@radix-ui/react-icons"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
}

export function DataTable({
  columns,
}: Omit<DataTableProps<Quote, any>, 'data'>) {
  const router = useRouter()

  const [quotes, setQuotes] = React.useState<Quote[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { shouldRefetch, setShouldRefetch } = useQuotesContext()
  const [isMounted, setIsMounted] = React.useState(false)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const fetchQuotes = async () => {
    setIsLoading(true)
    try {
      const quotes = await getQuotes()
      setQuotes(quotes)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cachedQuotes', JSON.stringify(quotes))
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
    }
    setShouldRefetch(false)
    setIsLoading(false)
  }

  React.useEffect(() => {
    setIsMounted(true)
    if (shouldRefetch) {
      fetchQuotes()
    } else {
      if (typeof window !== 'undefined') {
        const cachedQuotes = sessionStorage.getItem('cachedQuotes')
        if (cachedQuotes) {
          setQuotes(JSON.parse(cachedQuotes))
          setIsLoading(false)
        } else {
          fetchQuotes()
        }
      }
    }
  }, [shouldRefetch])

  const memoizedQuotes = React.useMemo(() => quotes, [quotes])
  
  const table = useReactTable({
    data : memoizedQuotes,
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

  const handleCreateQuote = React.useCallback(() => {
    router.push('/quotes/create')
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
            placeholder="Chercher par nom de client..."
            value={(table.getColumn("last_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("last_name")?.setFilterValue(event.target.value)
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
            onClick={handleCreateQuote}
            className="flex-grow md:flex-grow-0 bg-lime-300 hover:bg-lime-400 text-black w-2/5 md:w-auto"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Créer un devis
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
