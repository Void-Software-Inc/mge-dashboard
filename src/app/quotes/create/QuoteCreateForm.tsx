'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Address, Quote, QuoteItem, quoteStatus } from "@/utils/types/quotes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from 'sonner';
import { ChevronLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { DatePicker } from "../components/date-picker";
import { QuoteItemList } from "../components/quote-item-list";
import { createQuote } from "@/services/quotes";
import { useAppContext } from "@/app/context/AppContext";
import { format } from 'date-fns';

interface FormErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  event_start_date?: string;
  event_end_date?: string;
  status?: string;
  total_cost?: string;
  traiteur_price?: string;
  other_expenses?: string;
  deposit_amount?: string;
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
  traiteur_price: boolean;
  other_expenses: boolean;
  deposit_amount: boolean;
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
  traiteur_price: 0,
  other_expenses: 0,
  is_paid: false,
  is_deposit: false,
  address: {
    voie: '',
    compl: null,
    cp: '',
    ville: '',
    depart: '',
    pays: 'France'
  }
};

export default function QuoteCreateForm() {
  const router = useRouter();
  const { setQuotesShouldRefetch } = useAppContext();

  const [formData, setFormData] = useState(initialQuote);
  const [createdItems, setCreatedItems] = useState<QuoteItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCostFromItems, setTotalCostFromItems] = useState(0);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    first_name: false,
    last_name: false,
    phone_number: false,
    email: false,
    event_start_date: false,
    event_end_date: false,
    status: false,
    total_cost: false,
    traiteur_price: false,
    other_expenses: false,
    deposit_amount: false,
  });

  const handleGoBack = useCallback(() => router.push('/quotes'), [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'traiteur_price' || id === 'other_expenses') {
      // Allow decimal numbers for traiteur_price and other_expenses
      if (!/^\d*\.?\d*$/.test(value)) return;
      const numValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [id]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
    setTouched(prev => ({ ...prev, [id]: true }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      event_start_date: date ? format(date, 'yyyy-MM-dd') : '' 
    }));
    setTouched(prev => ({ ...prev, event_start_date: true }));
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      event_end_date: date ? format(date, 'yyyy-MM-dd') : '' 
    }));
    setTouched(prev => ({ ...prev, event_end_date: true }));
  };
  const handleSwitchChange = (id: string) => {
    setFormData((prevData) => {
      if (!prevData) return prevData;
      if (id === 'is_traiteur') {
        const newIsTrateur = !prevData.is_traiteur;
        return {
          ...prevData,
          is_traiteur: newIsTrateur,
          traiteur_price: newIsTrateur ? prevData.traiteur_price : 0
        };
      } else if (id === 'is_paid') {
        return {
          ...prevData,
          is_paid: !prevData.is_paid
        };
      }
      return prevData;
    });
  };

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
  };

  const handleItemRemove = (itemId: number) => {
    setCreatedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleTotalCostChange = useCallback((totalCost: number) => {
    setTotalCostFromItems(totalCost);
  }, []);

  const handleDepositChange = (id: string) => {
    setFormData((prevData) => {
      if (!prevData) return prevData;
      const newIsDeposit = !prevData.is_deposit;
      return {
        ...prevData,
        is_deposit: newIsDeposit,
        deposit_amount: newIsDeposit && prevData.total_cost 
          ? prevData.total_cost * 0.3
          : 0
      };
    });
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        address: {
          voie: prev.address?.voie ?? '',
          compl: prev.address?.compl ?? null,
          cp: prev.address?.cp ?? '',
          ville: prev.address?.ville ?? '',
          depart: prev.address?.depart ?? '',
          pays: prev.address?.pays ?? '',
          [field]: value
        }
      };
    });
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_cost: totalCostFromItems + (prev.traiteur_price ?? 0) + (prev.other_expenses ?? 0)
    }));
  }, [totalCostFromItems, formData.traiteur_price, formData.other_expenses]);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    let isValid = false;

    if (!formData.first_name && touched.first_name) {
      newErrors.first_name = "Le prénom est obligatoire";
      isValid = false;
    }
    if (!formData.last_name && touched.last_name) {
      newErrors.last_name = "Le nom est obligatoire";
      isValid = false;
    }
    if (!formData.phone_number && touched.phone_number) {
      newErrors.phone_number = "Le numéro de téléphone est obligatoire";
      isValid = false;
    }
    if (!formData.email && touched.email) {
      newErrors.email = "L'email est obligatoire";
      isValid = false;
    }
    if (!formData.event_start_date && touched.event_start_date) {
      newErrors.event_start_date = "La date de début de l'événement est obligatoire";
      isValid = false;
    }
    if (!formData.event_end_date && touched.event_end_date) {
      newErrors.event_end_date = "La date de fin de l'événement est obligatoire";
      isValid = false;
    }
    if (!formData.status && touched.status) {
      newErrors.status = "Le statut est obligatoire";
      isValid = false;
    }
    if (formData.total_cost === null || formData.total_cost === undefined || formData.total_cost < 0 && touched.total_cost) {
      newErrors.total_cost = "Le prix total est invalide";
      isValid = false;
    }
    if (formData.traiteur_price === null || formData.traiteur_price === undefined || formData.traiteur_price < 0 && touched.traiteur_price) {
      newErrors.traiteur_price = "Le prix du traiteur est invalide";
      isValid = false;
    }
    if (formData.other_expenses === null || formData.other_expenses === undefined || formData.other_expenses < 0 && touched.other_expenses) {
      newErrors.other_expenses = "Les frais additionnels sont invalides";
      isValid = false;
    }
    if(formData.first_name && formData.last_name && formData.phone_number && formData.email && formData.event_start_date && formData.event_end_date && formData.status && formData.total_cost) {
      isValid = true;
    }
    setErrors(newErrors);
    setIsFormValid(isValid);
    return isValid;
  }, [formData, touched]);

  useEffect(() => {
    validateForm();
  }, [formData, validateForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createQuote(formData as Quote, createdItems);
      setQuotesShouldRefetch(true);
      toast.success('Devis créé avec succès');
      router.push(`/quotes/${result.quote.id}`);
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Erreur lors de la création du devis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuoteStatus = quoteStatus.filter(status => status.value !== 'termine');

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
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0 mb-40">
        <div className="w-full max-w-5xl">
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
                {filteredQuoteStatus.map((status) => (
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
            <Label className="text-base">Adresse</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="voie" className="text-sm">Voie</Label>
                <Input 
                  id="voie" 
                  value={formData.address?.voie ?? ''} 
                  onChange={(e) => handleAddressChange('voie', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="compl" className="text-sm">Complément d'adresse</Label>
                <Input 
                  id="compl" 
                  value={formData.address?.compl ?? ''} 
                  onChange={(e) => handleAddressChange('compl', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="cp" className="text-sm">Code Postal</Label>
                <Input 
                  id="cp" 
                  value={formData.address?.cp ?? ''} 
                  onChange={(e) => handleAddressChange('cp', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="ville" className="text-sm">Ville</Label>
                <Input 
                  id="ville" 
                  value={formData.address?.ville ?? ''} 
                  onChange={(e) => handleAddressChange('ville', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="depart" className="text-sm">Département</Label>
                <Input 
                  id="depart" 
                  value={formData.address?.depart ?? ''} 
                  onChange={(e) => handleAddressChange('depart', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="pays" className="text-sm">Pays</Label>
                <Input 
                  id="pays" 
                  value={formData.address?.pays ?? 'France'} 
                  onChange={(e) => handleAddressChange('pays', e.target.value)} 
                  className="w-full text-base"
                  disabled
                />
              </div>
            </div>
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
              onTotalCostChange={handleTotalCostChange} // Pass the callback
              disabled={!!formData?.is_deposit || !!formData?.is_paid}
            />
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="is_traiteur"
              checked={formData.is_traiteur}
              onCheckedChange={() => handleSwitchChange('is_traiteur')}
              disabled={!!formData?.is_deposit || !!formData?.is_paid}
            />
            <Label htmlFor="is_traiteur" className="text-base">Service traiteur</Label>
          </div>
          <div className="mb-4">
            <Label htmlFor="traiteur_price" className="text-base">Prix traiteur</Label>
            <Input 
              id="traiteur_price" 
              type="number"
              value={formData.traiteur_price ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.traiteur_price ? 'border-red-500' : ''}`} 
              disabled={!formData?.is_traiteur || formData?.is_paid || formData?.is_deposit}
            />
            {errors.traiteur_price && <p className="text-red-500 text-sm mt-1">{errors.traiteur_price}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="other_expenses" className="text-base">Autres charges</Label>
            <Input 
              id="other_expenses" 
              type="number"
              value={formData.other_expenses ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.other_expenses ? 'border-red-500' : ''}`}
              disabled={formData?.is_paid || formData?.is_deposit}
            />
            {errors.other_expenses && <p className="text-red-500 text-sm mt-1">{errors.other_expenses}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="total_cost" className="text-base">Prix total</Label>
            <Input 
              id="total_cost" 
              type="number"
              value={formData.total_cost ?? ''} 
              className="w-full text-base" 
              disabled
            />
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="is_deposit"
              checked={formData?.is_deposit ?? false}
              onCheckedChange={() => handleDepositChange('is_deposit')}
            />
            <Label htmlFor="is_deposit" className="text-base">Acompte versé (30%)</Label>
          </div>
          {formData?.is_deposit && (
            <div className="mb-4">
              <Label htmlFor="deposit_amount" className="text-base">Montant de l'acompte</Label>
              <Input 
                id="deposit_amount" 
                type="number"
                value={formData?.deposit_amount ?? ''} 
                className="w-full text-base"
                disabled
              />
            </div>
          )}
          <div className="mb-4">
            <Label className="text-base">Montant restant à payer</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData ? (
                formData.is_paid 
                  ? "0.00"
                  : formData.is_deposit && formData.total_cost !== undefined && formData.deposit_amount !== undefined
                    ? (formData.total_cost - formData.deposit_amount).toFixed(2)
                    : formData.total_cost?.toFixed(2) ?? ''
              ) : ''} 
              className="w-full text-base"
              disabled
            />
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="is_paid"
              checked={formData.is_paid}
              onCheckedChange={() => handleSwitchChange('is_paid')}
            />
            <Label htmlFor="is_paid" className="text-base">Payé</Label>
          </div>
        </div>
      </form>
      <Toaster />
    </>
  );
}