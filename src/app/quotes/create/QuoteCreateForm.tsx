'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Quote, QuoteItem, quoteStatus } from "@/utils/types/quotes"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Toaster, toast } from 'sonner'
import { ChevronLeftIcon, PlusIcon } from "@radix-ui/react-icons"
import { DatePicker } from "../components/date-picker"
import { QuoteItemList } from "../components/quote-item-list"
import { createQuote } from "@/services/quotes"
import { useQuotesContext } from '../context/QuotesContext'
import { format } from 'date-fns'

interface FormErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  event_start_date?: string;
  event_end_date?: string;
  status?: string;
  total_cost?: string;
}

interface TouchedFields {
  first_name: boolean;
  last_name: boolean;
  phone_number: boolean;
  email: boolean;
  event_start_date: boolean;
  event_end_date: boolean;
  status: boolean;
  total_cost: boolean;
}

const initialQuote: Partial<Quote> = {
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
  event_start_date: '',
  event_end_date: '',
  status: 'nouveau',
  total_cost: 0,
  is_traiteur: false,
  description: '',
}

export default function QuoteCreateForm() {
  const router = useRouter()
  const { setShouldRefetch } = useQuotesContext()

  const [formData, setFormData] = useState(initialQuote)
  const [createdItems, setCreatedItems] = useState<QuoteItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [touched, setTouched] = useState<TouchedFields>({
    first_name: false,
    last_name: false,
    phone_number: false,
    email: false,
    event_start_date: false,
    event_end_date: false,
    status: false,
    total_cost: false,
  })

  const handleGoBack = useCallback(() => router.push('/quotes'), [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === 'total_cost') {
      // Only allow numeric input for total_cost
      if (!/^\d*$/.test(value)) return
      // Convert to number or null if empty
      const numValue = value === '' ? null : parseInt(value, 10)
      // @ts-ignore
      setFormData(prev => ({ ...prev, [id]: numValue }))
    } else {
      setFormData(prev => ({ ...prev, [id]: value }))
    }
    setTouched(prev => ({ ...prev, [id]: true }))
  }

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      event_start_date: date ? format(date, 'yyyy-MM-dd') : '' 
    }))
    setTouched(prev => ({ ...prev, event_start_date: true }))
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      event_end_date: date ? format(date, 'yyyy-MM-dd') : '' 
    }))
    setTouched(prev => ({ ...prev, event_end_date: true }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_traiteur: checked }))
    setTouched(prev => ({ ...prev, is_traiteur: true }))
  }

  const handleItemCreate = (newItems: QuoteItem[]) => {
    setCreatedItems(prevItems => {
      const updatedItems = [...prevItems];
      newItems.forEach(newItem => {
        const index = updatedItems.findIndex(item => item.id === newItem.id);
        if (index !== -1) {
          updatedItems[index] = newItem;
        } else {
          updatedItems.push(newItem);
        }
      });
      return updatedItems;
    });
  }

  const handleItemRemove = (itemId: number) => {
    setCreatedItems(prev => prev.filter(item => item.id !== itemId))
  }

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}
    let isValid = false

    if (!formData.first_name && touched.first_name) {
      newErrors.first_name = "Le prénom est obligatoire"
      isValid = false
    }
    if (!formData.last_name && touched.last_name) {
      newErrors.last_name = "Le nom est obligatoire"
      isValid = false
    }
    if (!formData.phone_number && touched.phone_number) {
      newErrors.phone_number = "Le numéro de téléphone est obligatoire"
      isValid = false
    }
    if (!formData.email && touched.email) {
      newErrors.email = "L'email est obligatoire"
      isValid = false
    }
    if (!formData.event_start_date && touched.event_start_date) {
      newErrors.event_start_date = "La date de début de l'événement est obligatoire"
      isValid = false
    }
    if (!formData.event_end_date && touched.event_end_date) {
      newErrors.event_end_date = "La date de fin de l'événement est obligatoire"
      isValid = false
    }
    if (!formData.status && touched.status) {
      newErrors.status = "Le statut est obligatoire"
      isValid = false
    }
    if (formData.total_cost === null || formData.total_cost === undefined || formData.total_cost < 0 && touched.total_cost) {
      newErrors.total_cost = "Le prix total est invalide"
      isValid = false
    }
    if(formData.first_name && formData.last_name && formData.phone_number && formData.email && formData.event_start_date && formData.event_end_date && formData.status && formData.total_cost) {
      isValid = true
    }
    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [formData])

  useEffect(() => {
    validateForm()
  }, [formData, validateForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await createQuote(formData as Quote, createdItems)
      setShouldRefetch(true)
      toast.success('Devis créé avec succès')
      router.push(`/quotes/${result.quote.id}`)
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error('Erreur lors de la création du devis')
    } finally {
      setIsSubmitting(false)
    }
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
              ${isFormValid 
                ? "bg-lime-300 hover:bg-lime-400" 
                : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
              }
            `}
            variant="secondary"
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Label htmlFor="status" className="text-base">Statut du devis</Label>
            <Select
              onValueChange={(value) => handleSelectChange(value, 'status')}
              value={formData.status}
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
              value={formData.last_name} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.last_name ? 'border-red-500' : ''}`} 
            />
            {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="first_name" className="text-base">Prénom du client</Label>
            <Input 
              id="first_name" 
              value={formData.first_name} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.first_name ? 'border-red-500' : ''}`} 
            />
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="phone_number" className="text-base">Numéro de téléphone du client</Label>
            <Input 
              id="phone_number" 
              value={formData.phone_number} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.phone_number ? 'border-red-500' : ''}`} 
            />
            {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="email" className="text-base">Email du client</Label>
            <Input 
              id="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.email ? 'border-red-500' : ''}`} 
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de début de l'événement</Label>
            <DatePicker
              date={formData.event_start_date ? new Date(formData.event_start_date) : undefined}
              onDateChange={handleStartDateChange}
              label="Date de début de l'événement"
            />
            {errors.event_start_date && <p className="text-red-500 text-sm mt-1">{errors.event_start_date}</p>}
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de fin de l'événement</Label>
            <DatePicker
              date={formData.event_end_date ? new Date(formData.event_end_date) : undefined}
              onDateChange={handleEndDateChange}
              label="Date de fin de l'événement"
            />
            {errors.event_end_date && <p className="text-red-500 text-sm mt-1">{errors.event_end_date}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="total_cost" className="text-base">Prix total</Label>
            <Input 
              id="total_cost" 
              type="number"
              value={formData.total_cost ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.total_cost ? 'border-red-500' : ''}`} 
            />
            {errors.total_cost && <p className="text-red-500 text-sm mt-1">{errors.total_cost}</p>}
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="is_traiteur"
              checked={formData.is_traiteur}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="is_traiteur" className="text-base">Service traiteur</Label>
          </div>
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              className="w-full text-base" 
            />
          </div>
          <div className="mb-4">
            <Label className="text-base">Produits du devis</Label>
            <QuoteItemList 
              items={[]}
              taintedItems={new Set()}
              editedItems={new Map()}
              createdItems={createdItems}
              onItemTaint={() => {}}
              onItemEdit={() => {}}
              onItemCreate={handleItemCreate}
              onItemRemove={handleItemRemove}
              isLoading={false}
              quoteId={0}
            />
          </div>
        </div>
      </form>
      <Toaster />
    </>
  )
}