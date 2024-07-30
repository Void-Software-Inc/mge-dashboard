'use client'

import { useCallback, useEffect, useState } from 'react'

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster, toast } from 'sonner'
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"

import { useRouter } from 'next/navigation'
import { useQuotesContext } from '../context/QuotesContext'
import { getQuote, getQuoteItems, updateQuote, deleteQuoteItem, updateQuoteItem } from "@/services/quotes"
import { Quote, quoteStatus, QuoteItem } from "@/utils/types/quotes"
import { DatePicker } from "../components/date-picker"
import { QuoteItemList } from "../components/quote-item-list"
import { format, parseISO } from 'date-fns';

interface FormErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  event_start_date?: string;
  event_end_date?: string;
  status?: string;
  total_cost?: string;
  is_traiteur?: string;
}

export default function QuoteForm({ quoteId }: { quoteId: string }) {
  const router = useRouter()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[] | null>(null)
  const [isQuoteItemsLoading, setIsQuoteItemsLoading] = useState(true)
  const [shouldReloadItems, setShouldReloadItems] = useState(false)

  const [formData, setFormData] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isFormValid, setIsFormValid] = useState(true)
  
  const [taintedItems, setTaintedItems] = useState<Set<number>>(new Set());
  const [editedItems, setEditedItems] = useState<Map<number, number>>(new Map());

  const [isChanged, setIsChanged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setShouldRefetch } = useQuotesContext()

  const handleGoBack = useCallback(() => {
    router.push('/quotes')
  }, [router])

  const fetchQuoteItems = useCallback(async () => {
    setIsQuoteItemsLoading(true)
    try {
      const fetchedQuoteItems = await getQuoteItems(parseInt(quoteId))
      setQuoteItems(fetchedQuoteItems)
    } catch (error) {
      console.error('Error fetching quote items:', error)
      toast.error('Failed to load quote items')
    } finally {
      setIsQuoteItemsLoading(false)
    }
  }, [quoteId])
  
  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoading(true)
      try {
        const [fetchedQuote] = await Promise.all([
          getQuote(parseInt(quoteId))
        ])
        setQuote(fetchedQuote)
        setFormData(fetchedQuote)
        await fetchQuoteItems()
      } catch (error) {
        console.error('Error fetching quote:', error)
        toast.error('Failed to load quote')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuote()
  }, [quoteId, fetchQuoteItems])

  useEffect(() => {
    setIsChanged(JSON.stringify(quote) !== JSON.stringify(formData) || taintedItems.size > 0 || editedItems.size > 0);
  }, [quote, formData, taintedItems, editedItems]);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!formData?.first_name) {
      newErrors.first_name = "Le prénom est obligatoire"
      isValid = false
    }
    if (!formData?.last_name) {
      newErrors.last_name = "Le nom est obligatoire"
      isValid = false
    }
    if (!formData?.phone_number) {
      newErrors.phone_number = "Le numéro de téléphone est obligatoire"
      isValid = false
    }
    if (!formData?.email) {
      newErrors.email = "L'email est obligatoire"
      isValid = false
    }
    if (!formData?.event_start_date) {
      newErrors.event_start_date = "La date de début de l'événement est obligatoire"
      isValid = false
    }
    if (!formData?.event_end_date) {
      newErrors.event_end_date = "La date de fin de l'événement est obligatoire"
      isValid = false
    }
    if (!formData?.status) {
      newErrors.status = "Le statut est obligatoire"
      isValid = false
    }
    if (!formData?.total_cost) {
      newErrors.total_cost = "Le prix total est invalide"
      isValid = false
    }

    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [formData])

  useEffect(() => {
    validateForm()
  }, [formData, validateForm])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === 'total_cost') {
      // Only allow numeric input for total_cost
      if (!/^\d*$/.test(value)) return
      // Convert to number or null if empty
      const numValue = value === '' ? null : parseInt(value, 10)
      // @ts-ignore
      setFormData(prev => prev ? { ...prev, [id]: numValue } : null)
    } else {
      setFormData(prev => prev ? { ...prev, [id]: value } : null)
    }
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => prev ? { ...prev, [id]: value } : null)
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => prev ? { ...prev, is_traiteur: checked } : null);
  };
  const handleStartDateChange = (date: Date | undefined) => {
    setFormData(prev => prev ? { 
      ...prev, 
      event_start_date: date ? format(date, 'yyyy-MM-dd') : '' 
    } : null)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setFormData(prev => prev ? { 
      ...prev, 
      event_end_date: date ? format(date, 'yyyy-MM-dd') : '' 
    } : null)
  }

  const handleItemTaint = (itemId: number) => {
    setTaintedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        setShouldReloadItems(false);
      } else {
        newSet.add(itemId);
        setShouldReloadItems(true);
      }
      return newSet;
    });
    // Remove from edited items if it was being edited
    setEditedItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  };

  const handleItemEdit = (itemId: number, quantity: number) => {
    setEditedItems(prev => {
      const newMap = new Map(prev);
      if (quantity !== quoteItems?.find(item => item.id === itemId)?.quantity) {
        newMap.set(itemId, quantity);
        setShouldReloadItems(true);
      } else {
        newMap.delete(itemId);
        setShouldReloadItems(false);
      }
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !isChanged || !formData) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Update the quote
      const response = await updateQuote(formDataToSend);

      const updatePromises = [];
      
      // Delete the tainted items
      for (const itemId of Array.from(taintedItems)) {
        updatePromises.push(deleteQuoteItem(parseInt(quoteId), itemId));
      }
      // Update the edited items
      editedItems.forEach((quantity, itemId) => {
        updatePromises.push(updateQuoteItem(parseInt(quoteId), itemId, quantity));
      });

      await Promise.all(updatePromises);

      setTaintedItems(new Set());
      setEditedItems(new Map());

      if (shouldReloadItems) {
        await fetchQuoteItems();
      }
      
      setQuote(response);
      setFormData(response);
      setIsChanged(false);
      setShouldRefetch(true);
      toast.success('Devis mis à jour avec succès');
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Erreur lors de la mise à jour du devis');
    } finally {
      setShouldReloadItems(false);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-48 w-full mb-4" />
        </div>
      </div>
    )
  }
  
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">Devis non trouvé</div>
      </div>
    )
  }

  return (
    <>
      <div className="w-[100vw] h-14 fixed bg-white flex items-center z-10">
        <div className="p-4 flex justify-start w-full">
          <Button variant="secondary" size="icon" onClick={handleGoBack}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 md:p-6 flex justify-end w-full">
        <Button 
            className={`
              ${isChanged && isFormValid 
                ? "bg-lime-300 hover:bg-lime-400" 
                : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
              }
            `}
            variant="secondary"
            disabled={!isFormValid || !isChanged || isSubmitting}
            onClick={handleSubmit}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Mise à jour...' : 'Valider'}
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Label className="text-base">Numéro du devis</Label>
            <Input id="id" value={formData?.id ?? ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label htmlFor="color" className="text-base">Statut du devis</Label>
            <Select
              onValueChange={(value) => handleSelectChange('status', value)}
              value={formData?.status ?? ''}
            >
              <SelectTrigger className={`w-full ${errors.status ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {quoteStatus.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center">
                      <div 
                        className={`w-4 h-4 rounded-full mr-2`}
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="last_name" className="text-base">Nom du client</Label>
            <Input 
              id="last_name" 
              value={formData?.last_name ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.last_name ? 'border-red-500' : ''}`} 
            />
            {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="first_name" className="text-base">Prénom du client</Label>
            <Input 
              id="first_name" 
              value={formData?.first_name ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.first_name ? 'border-red-500' : ''}`} 
            />
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="last_name" className="text-base">Numéro de téléphone du client</Label>
            <Input 
              id="phone_number" 
              value={formData?.phone_number ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.phone_number ? 'border-red-500' : ''}`} 
            />
            {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="email" className="text-base">Email du client</Label>
            <Input 
              id="email" 
              value={formData?.email ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.email ? 'border-red-500' : ''}`} 
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de début de l'événement</Label>
            <DatePicker
              date={formData?.event_start_date ? parseISO(formData.event_start_date) : undefined}
              onDateChange={handleStartDateChange}
              label="Choisir la date de début"
            />
            {errors.event_start_date && <p className="text-red-500 text-sm mt-1">{errors.event_start_date}</p>}
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de fin de l'événement</Label>
            <DatePicker
              date={formData?.event_end_date ? parseISO(formData.event_end_date) : undefined}
              onDateChange={handleEndDateChange}
              label="Choisir la date de fin"
            />
            {errors.event_end_date && <p className="text-red-500 text-sm mt-1">{errors.event_end_date}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Prix total</Label>
            <Input 
              id="total_cost" 
              type="number"
              step="1"
              min="0"
              value={formData?.total_cost ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.total_cost ? 'border-red-500' : ''}`} 
            />
            {errors.total_cost && <p className="text-red-500 text-sm mt-1">{errors.total_cost}</p>}
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="is_traiteur" className="text-base mb-1">Service traiteur</Label>
              <p className="text-sm text-gray-500">
                {formData?.is_traiteur ? 'Inclus' : 'Non inclus'}
              </p>
            </div>
            <Switch
              id="is_traiteur"
              checked={formData?.is_traiteur ?? false}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          {errors.is_traiteur && <p className="text-red-500 text-sm mt-1">{errors.is_traiteur}</p>}
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description du devis</Label>
            <Textarea id="description" value={formData?.description ?? ''} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label className="text-base">Produits du devis</Label>
            {isQuoteItemsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : quoteItems && quoteItems.length > 0 ? (
              <QuoteItemList 
                items={quoteItems}
                taintedItems={taintedItems}
                editedItems={editedItems}
                onItemTaint={handleItemTaint}
                onItemEdit={handleItemEdit}
                isLoading={isQuoteItemsLoading}
              />
            ) : (
              <p className="text-sm text-gray-500">Aucun produit dans ce devis</p>
            )}
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de création du devis</Label>
            <Input id="created_at" value={formData?.created_at ? new Date(formData.created_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de dernière mise à jour du devis</Label>
            <Input id="last_update" value={formData?.last_update ? new Date(formData.last_update).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
        </div>
      </form>
      <Toaster />
    </>
  )
}