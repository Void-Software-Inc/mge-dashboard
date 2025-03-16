"use client"

import {
    SymbolIcon,
    CheckIcon,
    Cross2Icon,
    EyeOpenIcon,
  } from "@radix-ui/react-icons"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { quoteStatus, FinishedQuote } from "@/utils/types/quotes"
import { restoreFinishedQuote } from "@/services/quotes"
import { useState } from "react"
import { useAppContext } from "@/app/context/AppContext"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

const calculateTTC = (ht: number): number => {
  return ht * 1.20;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy', { locale: fr });
  } catch (error) {
      return '-';
  }
};

export const columns: ColumnDef<FinishedQuote>[] = [
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
      const finishedQuote = row.original
      const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
      const { setQuotesShouldRefetch, setFinishedQuotesShouldRefetch } = useAppContext()
      const router = useRouter()

      const handleRestoreFinishedQuote = async () => {
        try {
          await restoreFinishedQuote([finishedQuote.id]);
          setQuotesShouldRefetch(true);
          setFinishedQuotesShouldRefetch(true)
          toast.success('Devis restauré avec succès');
        } catch (error) {
          console.error('Erreur lors de la restauration du devis:', error);
          toast.error('Erreur lors de la restauration du devis');
        } finally {
          setIsRestoreDialogOpen(false);
        }
      };

      const handleViewFinishedQuote = () => {
        router.push(`/records/finished-quotes/${finishedQuote.id}`);
      };

      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleViewFinishedQuote}
            size="icon"
            className="text-gray-500 hover:text-blue-600 hover:bg-gray-50"
          >
            <EyeOpenIcon className="h-4 w-4" />
          </Button>

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
                  Cette action restaurera le devis avec le statut "nouveau".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestoreFinishedQuote}>
                  Restaurer
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
    header: () => {
      return (
        <div className={cn("whitespace-nowrap overflow-hidden overflow-ellipsis")}>
          <span>Statut</span>
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
    id: "product_price",
    header: () => <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">Prix produits HT</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_cost")) - (parseFloat(row.getValue("traiteur_price")) + parseFloat(row.getValue("other_expenses")))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
       return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "traiteur_price",
    header: () => <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">Prix traiteur HT</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("traiteur_price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
       return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "other_expenses",
    header: () => <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">Autres frais HT</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("other_expenses"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
       return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "total_cost",
    header: () => <div className="whitespace-nowrap overflow-hidden overflow-ellipsis font-extrabold">Prix total HT</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_cost"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
       return <div className="text-right font-extrabold">{formatted}</div>
    },
  },
  {
    accessorKey: "total_cost_ttc",
    header: () => <div className="whitespace-nowrap overflow-hidden overflow-ellipsis font-extrabold">Prix total TTC</div>,
    cell: ({ row }) => {
      const priceHT = parseFloat(row.getValue("total_cost"))
      const priceTTC = calculateTTC(priceHT)
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(priceTTC)
      return <div className="text-right font-extrabold">{formatted}</div>
    },
  },
  {
    accessorKey: "is_paid",
    header: () => <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">Payé</div>,
    cell: ({ row }) => {
      const isPaid = row.getValue("is_paid") as boolean;
      return (
        <div className="flex justify-center">
          {isPaid ? (
            <CheckIcon className="h-5 w-5 text-[#bef264] border-2 border-[#bef264] rounded-full" />
          ) : (
            <Cross2Icon className="h-5 w-5 text-red-500 border-2 border-red-500 rounded-full" />
          )}
        </div>
      );
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
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div className="max-w-[200px] truncate">{row.getValue("description")}</div>
    },
  },
  {
    accessorKey: "finished_at",
    header: () => {
      return (
        <div className={cn("whitespace-nowrap overflow-hidden overflow-ellipsis")}>
          <span>Date de finalisation</span>
        </div>
      );
    },
    cell: ({ row }) => {
      const dateString = row.getValue("finished_at") as string | null;
      return <div className="whitespace-nowrap overflow-hidden overflow-ellipsis">
        {formatDate(dateString)}
      </div>;
    },
  },
]

