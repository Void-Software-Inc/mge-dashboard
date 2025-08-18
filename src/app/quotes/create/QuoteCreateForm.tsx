'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Address, Quote, QuoteItem, quoteStatus, FEE_TYPES } from "@/utils/types/quotes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from 'sonner';
import { ChevronLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { DatePicker } from "../components/date-picker";
import { QuoteItemList } from "../components/quote-item-list";
import { QuoteFees } from "../components/QuoteFees";
import { createQuote } from "@/services/quotes";
import { getClient } from "@/services/clients";
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

interface QuoteCreateFormProps {
  clientId?: string;
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

export default function QuoteCreateForm({ clientId }: QuoteCreateFormProps) {
  const router = useRouter();
  const { setQuotesShouldRefetch } = useAppContext();
  const searchParams = useSearchParams();
  const clientIdFromUrl = clientId || searchParams.get('client_id');

  const [formData, setFormData] = useState(initialQuote);
  const [createdItems, setCreatedItems] = useState<QuoteItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCostFromItems, setTotalCostFromItems] = useState(0);
  const [isLoadingClient, setIsLoadingClient] = useState(!!clientIdFromUrl);
  const [feesSubtotal, setFeesSubtotal] = useState(0);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [inputErrors, setInputErrors] = useState<Set<string>>(new Set());
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

  // Fetch client data if clientId is provided
  useEffect(() => {
    if (clientIdFromUrl) {
      const fetchClientData = async () => {
        setIsLoadingClient(true);
        try {
          const clientData = await getClient(clientIdFromUrl);
          
          // Parse client name into first and last name
          const nameParts = clientData.name.split(' ');
          const lastName = nameParts.pop() || '';
          const firstName = nameParts.join(' ');
          
          // Create updated form data
          const updatedFormData: Partial<Quote> = {
            ...initialQuote,
            first_name: firstName,
            last_name: lastName,
            phone_number: clientData.phone,
            email: clientData.email || '',
            address: {
              voie: clientData.address || '',
              compl: null,
              cp: clientData.postal_code || '',
              ville: clientData.city || '',
              depart: '',
              pays: 'France'
            }
          };
          
          // Update form data
          setFormData(updatedFormData);
          
          // Mark these fields as touched since they're pre-filled
          setTouched(prev => ({
            ...prev,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: !!clientData.email
          }));
          
        } catch (error) {
          console.error('Error fetching client data:', error);
          toast.error('Erreur lors du chargement des données client');
        } finally {
          setIsLoadingClient(false);
        }
      };
      
      fetchClientData();
    }
  }, [clientIdFromUrl]);

  const handleGoBack = useCallback(() => {
    // If we came from a client page, go back there
    if (clientIdFromUrl) {
      router.push(`/clients/${clientIdFromUrl}`);
    } else {
      router.push('/quotes');
    }
  }, [router, clientIdFromUrl]);

  // Helper function to parse number with both . and , as decimal separators
  const parseFlexibleNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    
    // Replace comma with dot for parsing
    const normalizedValue = value.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to check if a string represents a valid number
  const isValidNumber = (value: string): boolean => {
    if (!value || value.trim() === '') return true; // Empty is valid (will be 0)
    
    const trimmedValue = value.trim();
    
    // Replace comma with dot for parsing
    const normalizedValue = trimmedValue.replace(',', '.');
    
    // Check if the normalized value matches a valid number pattern
    // This regex allows: optional minus, digits, optional decimal point with digits
    const numberPattern = /^-?\d+(\.\d+)?$/;
    
    // First check if it matches the pattern
    if (!numberPattern.test(normalizedValue)) {
      return false;
    }
    
    // Then check if parseFloat gives a valid result
    const parsed = parseFloat(normalizedValue);
    return !isNaN(parsed) && isFinite(parsed);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'traiteur_price_ttc' || id === 'other_expenses_ttc') {
      // Update input errors state
      const newErrors = new Set(inputErrors);
      if (!isValidNumber(value)) {
        newErrors.add(id);
      } else {
        newErrors.delete(id);
      }
      setInputErrors(newErrors);
      
      // Convert TTC to HT and store HT value
      const ttcValue = parseFlexibleNumber(value);
      const htValue = ttcValue / 1.20;
      const fieldName = id === 'traiteur_price_ttc' ? 'traiteur_price' : 'other_expenses';
      setFormData(prev => ({
        ...prev,
        [fieldName]: htValue,
        [`${id}_input`]: value // Store raw input for display
      }));
    } else if (id === 'traiteur_price' || id === 'other_expenses') {
      // Update input errors state
      const newErrors = new Set(inputErrors);
      if (!isValidNumber(value)) {
        newErrors.add(id);
      } else {
        newErrors.delete(id);
      }
      setInputErrors(newErrors);
      
      const numValue = parseFlexibleNumber(value);
      setFormData(prev => ({
        ...prev,
        [id]: numValue,
        [`${id}_input`]: value // Store raw input for display
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
          ? calculateTTC(prevData.total_cost) * 0.3
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

  // Calculate TTC to HT conversion helper
  const calculateTTC = (ht: number | undefined): number => {
    return ht !== undefined ? ht * 1.20 : 0;
  };

  // Update the total cost calculation to properly include all components
  useEffect(() => {
    if (!formData) return;
    
    // Quote items are calculated as TTC from the QuoteItemList, so we need to convert to HT
    const quoteItemsHT = totalCostFromItems / 1.20;
    
    // Additional traiteur price (stored as HT)
    const additionalTraiteurHT = formData.is_traiteur ? (formData.traiteur_price || 0) : 0;
    
    // Other expenses (stored as HT)
    const otherExpensesHT = formData.other_expenses || 0;
    
    // Fees (stored as HT)
    const feesHT = formData.fees?.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0) || 0;
    
    // Calculate total HT
    const newTotalCostHT = Number((quoteItemsHT + additionalTraiteurHT + otherExpensesHT + feesHT).toFixed(2));
    
    if (formData.total_cost !== newTotalCostHT) {
      setFormData(prev => ({
        ...prev,
        total_cost: newTotalCostHT
      }));
    }
  }, [
    totalCostFromItems,
    formData?.is_traiteur,
    formData?.traiteur_price, 
    formData?.other_expenses,
    formData?.fees
  ]);

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
    if (!isFormValid || !formData) return;

    const formDataToSend = new FormData();
    
    // Initialize fees array
    const initialFees = FEE_TYPES.map(feeType => ({
      name: feeType.name,
      price: 0,
      enabled: false,
      description: feeType.description
    }));

    // Append all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'address' && value) {
        Object.entries(value).forEach(([addressKey, addressValue]) => {
          formDataToSend.append(`address.${addressKey}`, addressValue?.toString() ?? '');
        });
      } else if (key === 'fees') {
        formDataToSend.append('fees', JSON.stringify(initialFees));
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(key, value.toString());
      }
    });

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
            disabled={!isFormValid || isSubmitting || isLoadingClient}
            onClick={handleSubmit}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Création...' : isLoadingClient ? 'Chargement...' : clientIdFromUrl ? 'Créer un devis pour ce client' : 'Créer'}
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-5xl">
          {clientIdFromUrl && (
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-700">Création d'un devis pour le client existant</p>
            </div>
          )}

          {/* Enhanced Client Information Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Informations Client</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="text-base font-medium mb-3 text-gray-700">Coordonnées</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="last_name" className="text-sm text-gray-600">Nom</Label>
                    <Input 
                      id="last_name" 
                      value={formData.last_name} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.last_name ? 'border-red-500' : ''}`} 
                    />
                    {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="first_name" className="text-sm text-gray-600">Prénom</Label>
                    <Input 
                      id="first_name" 
                      value={formData.first_name} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.first_name ? 'border-red-500' : ''}`} 
                    />
                    {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone_number" className="text-sm text-gray-600">Téléphone</Label>
                    <Input 
                      id="phone_number" 
                      value={formData.phone_number} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.phone_number ? 'border-red-500' : ''}`} 
                    />
                    {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                    <Input 
                      id="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.email ? 'border-red-500' : ''}`} 
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="text-base font-medium mb-3 text-gray-700">Adresse</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voie" className="text-sm text-gray-600">Voie</Label>
                    <Input 
                      id="voie" 
                      value={formData.address?.voie ?? ''} 
                      onChange={(e) => handleAddressChange('voie', e.target.value)} 
                      className="w-full mt-1" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="compl" className="text-sm text-gray-600">Complément d'adresse</Label>
                    <Input 
                      id="compl" 
                      value={formData.address?.compl ?? ''} 
                      onChange={(e) => handleAddressChange('compl', e.target.value)} 
                      className="w-full mt-1" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cp" className="text-sm text-gray-600">Code Postal</Label>
                      <Input 
                        id="cp" 
                        value={formData.address?.cp ?? ''} 
                        onChange={(e) => handleAddressChange('cp', e.target.value)} 
                        className="w-full mt-1" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ville" className="text-sm text-gray-600">Ville</Label>
                      <Input 
                        id="ville" 
                        value={formData.address?.ville ?? ''} 
                        onChange={(e) => handleAddressChange('ville', e.target.value)} 
                        className="w-full mt-1" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="depart" className="text-sm text-gray-600">Département</Label>
                      <Input 
                        id="depart" 
                        value={formData.address?.depart ?? ''} 
                        onChange={(e) => handleAddressChange('depart', e.target.value)} 
                        className="w-full mt-1" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pays" className="text-sm text-gray-600">Pays</Label>
                      <Input 
                        id="pays" 
                        value={formData.address?.pays ?? 'France'} 
                        onChange={(e) => handleAddressChange('pays', e.target.value)} 
                        className="w-full mt-1 bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Event Information Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Événement</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="text-base font-medium mb-3 text-gray-700">Date de début</h4>
                <DatePicker
                  date={formData.event_start_date ? new Date(formData.event_start_date) : undefined}
                  onDateChange={handleStartDateChange}
                  label="Choisir la date de début"
                />
                {errors.event_start_date && <p className="text-red-500 text-sm mt-1">{errors.event_start_date}</p>}
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="text-base font-medium mb-3 text-gray-700">Date de fin</h4>
                <DatePicker
                  date={formData.event_end_date ? new Date(formData.event_end_date) : undefined}
                  onDateChange={handleEndDateChange}
                  label="Choisir la date de fin"
                />
                {errors.event_end_date && <p className="text-red-500 text-sm mt-1">{errors.event_end_date}</p>}
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <h4 className="text-base font-medium mb-3 text-gray-700">Description</h4>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                className="w-full text-base min-h-[120px]" 
                placeholder="Description détaillée de l'événement..."
              />
            </div>
          </div>

          {/* Enhanced Products Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Produits du devis</h3>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
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
                onTotalCostChange={handleTotalCostChange}
                disabled={!!formData?.is_deposit || !!formData?.is_paid}
              />
            </div>
          </div>

          {/* Options supplémentaires Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Options supplémentaires</h3>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="is_traiteur"
                  checked={formData?.is_traiteur ?? false}
                  onCheckedChange={() => handleSwitchChange('is_traiteur')}
                  disabled={formData?.is_paid || formData?.is_deposit}
                />
                <Label htmlFor="is_traiteur" className="text-base">Service traiteur supplémentaire</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="traiteur_price_ttc" className="text-sm text-gray-600">Prix traiteur TTC</Label>
                  <Input 
                    id="traiteur_price_ttc" 
                    value={(formData as any)?.traiteur_price_ttc_input !== undefined ? (formData as any).traiteur_price_ttc_input : (formData?.is_traiteur && formData?.traiteur_price ? (formData.traiteur_price * 1.20).toFixed(2) : '')}
                    onChange={handleInputChange} 
                    className={`w-full text-base mt-1 ${errors.traiteur_price ? 'border-red-500' : ''} ${inputErrors.has('traiteur_price_ttc') ? 'border-red-500' : ''}`} 
                    disabled={!formData?.is_traiteur || formData?.is_paid || formData?.is_deposit}
                    placeholder="0.00"
                  />
                  {errors.traiteur_price && <p className="text-red-500 text-sm mt-1">{errors.traiteur_price}</p>}
                </div>
                
                <div>
                  <Label htmlFor="traiteur_price_ht" className="text-sm text-gray-600">Prix traiteur HT (calculé)</Label>
                  <Input 
                    id="traiteur_price_ht" 
                    type="number"
                    value={formData?.is_traiteur ? (formData?.traiteur_price || 0).toFixed(2) : ''} 
                    className="w-full text-base mt-1 bg-gray-100" 
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Frais additionnels Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <QuoteFees
              quoteId={0}
              disabled={formData?.is_paid || formData?.is_deposit}
              fees={formData?.fees || []}
              onFeesChange={(updatedFees) => {
                setFormData(prev => ({
                  ...prev,
                  fees: updatedFees
                }));
              }}
              onFeesSubtotalChange={setFeesSubtotal}
            />
          </div>

          {/* Détails du prix - Last section before payment */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Détails du prix</h3>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="decoration_subtotal_ht" className="text-sm text-gray-600">Sous-total meubles et décoration HT</Label>
                  <Input 
                    id="decoration_subtotal_ht" 
                    type="number"
                    value={(totalCostFromItems / 1.20).toFixed(2)}
                    className="w-full text-base font-semibold disabled:opacity-100 disabled:text-gray-600" 
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="decoration_subtotal_ttc" className="text-sm text-gray-600">Sous-total meubles et décoration TTC</Label>
                  <Input 
                    id="decoration_subtotal_ttc" 
                    type="number"
                    value={totalCostFromItems.toFixed(2)}
                    className="w-full text-base font-semibold disabled:text-gray-600 disabled:opacity-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="additional_traiteur_ht" className="text-sm text-gray-600">Service traiteur supplémentaire HT</Label>
                  <Input 
                    id="additional_traiteur_ht" 
                    type="number"
                    value={formData?.is_traiteur ? (formData?.traiteur_price || 0).toFixed(2) : '0.00'}
                    className="w-full text-base font-semibold disabled:text-gray-600 disabled:opacity-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="additional_traiteur_ttc" className="text-sm text-gray-600">Service traiteur supplémentaire TTC</Label>
                  <Input 
                    id="additional_traiteur_ttc" 
                    type="number"
                    value={formData?.is_traiteur ? ((formData?.traiteur_price || 0) * 1.20).toFixed(2) : '0.00'}
                    className="w-full text-base font-semibold disabled:text-gray-600 disabled:opacity-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="fees_subtotal_ht" className="text-sm text-gray-600">Frais additionnels HT</Label>
                  <Input 
                    id="fees_subtotal_ht" 
                    type="number"
                    value={(formData?.fees?.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0) || 0).toFixed(2)}
                    className="w-full text-base font-semibold disabled:text-gray-600 disabled:opacity-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="fees_subtotal_ttc" className="text-sm text-gray-600">Frais additionnels TTC</Label>
                  <Input 
                    id="fees_subtotal_ttc" 
                    type="number"
                    value={((formData?.fees?.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0) || 0) * 1.20).toFixed(2)}
                    className="w-full text-base font-semibold disabled:text-gray-600 disabled:opacity-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="total_cost" className="text-sm text-gray-600">Prix total HT</Label>
                  <Input 
                    id="total_cost" 
                    type="number"
                    step="1"
                    min="0"
                    value={(formData.total_cost || 0).toFixed(2)} 
                    className="w-full text-base font-semibold disabled:text-gray-600 disabled:opacity-100" 
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="tva_amount" className="text-sm text-gray-600">TVA (20%)</Label>
                  <Input 
                    id="tva_amount" 
                    type="number"
                    value={formData.total_cost ? (formData.total_cost * 0.2).toFixed(2) : '0.00'} 
                    className="w-full text-base font-semibold disabled:opacity-100 disabled:text-gray-600" 
                    disabled
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="total_cost_ttc" className="text-sm text-gray-800 font-bold">Prix total TTC</Label>
                  <Input 
                    id="total_cost_ttc" 
                    type="number"
                    value={formData.total_cost ? calculateTTC(formData.total_cost).toFixed(2) : ''} 
                    className="w-full text-base font-semibold bg-white border-lime-400 disabled:text-gray-800 disabled:opacity-100" 
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Prix et Paiement Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Acompte versé, modes de paiement et payé intégralement</h3>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_deposit"
                    checked={formData?.is_deposit ?? false}
                    onCheckedChange={() => handleDepositChange('is_deposit')}
                    className="data-[state=checked]:bg-lime-500"
                  />
                  <Label htmlFor="is_deposit" className="text-base font-medium">Acompte versé</Label>
                </div>
                <div className="text-sm text-gray-500">
                  {formData?.is_deposit ? "Acompte payé" : "Acompte non payé"}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="deposit_amount" className="text-sm text-gray-600">Montant de l'acompte TTC</Label>
                  <Input 
                    id="deposit_amount" 
                    type="number"
                    value={formData?.is_deposit && formData.total_cost ? (formData.total_cost * 1.2 * 0.3).toFixed(2) : '0.00'} 
                    className={`w-full text-base font-semibold ${formData?.is_deposit ? 'bg-lime-50 border-lime-200' : 'bg-gray-100'}`}
                    disabled
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Montant restant à payer TTC</Label>
                  <Input 
                    type="number"
                    value={formData.total_cost ? (
                      formData.is_paid 
                        ? "0.00"
                        : formData.is_deposit
                          ? (formData.total_cost * 1.2 * 0.7).toFixed(2)
                          : (formData.total_cost * 1.2).toFixed(2)
                    ) : '0.00'} 
                    className="w-full text-base font-semibold bg-gray-100"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_paid"
                    checked={formData.is_paid}
                    onCheckedChange={() => handleSwitchChange('is_paid')}
                    className="data-[state=checked]:bg-lime-500"
                  />
                  <Label htmlFor="is_paid" className="text-base font-medium">Payé intégralement</Label>
                </div>
                {formData.is_paid && (
                  <div className="px-3 py-1 bg-lime-100 text-lime-800 text-sm font-medium rounded-full">
                    Payé
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
      <Toaster />
    </>
  );
}
