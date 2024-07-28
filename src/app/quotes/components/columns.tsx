"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useRouter } from 'next/navigation'
import { Quote } from "@/utils/types/quotes"
import { useCallback, useState } from "react"
import { useQuotesContext } from "@/app/quotes/context/QuotesContext"
import { toast } from "sonner"

import { deleteQuote } from "@/services/quotes"

export const columns: ColumnDef<Quote>[] = [
  {
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
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "first_name",
    header: "Nom",
  },
  {
    accessorKey: "last_name",
    header: "Prénom",
  },
  {
    accessorKey: "phone_number",
    header: "Téléphone",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "event_start_date",
    header: "Date de début",
  },
  {
    accessorKey: "event_end_date",
    header: "Date de fin",
  },
  {
    accessorKey: "status",
    header: "Statut",
  },
  {
    accessorKey: "total_cost",
    header: () => <div className="text-right">Prix total</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_cost"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
       return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "is_traiteur",
    header: "Traiteur",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">{row.getValue("description")}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const quote = row.original
      const router = useRouter()
      const { setShouldRefetch } = useQuotesContext()
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

      const handleViewQuote = useCallback(() => {
        router.push(`/quotes/${quote.id}`)
      }, [router, quote.id])

      const handleDeleteQuote = useCallback(async () => {
        try {
          await deleteQuote([quote.id]);
          setShouldRefetch(true);
          toast.success('Quote deleted successfully');
        } catch (error) {
          console.error('Error deleting quote:', error);
          toast.error('Failed to delete quote');
        } finally {
          setIsDeleteDialogOpen(false);
        }
      }, [quote.id, setShouldRefetch]);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleViewQuote}>
                Voir le devis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                Supprimer le devis
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes vous sr de vouloir supprimer ce devis ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Cela supprimera définitivement le devis "{quote.id}" et toutes ses données seront supprimées de nos serveurs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteQuote}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )
    },
  },
]

