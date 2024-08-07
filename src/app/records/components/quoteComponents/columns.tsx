"use client"

import {
    ArrowDownIcon,
    ArrowUpIcon,
    CaretSortIcon,
    EyeNoneIcon,
    MixerVerticalIcon,
    Cross2Icon,
    CheckIcon,
    SymbolIcon,
    Cross1Icon,
  } from "@radix-ui/react-icons"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { quoteStatus, QuoteRecord } from "@/utils/types/quotes"
import { deleteQuoteRecord, restoreQuoteRecord } from "@/services/quotes"
import { useState } from "react"
import { useAppContext } from "@/app/context/AppContext"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: fr });
};

export const columns: ColumnDef<QuoteRecord>[] = [
  /*Implementation later{
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
      const quoteRecord = row.original
      const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
      const { setQuotesShouldRefetch, setQuotesRecordsShouldRefetch } = useAppContext()

      const handleRestoreQuote = async () => {
        try {
          await restoreQuoteRecord([quoteRecord.id]);
          setQuotesShouldRefetch(true);
          setQuotesRecordsShouldRefetch(true);
          toast.success('Devis restauré avec succès');
        } catch (error) {
          console.error('Erreur lors de la restauration du devis:', error);
          toast.error('Erreur lors de la restauration du devis');
        } finally {
          setIsRestoreDialogOpen(false);
        }
      };

      const handleDeleteQuote = async () => {
        try {
          await deleteQuoteRecord([quoteRecord.id]);
          setQuotesRecordsShouldRefetch(true);
          toast.success('Devis supprimé avec succès');
        } catch (error) {
          console.error('Erreur lors de la suppression du devis:', error);
          toast.error('Erreur lors de la suppression du devis');
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
                <AlertDialogTitle>Êtes vous sûr de vouloir restaurer ce devis ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action restaurera le devis.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestoreQuote}>
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
                <AlertDialogTitle>Êtes vous sûr de vouloir supprimer ce devis ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement le devis et toutes les données associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteQuote}>
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
    accessorKey: "id",
    header: () => {
      return (
        <div className={cn("whitespace-nowrap overflow-hidden overflow-ellipsis")}>
          <span>N° Devis</span>
        </div>
      );
    },
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return <div className="text-center whitespace-nowrap overflow-hidden overflow-ellipsis">{id}</div>;
    },
  },
  {
    accessorKey: "status",
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
                <span>Statut</span>
                <MixerVerticalIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <ScrollArea className="h-[300px] w-full rounded-md">
                {quoteStatus.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.value}
                    className="capitalize"
                    checked={column.getFilterValue() === status.value}
                    onCheckedChange={(value) => {
                      if (value) {
                        column.setFilterValue(status.value);
                      } else {
                        column.setFilterValue(null);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="flex-grow">{status.name}</span>
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
      const statusValue = row.getValue("status");
      const status = quoteStatus.find(s => s.value === statusValue);
      return status ? (
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: status.color }}
          />
          <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">{status.name}</span>
        </div>
      ) : null;
    },
  },
  {
    accessorKey: "last_name",
    header: "Nom",
  },
  {
    accessorKey: "first_name",
    header: "Prénom",
  },
  {
    accessorKey: "phone_number",
    header: "Téléphone",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phone_number") as string;
      return <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">{formatPhoneNumber(phoneNumber)}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "event_start_date",
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
                <span>Date de début</span>
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
      const dateString = row.getValue("event_start_date") as string;
      return <div>{formatDate(dateString)}</div>;
    },
  },
  {
    accessorKey: "event_end_date",
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
                <span>Date de fin</span>
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
      const dateString = row.getValue("event_end_date") as string;
      return <div>{formatDate(dateString)}</div>;
    },
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
    cell: ({ row }) => {
      const isTraiteur = row.getValue("is_traiteur") as boolean;
      return (
        <div className="flex justify-center">
          {isTraiteur ? (
            <CheckIcon className="h-5 w-5 text-[#bef264] border border-2 border-[#bef264] rounded-full" />
          ) : (
            <Cross2Icon className="h-5 w-5 text-red-500 border border-2 border-red-500 rounded-full" />
          )}
        </div>
      );
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

