'use client'

import { useCallback, useEffect, useState } from 'react'

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Toaster, toast } from 'sonner'
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ChevronLeftIcon, DownloadIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons"
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { isEqual as lodashEqual } from 'lodash';

import { useRouter } from 'next/navigation'
import { useAppContext } from "@/app/context/AppContext"
import { getQuote, getQuoteItems, updateQuote, deleteQuoteItem, finishQuote, updateQuoteItem, createQuoteItem } from "@/services/quotes"
import { Quote, quoteStatus, QuoteItem, Address, PaymentMode, paymentModes, QuotePayment } from "@/utils/types/quotes"
import { DatePicker } from "../components/date-picker"
import { QuoteItemList } from "../components/quote-item-list"
import { format, parseISO } from 'date-fns';
import { Product } from "@/utils/types/products"
import { getProducts } from "@/services/products"
import { generateQuotePDF } from "@/utils/pdf/generateDocumentPDF"
import { QuoteFees } from "../components/QuoteFees"

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
  traiteur_price?: string;
  other_expenses?: string;
  deposit_amount?: string;
  deposit_percentage?: string;
  address?: {
    voie?: string;
    compl?: string;
    cp?: string;
    ville?: string;
    depart?: string;
    pays?: string;
  };
  payments?: { mode?: string; amount?: string }[];
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
  const [createdItems, setCreatedItems] = useState<QuoteItem[]>([]);
  const [feesToDelete, setFeesToDelete] = useState<Set<string>>(new Set());

  const [isChanged, setIsChanged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setQuotesShouldRefetch, setFinishedQuotesShouldRefetch } = useAppContext()
  const [totalCostFromItems, setTotalCostFromItems] = useState(0);

  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  const [feesSubtotal, setFeesSubtotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsProductsLoading(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
        
        // Fix the total_cost rounding issue by ensuring both copies have exactly the same values
        // Round all numeric values to 2 decimal places for consistency
        const normalizedQuote = {
          ...fetchedQuote,
          total_cost: Number(parseFloat(fetchedQuote.total_cost?.toString() || '0').toFixed(2)),
          traiteur_price: Number(parseFloat(fetchedQuote.traiteur_price?.toString() || '0').toFixed(2)),
          other_expenses: Number(parseFloat(fetchedQuote.other_expenses?.toString() || '0').toFixed(2)),
          deposit_amount: Number(parseFloat(fetchedQuote.deposit_amount?.toString() || '0').toFixed(2)),
          deposit_percentage: Number(parseFloat(fetchedQuote.deposit_percentage?.toString() || '0').toFixed(2)),
          is_paid: !!fetchedQuote.is_paid,
          is_deposit: !!fetchedQuote.is_deposit,
          is_traiteur: !!fetchedQuote.is_traiteur,
          payments: (fetchedQuote.payments || []).map(payment => ({
            mode: payment.mode || '',
            amount: payment.amount !== null && payment.amount !== undefined 
              ? Number(parseFloat(payment.amount.toString()).toFixed(2)) 
              : null
          }))
        };

        // Set both state variables to separate but identical objects
        const quoteObj = JSON.parse(JSON.stringify(normalizedQuote));
        const formDataObj = JSON.parse(JSON.stringify(normalizedQuote));
        
        setQuote(quoteObj);
        setFormData(formDataObj);
        
        // Force isChanged to false since we've normalized everything
        setIsChanged(false);
        
        // Calculate the total cost from items based on normalized values
        const traiteurPrice = Number(parseFloat(fetchedQuote.traiteur_price?.toString() || '0').toFixed(2));
        const otherExpenses = Number(parseFloat(fetchedQuote.other_expenses?.toString() || '0').toFixed(2));
        const totalCost = Number(parseFloat(fetchedQuote.total_cost?.toString() || '0').toFixed(2));
        
        setTotalCostFromItems(totalCost - traiteurPrice - otherExpenses);
        
        await fetchQuoteItems();
      } catch (error) {
        console.error('Error fetching quote:', error);
        toast.error('Failed to load quote');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuote();
  }, [quoteId, fetchQuoteItems]);

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
    if (formData?.total_cost !== undefined && (formData.total_cost === null || formData.total_cost < 0)) {
      newErrors.total_cost = "Le prix total est invalide";
      isValid = false;
    }
    if (formData?.traiteur_price !== undefined && (formData.traiteur_price === null || formData.traiteur_price < 0)) {
      newErrors.traiteur_price = "Le prix du traiteur est invalide";
      isValid = false;
    }
    if (formData?.other_expenses !== undefined && (formData.other_expenses === null || formData.other_expenses < 0)) {
      newErrors.other_expenses = "Les frais additionnels sont invalides";
      isValid = false;
    }
    if (formData?.deposit_amount !== undefined && (formData.deposit_amount === null || formData.deposit_amount < 0)) {
      newErrors.deposit_amount = "Le montant de l'acompte est invalide";
      isValid = false;
    }
    if (formData?.deposit_percentage !== undefined && (formData.deposit_percentage === null || formData.deposit_percentage < 0 || formData.deposit_percentage > 100)) {
      newErrors.deposit_percentage = "Le pourcentage de l'acompte doit être entre 0 et 100";
      isValid = false;
    }

    if (formData?.payments) {
      const paymentErrors: { mode?: string; amount?: string }[] = [];
      let hasPaymentError = false;

      formData.payments.forEach((payment, index) => {
        const error: { mode?: string; amount?: string } = {};
        
        if (payment.mode || payment.amount !== null) {
          if (!payment.mode) {
            error.mode = "Le mode de paiement est requis";
            hasPaymentError = true;
          }
          if (payment.amount === null || Number(payment.amount) <= 0) {
            error.amount = "Le montant doit être supérieur à 0";
            hasPaymentError = true;
          }
        }
        
        paymentErrors[index] = error;
      });

      if (hasPaymentError) {
        newErrors.payments = paymentErrors;
        isValid = false;
      }
    }

    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [formData])

  useEffect(() => {

    const cleanObject = (obj: any) => {
      if (!obj) return obj;
      const cleaned = { ...obj };
      
      // Remove properties that shouldn't affect the comparison
      delete cleaned.last_update;
      delete cleaned.created_at;
      
      // Handle numeric values properly - treat null, undefined, and 0 consistently
      // and ensure consistent decimal places
      const handleNumeric = (value: any): number => {
        if (value === null || value === undefined) return 0;
        return Number(Number(value).toFixed(2));
      };
      
      cleaned.total_cost = handleNumeric(cleaned.total_cost);
      cleaned.traiteur_price = handleNumeric(cleaned.traiteur_price);
      cleaned.other_expenses = handleNumeric(cleaned.other_expenses);
      cleaned.deposit_amount = handleNumeric(cleaned.deposit_amount);
      cleaned.deposit_percentage = handleNumeric(cleaned.deposit_percentage);
      
      // Ensure consistent boolean values
      cleaned.is_paid = !!cleaned.is_paid;
      cleaned.is_deposit = !!cleaned.is_deposit;
      cleaned.is_traiteur = !!cleaned.is_traiteur;

      // Ensure payments array is consistent
      if (cleaned.payments) {
        cleaned.payments = cleaned.payments.map((payment: { mode?: string; amount?: number | null }) => ({
          mode: payment.mode || '',
          amount: payment.amount !== null && payment.amount !== undefined ? Number(Number(payment.amount).toFixed(2)) : 0
        }));
      } else {
        cleaned.payments = [];
      }
      
      return cleaned;
    };

    const compareObjects = (obj1: any, obj2: any) => {
      const cleanedObj1 = cleanObject(obj1);
      const cleanedObj2 = cleanObject(obj2);
      
      const areEqual = lodashEqual(cleanedObj1, cleanedObj2);
      
      return areEqual;
    };

    // Always start with assuming no changes unless proven otherwise
    let hasChanges = false;
    
    // Only compare if both objects exist and are fully loaded
    if (formData && quote && Object.keys(formData).length > 0 && Object.keys(quote).length > 0) {
      hasChanges = !compareObjects(formData, quote);
    }

    // Add check for quote item changes only if we haven't already detected changes
    if (!hasChanges) {
      hasChanges = taintedItems.size > 0 || editedItems.size > 0 || createdItems.length > 0;
    }

    // Only update the state if the value has changed
    if (isChanged !== hasChanges) {
      setIsChanged(hasChanges);
    }
    
    validateForm();
  }, [formData, quote, validateForm, taintedItems, editedItems, createdItems]);

  useEffect(() => {
    if (createdItems.length > 0 || taintedItems.size > 0 || editedItems.size > 0) {
      setShouldReloadItems(true);
    } else {
      setShouldReloadItems(false);
    }
  }, [taintedItems, editedItems, createdItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === 'traiteur_price' || id === 'other_expenses') {
      // Allow decimal numbers for traiteur_price and other_expenses
      if (!/^\d*\.?\d*$/.test(value)) return
      // Convert to number or null if empty
      const numValue = value === '' ? null : parseFloat(value)
      setFormData(prev => prev ? { ...prev, [id]: numValue } : null)
    } else {
      setFormData(prev => prev ? { ...prev, [id]: value } : null)
    }
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => prev ? { ...prev, [id]: value } : null)
  }

  const handleSwitchChange = (id: string) => {
    setFormData((prevData) => {
      if (!prevData) return null;
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
    setIsChanged(true);
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
      } else {
        newSet.add(itemId);
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
      } else {
        newMap.delete(itemId);
      }
      return newMap;
    });
  };

  const handleItemCreate = (newItems: QuoteItem[]) => {
    setCreatedItems(prevItems => {
      const updatedItems = [...prevItems];
      newItems.forEach(newItem => {
        const index = updatedItems.findIndex(item => item.id === newItem.id);
        if (index !== -1) {
          // Update existing created item
          updatedItems[index] = newItem;
        } else {
          // Add new created item
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
      if (!prevData) return null;
      const newIsDeposit = !prevData.is_deposit;
      
      // Keep the current percentage or use a default of 30 if none exists
      const currentPercentage = prevData.deposit_percentage !== undefined && prevData.deposit_percentage !== null
        ? prevData.deposit_percentage
        : 30;
      
      return {
        ...prevData,
        is_deposit: newIsDeposit,
        deposit_percentage: currentPercentage,
        deposit_amount: newIsDeposit && prevData.total_cost 
          ? calculateTTC(prevData.total_cost) * (currentPercentage / 100)
          : 0
      };
    });
    setIsChanged(true);
  };

  const handleDepositPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Convert to number only if there's a value
      const percentage = value === '' ? 0 : Math.min(100, parseFloat(value));
      
      setFormData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          deposit_percentage: percentage,
          deposit_amount: prev.total_cost 
            ? calculateTTC(prev.total_cost) * (percentage / 100)
            : prev.deposit_amount
        };
      });
    }
  };

  // Add a useEffect to calculate deposit amount when form loads
  useEffect(() => {
    if (formData && formData.total_cost && formData.deposit_percentage) {
      // Calculate deposit amount based on percentage, even if deposit isn't paid yet
      const calculatedAmount = calculateTTC(formData.total_cost) * (formData.deposit_percentage / 100);
      
      // Only update if the calculated amount is different from current amount
      if (calculatedAmount !== formData.deposit_amount) {
        setFormData(prev => prev ? {
          ...prev,
          deposit_amount: formData.is_deposit ? calculatedAmount : 0
        } : null);
      }
    }
  }, [formData?.total_cost, formData?.deposit_percentage, formData?.is_deposit]);

  //watches for any changes on total price, if it changes, it resets the deposit to false and amount to 0
  useEffect(() => {
    if (formData && quote && (
      formData.is_traiteur !== quote.is_traiteur ||
      formData.traiteur_price !== quote.traiteur_price ||
      formData.other_expenses !== quote.other_expenses
    )) {
      setFormData(prev => prev ? ({
        ...prev,
        is_deposit: false,
        deposit_amount: 0
      }) : null);
    }
  }, [
    formData?.is_traiteur,
    quote?.is_traiteur,
    formData?.traiteur_price,
    quote?.traiteur_price,
    formData?.other_expenses,
    quote?.other_expenses
  ]);

  const calculateSubtotal = (category: string, includeTax: boolean = false) => {
    if (!quoteItems || !products) return '0.00';
    
    // Get all product IDs for the given category
    const categoryProductIds = products
      .filter(product => product.category === category)
      .map(product => product.id);
    
    // Filter quote items by product_id
    const filteredItems = quoteItems.filter(item => 
      categoryProductIds.includes(item.product_id)
    );
    
    if (filteredItems.length === 0) return '0.00';
    
    // Calculate total using product price from products array
    const total = filteredItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + ((product?.price || 0) * item.quantity);
    }, 0);
    
    return includeTax ? (total * 1.2).toFixed(2) : total.toFixed(2);
  };

  // Update the total cost calculation to include fees
  useEffect(() => {
    if (!formData) return;
    
    const decorationTotal = parseFloat(calculateSubtotal('decoration'));
    const traiteurTotal = parseFloat(calculateSubtotal('traiteur'));
    const feesTotal = formData.fees?.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0) || 0;
    
    const newTotalCost = Number((decorationTotal + traiteurTotal + feesTotal).toFixed(2));

    
    if (formData.total_cost !== newTotalCost) {
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total_cost: newTotalCost
        };
      });
      
      // Also update the quote to keep them in sync
      setQuote(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total_cost: newTotalCost
        };
      });
      
      setIsChanged(true);
    }
  }, [formData, formData?.fees, calculateSubtotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || !isChanged || !formData) return;

    if (formData.status === 'termine') {
      setShowFinishDialog(true);
      return;
    }

    // Let updateQuoteAndItems handle all form preparation
    await updateQuoteAndItems(new FormData());
  };

  const updateQuoteAndItems = async (formDataToSend: FormData) => {
    setIsSubmitting(true);
    try {
      // Filter out fees marked for deletion before updating the quote
      if (formData?.fees) {
        // Log before deletion for debugging
        console.log('Before deletion - feesToDelete set contents:', Array.from(feesToDelete));
        console.log('Before deletion - formData.fees:', formData.fees);
        
        // Create a filtered copy of the fees array
        const filteredFees = formData.fees.filter(fee => {
          const shouldKeep = !feesToDelete.has(fee.name);
          console.log(`Fee ${fee.name} - keep: ${shouldKeep}`);
          return shouldKeep;
        });
        
        console.log('After filtering - filteredFees:', filteredFees);
        
        // Make a local copy of formData with the updated fees
        const updatedFormData = {
          ...formData,
          fees: filteredFees
        };
        
        // Build a fresh FormData object
        const freshFormData = new FormData();
        
        // Add all fields to the form data
        Object.entries(updatedFormData).forEach(([key, value]) => {
          if (key === 'address' && value) {
            // Handle address object separately
            Object.entries(value).forEach(([addressKey, addressValue]) => {
              freshFormData.append(`address.${addressKey}`, addressValue?.toString() ?? '');
            });
          } else if (key === 'fees') {
            // Explicitly stringify the fees array
            freshFormData.append('fees', JSON.stringify(filteredFees));
          } else if (value !== null && value !== undefined) {
            freshFormData.append(key, value.toString());
          }
        });
        
        // Add payments to the form data
        if (updatedFormData.payments && Array.isArray(updatedFormData.payments)) {
          updatedFormData.payments.forEach((payment) => {
            if (payment.mode && (payment.amount !== undefined && payment.amount !== null)) {
              freshFormData.append('payment_modes[]', payment.mode.toString());
              freshFormData.append('payment_amounts[]', payment.amount.toString());
            }
          });
        }
        
        // Use the fresh form data instead
        formDataToSend = freshFormData;
      }

      // Update the quote
      const response = await updateQuote(formDataToSend);
      console.log('Response from server:', response);

      const updatePromises = [];
      
      // Delete the tainted items
      for (const itemId of Array.from(taintedItems)) {
        updatePromises.push(deleteQuoteItem(parseInt(quoteId), itemId));
      }
      // Update the edited items
      editedItems.forEach((quantity, itemId) => {
        updatePromises.push(updateQuoteItem(parseInt(quoteId), itemId, quantity));
      });

      createdItems.forEach(item => {
        updatePromises.push(createQuoteItem(parseInt(quoteId), item.product_id, item.quantity));
      });

      await Promise.all(updatePromises);

      setTaintedItems(new Set());
      setEditedItems(new Map());
      setCreatedItems([]);
      setFeesToDelete(new Set()); // Reset fees to delete

      if (shouldReloadItems) {
        await fetchQuoteItems();
      }
      
      // Make sure we update with the response that should have the filtered fees
      setQuote(response);
      setFormData(response);
      setIsChanged(false);
      setQuotesShouldRefetch(true);
      toast.success('Devis mis à jour avec succès');
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Erreur lors de la mise à jour du devis');
    } finally {
      setShouldReloadItems(false);
      setIsSubmitting(false);
    }
  };

  const handleFinishQuote = async () => {
    try {
      const formDataToSend = new FormData();
      if (formData) {
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'address' && value) {
            Object.entries(value).forEach(([addressKey, addressValue]) => {
              formDataToSend.append(`address.${addressKey}`, addressValue?.toString() ?? '');
            });
          } else if (value !== null && value !== undefined) {
            formDataToSend.append(key, value.toString());
          }
        });
      }

      // Add payments to the form data right before the updateQuote call
      if (formData?.payments && Array.isArray(formData.payments)) {
        formData.payments.forEach((payment) => {
          if (payment.mode && (payment.amount !== undefined && payment.amount !== null)) {
            formDataToSend.append('payment_modes[]', payment.mode.toString());
            formDataToSend.append('payment_amounts[]', payment.amount.toString());
          }
        });
      }

      await updateQuoteAndItems(formDataToSend);
      await finishQuote([parseInt(quoteId)]);
      setFinishedQuotesShouldRefetch(true);
      toast.success('Devis terminé et archivé avec succès');
      router.push('/quotes');
    } catch (error) {
      console.error('Error finishing quote:', error);
      toast.error('Erreur lors de la finalisation du devis');
    }
  };

  //calculates the total cost TTC from the total cost HT
  const calculateTTC = (ht: number | undefined): number => {
    return ht !== undefined ? ht * 1.20 : 0;
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        address: {
          voie: prev.address?.voie ?? '',
          compl: prev.address?.compl ?? null,
          cp: prev.address?.cp ?? '',
          ville: prev.address?.ville ?? '',
          depart: prev.address?.depart ?? '',
          pays: prev.address?.pays ?? '',
          ...prev.address,
          [field]: value
        }
      };
    });
  };

  const downloadPDF = () => {
    if (isProductsLoading) {
      toast.error('Chargement des produits en cours...');
      return;
    }

    if (!formData) {
      console.error('Missing form data');
      toast.error('Impossible de générer le PDF : données du devis manquantes');
      return;
    }

    if (!quoteItems || quoteItems.length === 0) {
      console.error('Missing quote items');
      toast.error('Impossible de générer le PDF : articles manquants');
      return;
    }

    if (!products || products.length === 0) {
      console.error('Missing products data');
      toast.error('Impossible de générer le PDF : produits manquants');
      return;
    }

    // Filter out tainted items
    const filteredQuoteItems = quoteItems.filter(item => !taintedItems.has(item.id));

    // Generate the PDF using the centralized utility
    (generateQuotePDF(
      formData, 
      filteredQuoteItems || [], 
      products || []
    ) as Promise<void>)
      .then(() => {
        toast.success('PDF généré avec succès');
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        toast.error('Erreur lors de la génération du PDF');
      });
  };

  const handleAddPayment = () => {
    setFormData(prev => {
      if (!prev) return prev;
      const newPayments = [...(prev.payments || []), { mode: '', amount: null }];
      return { ...prev, payments: newPayments };
    });
  };

  const handleRemovePayment = (index: number) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newPayments = [...(prev.payments || [])];
      newPayments.splice(index, 1);
      return { ...prev, payments: newPayments };
    });
  };

  const handlePaymentChange = (index: number, field: 'mode' | 'amount', value: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      
      const newPayments = [...(prev.payments || [])];
      
      if (field === 'amount') {
        // Parse the input value
        const numValue = value === '' ? null : parseFloat(value);
        
        // Calculate total TTC
        const totalTTC = calculateTTC(prev.total_cost);
        
        // Calculate amount already paid (excluding current payment)
        const paidSoFar = (prev.payments || [])
          .filter((_, i) => i !== index)
          .reduce((sum, payment) => sum + (payment.amount === null ? 0 : Number(payment.amount)), 0);
        
        // Add deposit if applicable
        const depositAmount = prev.is_deposit && prev.total_cost ? calculateTTC(prev.total_cost) * (prev.deposit_percentage / 100) : 0;
        const totalPaidExcludingCurrent = paidSoFar + depositAmount;
        
        // Calculate maximum allowed payment
        const maxPayment = Math.max(0, totalTTC - totalPaidExcludingCurrent);
        
        // Limit the payment amount and round to 2 decimal places
        const limitedValue = numValue === null ? null : Math.round(Math.min(numValue, maxPayment) * 100) / 100;
        
        newPayments[index] = {
          ...newPayments[index],
          [field]: limitedValue
        };
      } else {
        newPayments[index] = {
          ...newPayments[index],
          [field]: value
        };
      }
      
      return { ...prev, payments: newPayments };
    });
  };

  const calculateFeesTotal = () => {
    if (!formData?.fees) return 0;
    return formData.fees.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0);
  };

  const handleFeesChange = (updatedFees: any[]) => {
    // Process fees - calculate total for all fees not marked for deletion
    const feesTotal = updatedFees
      .filter(fee => !feesToDelete.has(fee.name))
      .reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0);
    
    const decorationTotal = parseFloat(calculateSubtotal('decoration'));
    const traiteurTotal = parseFloat(calculateSubtotal('traiteur'));
    const newTotalCost = Number((decorationTotal + traiteurTotal + feesTotal).toFixed(2));
    
    setFormData(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        fees: updatedFees,
        total_cost: newTotalCost
      };
      return updated;
    });

    // Always mark the form as changed when fees are updated
    setIsChanged(true);
  };

  const handleFeesToDeleteChange = (feesToDeleteSet: Set<string>) => {
    console.log('feesToDelete update received:', Array.from(feesToDeleteSet));
    
    // Create a new Set with the values to ensure state is updated properly
    const newSet = new Set<string>();
    feesToDeleteSet.forEach(name => newSet.add(name));
    
    // Update the fees to delete state
    setFeesToDelete(newSet);
    
    // Mark form as changed
    setIsChanged(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-5xl">
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
          <Button variant="secondary" size="icon" onClick={handleGoBack} type="button">
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
            type="button"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Mise à jour...' : 'Valider'}
          </Button>
        </div>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-5xl">
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
                      value={formData?.last_name ?? ''} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.last_name ? 'border-red-500' : ''}`} 
                    />
                    {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="first_name" className="text-sm text-gray-600">Prénom</Label>
                    <Input 
                      id="first_name" 
                      value={formData?.first_name ?? ''} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.first_name ? 'border-red-500' : ''}`} 
                    />
                    {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone_number" className="text-sm text-gray-600">Téléphone</Label>
                    <Input 
                      id="phone_number" 
                      value={formData?.phone_number ?? ''} 
                      onChange={handleInputChange} 
                      className={`w-full mt-1 ${errors.phone_number ? 'border-red-500' : ''}`} 
                    />
                    {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                    <Input 
                      id="email" 
                      value={formData?.email ?? ''} 
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
                      value={formData?.address?.voie ?? ''} 
                      onChange={(e) => handleAddressChange('voie', e.target.value)} 
                      className="w-full mt-1" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="compl" className="text-sm text-gray-600">Complément d'adresse</Label>
                    <Input 
                      id="compl" 
                      value={formData?.address?.compl ?? ''} 
                      onChange={(e) => handleAddressChange('compl', e.target.value)} 
                      className="w-full mt-1" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cp" className="text-sm text-gray-600">Code Postal</Label>
                      <Input 
                        id="cp" 
                        value={formData?.address?.cp ?? ''} 
                        onChange={(e) => handleAddressChange('cp', e.target.value)} 
                        className="w-full mt-1" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ville" className="text-sm text-gray-600">Ville</Label>
                      <Input 
                        id="ville" 
                        value={formData?.address?.ville ?? ''} 
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
                        value={formData?.address?.depart ?? ''} 
                        onChange={(e) => handleAddressChange('depart', e.target.value)} 
                        className="w-full mt-1" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pays" className="text-sm text-gray-600">Pays</Label>
                      <Input 
                        id="pays" 
                        value={formData?.address?.pays ?? 'France'} 
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
                  date={formData?.event_start_date ? parseISO(formData.event_start_date) : undefined}
                  onDateChange={handleStartDateChange}
                  label="Choisir la date de début"
                />
                {errors.event_start_date && <p className="text-red-500 text-sm mt-1">{errors.event_start_date}</p>}
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="text-base font-medium mb-3 text-gray-700">Date de fin</h4>
                <DatePicker
                  date={formData?.event_end_date ? parseISO(formData.event_end_date) : undefined}
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
                value={formData?.description ?? ''} 
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
              {isQuoteItemsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : <QuoteItemList 
                    items={quoteItems ?? []}
                    taintedItems={taintedItems}
                    editedItems={editedItems}
                    createdItems={createdItems}
                    onItemTaint={handleItemTaint}
                    onItemEdit={handleItemEdit}
                    onItemCreate={handleItemCreate}
                    onItemRemove={handleItemRemove}
                    isLoading={isQuoteItemsLoading}
                    quoteId={quote.id}
                    onTotalCostChange={handleTotalCostChange}
                    disabled={!!formData?.is_deposit || !!formData?.is_paid}
                  />
              }
            </div>
          </div>
          
          <div className="mb-8 mt-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Prix et Paiement</h3>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-4">
              <h4 className="text-base font-medium mb-3">Détail du prix</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="decoration_subtotal_ht" className="text-sm text-gray-600">Sous-total meubles et décoration HT</Label>
                  <Input 
                    id="decoration_subtotal_ht" 
                    type="number"
                    value={calculateSubtotal('decoration')}
                    className="w-full text-base font-semibold bg-gray-100" 
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="traiteur_subtotal_ht" className="text-sm text-gray-600">Sous-total traiteur HT</Label>
                  <Input 
                    id="traiteur_subtotal_ht" 
                    type="number"
                    value={calculateSubtotal('traiteur')}
                    className="w-full text-base font-semibold bg-gray-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="decoration_subtotal_ttc" className="text-sm text-gray-600">Sous-total meubles et décoration TTC</Label>
                  <Input 
                    id="decoration_subtotal_ttc" 
                    type="number"
                    value={calculateSubtotal('decoration', true)}
                    className="w-full text-base font-semibold bg-gray-100" 
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="traiteur_subtotal_ttc" className="text-sm text-gray-600">Sous-total traiteur TTC</Label>
                  <Input 
                    id="traiteur_subtotal_ttc" 
                    type="number"
                    value={calculateSubtotal('traiteur', true)}
                    className="w-full text-base font-semibold bg-gray-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="fees_subtotal_ht" className="text-sm text-gray-600">Frais supplémentaires Montant HT</Label>
                  <Input 
                    id="fees_subtotal_ht" 
                    type="number"
                    value={formData?.fees?.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0).toFixed(2) || '0.00'}
                    className="w-full text-base font-semibold bg-gray-100" 
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="fees_subtotal_ttc" className="text-sm text-gray-600">Frais supplémentaires Montant TTC</Label>
                  <Input 
                    id="fees_subtotal_ttc" 
                    type="number"
                    value={((formData?.fees?.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0) ?? 0) * 1.2).toFixed(2)}
                    className="w-full text-base font-semibold bg-gray-100" 
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
                    value={formData?.total_cost.toFixed(2) ?? ''} 
                    onChange={handleInputChange} 
                    className={`w-full text-base font-semibold ${errors.total_cost ? 'border-red-500' : 'border-gray-300'}`} 
                    disabled
                  />
                  {errors.total_cost && <p className="text-red-500 text-sm mt-1">{errors.total_cost}</p>}
                </div>
                
                <div>
                  <Label htmlFor="tva_amount" className="text-sm text-gray-600">TVA (20%)</Label>
                  <Input 
                    id="tva_amount" 
                    type="number"
                    value={formData?.total_cost ? (formData.total_cost * 0.2).toFixed(2) : '0.00'} 
                    className="w-full text-base font-semibold bg-gray-100" 
                    disabled
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="total_cost_ttc" className="text-sm text-gray-600">Prix total TTC</Label>
                  <Input 
                    id="total_cost_ttc" 
                    type="number"
                    value={formData?.total_cost ? calculateTTC(formData.total_cost).toFixed(2) : ''} 
                    className="w-full text-base font-semibold bg-gray-100 border-gray-300" 
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
            <Label htmlFor="is_traiteur" className="text-base font-medium">Options supplémentaires</Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="is_traiteur"
                    checked={formData?.is_traiteur ?? false}
                    onCheckedChange={() => handleSwitchChange('is_traiteur')}
                    disabled={formData?.is_paid || formData?.is_deposit}
                  />
                  <Label htmlFor="is_traiteur" className="text-base">Service traiteur</Label>
                </div>
                
                <div>
                  <Label htmlFor="traiteur_price" className="text-sm text-gray-600">Prix traiteur HT</Label>
                  <Input 
                    id="traiteur_price" 
                    type="number"
                    value={formData?.traiteur_price ?? ''} 
                    onChange={handleInputChange} 
                    className={`w-full text-base mt-1 ${errors.traiteur_price ? 'border-red-500' : ''}`} 
                    disabled={!formData?.is_traiteur || formData?.is_paid || formData?.is_deposit}
                  />
                  {errors.traiteur_price && <p className="text-red-500 text-sm mt-1">{errors.traiteur_price}</p>}
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center space-x-2 mb-4">
                  <Label htmlFor="other_expenses" className="text-base">Frais supplémentaires</Label>
                </div>
                
                <div>
                  <Label htmlFor="other_expenses" className="text-sm text-gray-600">Montant HT</Label>
                  <Input 
                    id="other_expenses" 
                    type="number"
                    value={formData?.other_expenses ?? ''} 
                    onChange={handleInputChange} 
                    className={`w-full text-base mt-1 ${errors.other_expenses ? 'border-red-500' : ''}`} 
                    disabled={formData?.is_paid || formData?.is_deposit}
                  />
                  {errors.other_expenses && <p className="text-red-500 text-sm mt-1">{errors.other_expenses}</p>}
                </div>
              </div>
            </div>
          </div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="deposit_percentage" className="text-sm text-gray-600">Pourcentage de l'acompte (%)</Label>
                  <Input 
                    id="deposit_percentage" 
                    type="text"
                    inputMode="decimal"
                    value={formData?.deposit_percentage?.toString() || '30'} 
                    onChange={handleDepositPercentageChange}
                    className={`w-full text-base ${formData?.is_deposit ? 'bg-gray-100' : ''}`}
                    disabled={formData?.is_deposit}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deposit_amount" className="text-sm text-gray-600">Montant de l'acompte TTC</Label>
                  <Input 
                    id="deposit_amount" 
                    type="number"
                    value={
                      formData?.total_cost && formData?.deposit_percentage
                        ? (formData.is_deposit 
                            ? formData.deposit_amount?.toFixed(2) 
                            : (calculateTTC(formData.total_cost) * (formData.deposit_percentage / 100)).toFixed(2))
                        : '0.00'
                    } 
                    className={`w-full text-base font-semibold ${formData?.is_deposit ? 'bg-lime-50 border-lime-200' : 'bg-gray-100'}`}
                    disabled
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600">Montant restant à payer TTC</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData ? (
                      formData.is_paid 
                        ? "0.00"
                        : (() => {
                            // Calculate total payments
                            const totalPayments = formData.payments?.reduce(
                              (sum, payment) => sum + (payment.amount === null ? 0 : Number(payment.amount)),
                              0
                            ) || 0;
                            
                            // Calculate remaining amount based on deposit status
                            const totalTTC = calculateTTC(formData.total_cost);
                            const depositAmount = formData.is_deposit 
                              ? calculateTTC(formData.total_cost) * (formData.deposit_percentage / 100)
                              : 0;
                            const remainingAmount = totalTTC - depositAmount - totalPayments;
                            
                            return Math.max(0, remainingAmount).toFixed(2);
                          })()
                    ) : '0.00'} 
                    className="w-full text-base font-semibold bg-gray-100"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-6">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-medium">Modes de Paiement</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPayment}
                  className={`
                    border-lime-500 text-lime-700 hover:bg-lime-50
                    ${formData?.is_paid ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  disabled={formData?.is_paid}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Ajouter un paiement
                </Button>
              </div>
              
              {formData?.payments?.length === 0 && (
                <div className="text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-md">
                  Aucun paiement enregistré
                </div>
              )}
              
              {formData?.payments?.map((payment, index) => (
                <div key={index} className="flex gap-4 mb-4 p-3 border border-gray-100 rounded-md bg-gray-50">
                  <div className="flex-1">
                    <Label className="text-sm text-gray-600">Mode de paiement</Label>
                    <Select
                      value={payment.mode}
                      onValueChange={(value) => handlePaymentChange(index, 'mode', value)}
                    >
                      <SelectTrigger className={`w-full mt-1 ${errors.payments?.[index]?.mode ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Mode de paiement" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.payments?.[index]?.mode && payment.mode !== '' && (
                      <p className="text-red-500 text-sm mt-1">{errors.payments[index].mode}</p>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-sm text-gray-600">Montant</Label>
                    <Input
                      type="number"
                      value={payment.amount ?? ''}
                      onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                      className={`w-full mt-1 ${errors.payments?.[index]?.amount ? 'border-red-500' : ''}`}
                      placeholder="Montant"
                    />
                    {errors.payments?.[index]?.amount && payment.amount !== null && (
                      <p className="text-red-500 text-sm mt-1">{errors.payments[index].amount}</p>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePayment(index)}
                    className="flex-shrink-0 self-end mb-1 text-gray-500 hover:text-red-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {(formData?.payments && formData.payments.length > 0 || formData?.is_paid || formData?.is_deposit) && (
                <div className="mt-4 p-3 border border-lime-100 rounded-md bg-lime-50">
                  <Label className="text-sm text-gray-600">Total payé</Label>
                  <Input
                    type="number"
                    value={formData?.is_paid 
                      ? calculateTTC(formData.total_cost).toFixed(2)  // If fully paid, show the total TTC
                      : (
                          // Sum payments
                          (formData.payments?.reduce((sum, payment) => 
                            sum + (payment.amount === null ? 0 : Number(payment.amount)),
                            0
                          ) || 0) + 
                          // Add deposit amount if deposit is paid - calculate based on current percentage
                          (formData.is_deposit && formData.total_cost 
                            ? calculateTTC(formData.total_cost) * (formData.deposit_percentage / 100)
                            : 0)
                        ).toFixed(2)}
                    className="w-full mt-1 text-base font-semibold bg-white border-lime-200"
                    disabled
                  />
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_paid"
                    checked={formData?.is_paid ?? false}
                    onCheckedChange={() => handleSwitchChange('is_paid')}
                    className="data-[state=checked]:bg-lime-500"
                  />
                  <Label htmlFor="is_paid" className="text-base font-medium">Payé intégralement</Label>
                </div>
                {formData?.is_paid && (
                  <div className="px-3 py-1 bg-lime-100 text-lime-800 text-sm font-medium rounded-full">
                    Payé
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <QuoteFees
              quoteId={parseInt(quoteId)}
              disabled={formData?.status === 'termine' || formData?.is_paid || formData?.is_deposit}
              fees={formData?.fees || []}
              onFeesChange={handleFeesChange}
              onFeesToDeleteChange={handleFeesToDeleteChange}
              onFeesSubtotalChange={setFeesSubtotal}
            />
          </div>
          
          <div className="mb-4">
            <Label className="text-base">Date de création du devis</Label>
            <Input id="created_at" value={formData?.created_at ? new Date(formData.created_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-20">
            <Label className="text-base">Date de dernière mise à jour du devis</Label>
            <Input id="last_update" value={formData?.last_update ? new Date(formData.last_update).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
          <div className="flex justify-center mb-20">
            <Button
              onClick={downloadPDF}
              className={`
                ${!isChanged 
                  ? "bg-lime-300 hover:bg-lime-400" 
                  : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                }
                text-black
              `}
              variant="secondary"
              disabled={isChanged}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {isChanged 
                ? "Sauvegardez les modifications avant de télécharger" 
                : "Télécharger le devis en PDF"
              }
            </Button>
          </div>
        </div>
      </form>
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la finalisation du devis</AlertDialogTitle>
            <AlertDialogDescription>
              Le statut du devis est "terminé". En procédant avec cette action, vous déplacerez le devis dans les archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinishDialog(false)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishQuote}>Procéder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </>
  )
}
