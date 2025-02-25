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
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useRouter } from 'next/navigation'
import { useAppContext } from "@/app/context/AppContext"
import { getQuote, getQuoteItems, updateQuote, deleteQuoteItem, finishQuote, updateQuoteItem, createQuoteItem } from "@/services/quotes"
import { Quote, quoteStatus, QuoteItem, Address } from "@/utils/types/quotes"
import { DatePicker } from "../components/date-picker"
import { QuoteItemList } from "../components/quote-item-list"
import { format, parseISO } from 'date-fns';
import { Product } from "@/utils/types/products"
import { getProducts } from "@/services/products"

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
  address?: {
    voie?: string;
    compl?: string;
    cp?: string;
    ville?: string;
    depart?: string;
    pays?: string;
  };
}

const isEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  if (obj1 === null || obj2 === null) return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

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

  const [isChanged, setIsChanged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setQuotesShouldRefetch, setFinishedQuotesShouldRefetch } = useAppContext()
  const [totalCostFromItems, setTotalCostFromItems] = useState(0);

  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

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
        setQuote(fetchedQuote)
        const formDataCopy = JSON.parse(JSON.stringify(fetchedQuote));
        setFormData(formDataCopy)
        setIsChanged(false);
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

    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [formData])

  useEffect(() => {
    const formDataWithoutTotal = formData ? { ...formData } : null;
    const quoteWithoutTotal = quote ? { ...quote } : null;
    
    let hasChanges = false;
    if (formDataWithoutTotal && quoteWithoutTotal) {
      const { total_cost: _f, ...formDataCompare } = formDataWithoutTotal;
      const { total_cost: _q, ...quoteCompare } = quoteWithoutTotal;
      hasChanges = !isEqual(formDataCompare, quoteCompare);
    }

    // Add check for quote item changes
    if (!hasChanges) {
      hasChanges = taintedItems.size > 0 || editedItems.size > 0 || createdItems.length > 0;
    }

    setIsChanged(hasChanges);
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
      return {
        ...prevData,
        is_deposit: newIsDeposit,
        deposit_amount: newIsDeposit && prevData.total_cost 
          ? prevData.total_cost * 0.3
          : 0
      };
    });
    setIsChanged(true);
  };

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

  useEffect(() => {
    // Only update total_cost if it's different from the current value
    if (formData && (formData.total_cost !== (totalCostFromItems + (formData.traiteur_price ?? 0) + (formData.other_expenses ?? 0)))) {
      setFormData(prev => prev ? ({
        ...prev,
        total_cost: totalCostFromItems + (prev.traiteur_price ?? 0) + (prev.other_expenses ?? 0)
      }) : null);
    }
  }, [totalCostFromItems, formData?.traiteur_price, formData?.other_expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !isChanged || !formData) return;

    if (formData.status === 'termine') {
      setShowFinishDialog(true);
      return;
    }

    const formDataToSend = new FormData();
    // Append all form fields
    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'address' && value) {
          // Handle address object separately
          Object.entries(value).forEach(([addressKey, addressValue]) => {
            formDataToSend.append(`address.${addressKey}`, addressValue?.toString() ?? '');
          });
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });
    }

    await updateQuoteAndItems(formDataToSend);
  };

  const updateQuoteAndItems = async (formDataToSend: FormData) => {
    setIsSubmitting(true);
    try {
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

      createdItems.forEach(item => {
        updatePromises.push(createQuoteItem(parseInt(quoteId), item.product_id, item.quantity));
      });

      await Promise.all(updatePromises);

      setTaintedItems(new Set());
      setEditedItems(new Map());
      setCreatedItems([]);

      if (shouldReloadItems) {
        await fetchQuoteItems();
      }
      
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

  const formatDateToParisTime = (date: string | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
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

    // First pass: Generate document to get total pages
    const tempDoc = new jsPDF();
    const pageWidth = tempDoc.internal.pageSize.getWidth();
    const rightMargin = 15;
    const lineSpacing = 7;

    // Create image and wait for it to load
    const img = new Image();
    const logoPath = `${window.location.origin}/quote-mg-events.png`;
    img.crossOrigin = "anonymous";
    img.src = logoPath;
    
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const originalWidth = 788;
      const originalHeight = 380;
      const desiredWidth = 65;
      const scaledHeight = (desiredWidth * originalHeight) / originalWidth;
      
      // Generate the actual document
      const doc = new jsPDF();

      doc.setFontSize(50);
      doc.setTextColor(51);
      doc.text(`Devis`, 15, 30);
      doc.setTextColor(0);

      doc.addImage(img, 'PNG', 133, 5, desiredWidth, scaledHeight);

      const contentStartY = 5 + scaledHeight;

      const quoteDate = new Date().toLocaleDateString('fr-FR');
      
      // Date and quote info on the left
      doc.setFontSize(9);

      // Date
      doc.setFont('helvetica', 'bold');
      doc.text("Date:", 15, contentStartY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(quoteDate, 15 + doc.getTextWidth("Date:   "), contentStartY + 15);

      // Quote number
      doc.setFont('helvetica', 'bold');
      doc.text("Numéro devis: ", 15, contentStartY + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(formData.id.toString(), 15 + doc.getTextWidth("Numéro devis:   "), contentStartY + 21);

      // Event dates
      const eventFromDate = formatDateToParisTime(formData.event_start_date);
      const eventToDate = formatDateToParisTime(formData.event_end_date);
      const eventDateValue = eventFromDate === eventToDate ? eventFromDate : `du ${eventFromDate} au ${eventToDate}`;
      doc.setFont('helvetica', 'bold');
      doc.text("Date(s) de l'événement:", 15, contentStartY + 27);
      doc.setFont('helvetica', 'normal');
      doc.text(eventDateValue, 15, contentStartY + 33);

      // Traiteur option
      const traiteurValue = formData.is_traiteur ? 'Oui' : 'Non';
      doc.setFont('helvetica', 'bold');
      doc.text("Option traiteur:", 15, contentStartY + 39);
      doc.setFont('helvetica', 'normal');
      doc.text(traiteurValue, 15 + doc.getTextWidth("Option traiteur:    "), contentStartY + 39);

      // Add client info aligned to the right
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Client", pageWidth - 15 - doc.getTextWidth("Client"), contentStartY + 15);
      doc.setFont('helvetica', 'normal');

      // Always create 6 lines of client info, using empty strings for missing address fields
      const clientInfo = [
        `${formData.first_name} ${formData.last_name}`,
        formData.email,
        formData.phone_number,
        formData.address?.voie ? `${formData.address.voie}${formData.address?.compl ? `, ${formData.address.compl}` : ''}` : '',
        formData.address?.cp || formData.address?.ville ? `${formData.address?.cp || ''} ${formData.address?.ville || ''}`.trim() : '',
        formData.address?.depart || ''
      ];

      // Fixed position for the last line
      const lastClientInfoY = contentStartY + 21 + (5 * 6); // 5 is the number of spaces between 6 lines

      clientInfo.forEach((line, index) => {
        if (line) { // Only render non-empty lines
          const lineWidth = doc.getTextWidth(line);
          doc.text(line, pageWidth - 15 - lineWidth, contentStartY + 21 + (index * 6));
        }
      });

      // Add payment terms and conditions on the left
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Termes et conditions", 15, lastClientInfoY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text("Devis valable un mois", 15, lastClientInfoY + 20);
      doc.text("Un acompte de 30% est requis", 15, lastClientInfoY + 25);

      // Add address section on the right
      doc.setFont('helvetica', 'bold');
      const addressTitle = "Adresse de récupération du matériel";
      const addressTitleWidth = doc.getTextWidth(addressTitle);
      doc.text(addressTitle, pageWidth - 15 - addressTitleWidth, lastClientInfoY + 15);

      doc.setFont('helvetica', 'normal');
      const addressText = "Chemin des droits de l'homme et du citoyen, 31450 Ayguevives";
      const addressWidth = doc.getTextWidth(addressText);
      doc.text(addressText, pageWidth - 15 - addressWidth, lastClientInfoY + 20);

      // Generate table with the product details
      const headers = [['Produit', 'Quantité', 'Prix unitaire HT', 'Sous-Total HT']];
      const data = quoteItems
        .filter(item => !taintedItems.has(item.id))
        .map(item => {
          const product = products.find((p: Product) => p.id === item.product_id);
          const unitPriceHT = (product?.price || 0);
          const subtotalHT = unitPriceHT * item.quantity;
          return [
            product?.name || 'Produit inconnu',
            item.quantity,
            `${unitPriceHT.toFixed(2)}€`,
            `${subtotalHT.toFixed(2)}€`
          ];
        });

      const addFooter = (doc: any, pageHeight: number) => {
        const footerY = pageHeight - 35;

        // Add horizontal line
        doc.setDrawColor(168, 168, 168);
        doc.setLineWidth(0.5);
        doc.line(15, footerY, pageWidth - 15, footerY);

        // Add the three sections below the line
        doc.setFontSize(9);
        
        // Company section
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(89, 89, 89);
        doc.text("Entreprise", 15, footerY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text("MG Événements\nChemin des droits de l'homme\net du citoyen, 31450 Ayguevives", 15, footerY + 15);

        // Contact section
        const contactX = pageWidth / 3 + 10;
        doc.setFont('helvetica', 'bold');
        doc.text("Coordonnées", contactX, footerY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text("Mani Grimaudo\n07 68 10 96 17\nmgevenementiel31@gmail.com\nwww.mgevenements.fr", contactX, footerY + 15);

        // Bank details section
        const bankX = (2 * pageWidth) / 3;
        doc.setFont('helvetica', 'bold');
        doc.text("Coordonnées bancaires", bankX, footerY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text("IBAN FR76 2823 3000 0113 2935 6527 041\nCode BIC / SWIFT REVOFRP2\nPaypal: mani.grimaudo@icloud.com", bankX, footerY + 15);
      };

      // First calculate total pages by doing a dry run
      const totalPages = Math.ceil(data.length / 20); // Approximate rows per page

      (doc as any).autoTable({
        head: headers,
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
        body: data,
        startY: lastClientInfoY + 30,
        styles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
        },
        margin: { bottom: 60 },
        didDrawPage: function(data: any) {
          const pageHeight = doc.internal.pageSize.getHeight();
          addFooter(doc, pageHeight);
          
          // Add page numbers using the pre-calculated total
          doc.setFontSize(8);
          const text = `Page ${data.pageNumber} sur ${totalPages}`;
          const textWidth = doc.getTextWidth(text);
          doc.text(
            text,
            doc.internal.pageSize.getWidth() - 15 - textWidth,
            pageHeight - 5
          );
        }
      });

      // After autoTable, check if we need to add a new page for totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const requiredSpace = 90;
      const pageHeight = doc.internal.pageSize.getHeight();
      
      if (finalY + requiredSpace > pageHeight) {
        doc.addPage();
        addFooter(doc, pageHeight);
        
        // Calculate total from items
        const totalFromItems = quoteItems.reduce((total, item) => {
          const product = products.find(p => p.id === item.product_id);
          return total + ((product?.price || 0) * item.quantity);
        }, 0);
        
        // Add other costs
        const totalHT = totalFromItems + (formData.traiteur_price || 0) + (formData.other_expenses || 0);
        
        addTotalsAndSignature(
          doc,
          20,
          pageWidth,
          totalHT,
          totalHT * 0.2,
          totalHT * 1.2,
          rightMargin,
          lineSpacing
        );
      } else {
        // Calculate total from items
        const totalFromItems = quoteItems.reduce((total, item) => {
          const product = products.find(p => p.id === item.product_id);
          return total + ((product?.price || 0) * item.quantity);
        }, 0);
        
        // Add other costs
        const totalHT = totalFromItems + (formData.traiteur_price || 0) + (formData.other_expenses || 0);
        
        addTotalsAndSignature(
          doc,
          finalY,
          pageWidth,
          totalHT,
          totalHT * 0.2,
          totalHT * 1.2,
          rightMargin,
          lineSpacing
        );
      }

      doc.save(`Devis_${formData.id}_${formData.last_name}_${new Date().toLocaleDateString('fr-FR')}.pdf`);
    };

    img.onerror = () => {
      console.error('Error loading logo image');
      toast.error('Erreur lors du chargement du logo');
    };
  };

  const addTotalsAndSignature = (
    doc: any,
    startY: number,
    pageWidth: number,
    totalHT: number,
    tva: number,
    totalTTC: number,
    rightMargin: number,
    lineSpacing: number
  ) => {
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');

    const totalHTText = `Total HT:  ${totalHT.toFixed(2)}€`;
    const totalHTWidth = doc.getTextWidth(totalHTText);
    doc.text(totalHTText, pageWidth - rightMargin - totalHTWidth, startY);

    const tvaText = `TVA 20%:  ${tva.toFixed(2)}€`;
    const tvaWidth = doc.getTextWidth(tvaText);
    doc.text(tvaText, pageWidth - rightMargin - tvaWidth, startY + lineSpacing);

    const totalTTCText = `Total TTC:  ${totalTTC.toFixed(2)}€`;
    const totalTTCWidth = doc.getTextWidth(totalTTCText);
    doc.text(totalTTCText, pageWidth - rightMargin - totalTTCWidth, startY + (lineSpacing * 2));

    const signatureText = "Signature du client (précédée de la mention « Bon pour accord »)";
    const signatureBoxWidth = totalHTWidth + 80;
    const signatureBoxHeight = 30;
    const signatureBoxX = pageWidth - rightMargin - signatureBoxWidth;
    const signatureBoxY = startY + (lineSpacing * 3);

    addSignatureAndCompanyInfo(doc, signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, signatureText, pageWidth);
  };

  const addSignatureAndCompanyInfo = (
    doc: any,
    signatureBoxX: number,
    signatureBoxY: number,
    signatureBoxWidth: number,
    signatureBoxHeight: number,
    signatureText: string,
    pageWidth: number
  ) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, 'F');

    doc.setFontSize(9);
    doc.setTextColor(133, 133, 132);
    const signatureTextWidth = doc.getTextWidth(signatureText);
    doc.text(signatureText, 
      signatureBoxX + (signatureBoxWidth - signatureTextWidth) / 2, 
      signatureBoxY + 7
    );
    
    doc.setTextColor(0);
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
            <Label className="text-base">Adresse</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="voie" className="text-sm">Voie</Label>
                <Input 
                  id="voie" 
                  value={formData?.address?.voie ?? ''} 
                  onChange={(e) => handleAddressChange('voie', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="compl" className="text-sm">Complément d'adresse</Label>
                <Input 
                  id="compl" 
                  value={formData?.address?.compl ?? ''} 
                  onChange={(e) => handleAddressChange('compl', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="cp" className="text-sm">Code Postal</Label>
                <Input 
                  id="cp" 
                  value={formData?.address?.cp ?? ''} 
                  onChange={(e) => handleAddressChange('cp', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="ville" className="text-sm">Ville</Label>
                <Input 
                  id="ville" 
                  value={formData?.address?.ville ?? ''} 
                  onChange={(e) => handleAddressChange('ville', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="depart" className="text-sm">Département</Label>
                <Input 
                  id="depart" 
                  value={formData?.address?.depart ?? ''} 
                  onChange={(e) => handleAddressChange('depart', e.target.value)} 
                  className="w-full text-base" 
                />
              </div>
              <div>
                <Label htmlFor="pays" className="text-sm">Pays</Label>
                <Input 
                  id="pays" 
                  value={formData?.address?.pays ?? 'France'} 
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
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="is_traiteur"
              checked={formData?.is_traiteur ?? false}
              onCheckedChange={() => handleSwitchChange('is_traiteur')}
              disabled={formData?.is_paid || formData?.is_deposit}
            />
            <Label htmlFor="is_traiteur" className="text-base">Service traiteur</Label>
          </div>
          <div className="mb-4">
            <Label htmlFor="traiteur_price" className="text-base">Prix traiteur HT</Label>
            <Input 
              id="traiteur_price" 
              type="number"
              value={formData?.traiteur_price ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.traiteur_price ? 'border-red-500' : ''}`} 
              disabled={!formData?.is_traiteur || formData?.is_paid || formData?.is_deposit}
            />
            {errors.traiteur_price && <p className="text-red-500 text-sm mt-1">{errors.traiteur_price}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="other_expenses" className="text-base">Frais supplémentaires HT</Label>
            <Input 
              id="other_expenses" 
              type="number"
              value={formData?.other_expenses ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.other_expenses ? 'border-red-500' : ''}`} 
              disabled={formData?.is_paid || formData?.is_deposit}
            />
            {errors.other_expenses && <p className="text-red-500 text-sm mt-1">{errors.other_expenses}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Prix total HT</Label>
            <Input 
              id="total_cost" 
              type="number"
              step="1"
              min="0"
              value={formData?.total_cost.toFixed(2) ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.total_cost ? 'border-red-500' : ''}`} 
              disabled
            />
            {errors.total_cost && <p className="text-red-500 text-sm mt-1">{errors.total_cost}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="total_cost_ttc" className="text-base">Prix total TTC</Label>
            <Input 
              id="total_cost_ttc" 
              type="number"
              value={formData?.total_cost ? calculateTTC(formData.total_cost).toFixed(2) : ''} 
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
              <Label htmlFor="deposit_amount" className="text-base">Montant de l'acompte TTC</Label>
              <Input 
                id="deposit_amount" 
                type="number"
                value={formData.total_cost !== undefined ? (calculateTTC(formData.total_cost) * 0.3).toFixed(2) : ''} 
                className="w-full text-base"
                disabled
              />
            </div>
          )}
          <div className="mb-4">
            <Label className="text-base">Montant restant à payer TTC</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData ? (
                formData.is_paid 
                  ? "0.00"
                  : formData.is_deposit && formData.total_cost !== undefined
                    ? (calculateTTC(formData.total_cost) * 0.7).toFixed(2)
                    : calculateTTC(formData.total_cost).toFixed(2)
              ) : ''} 
              className="w-full text-base"
              disabled
            />
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="is_paid"
              checked={formData?.is_paid ?? false}
              onCheckedChange={() => handleSwitchChange('is_paid')}
            />
            <Label htmlFor="is_paid" className="text-base">Payé</Label>
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
              className="bg-lime-300 hover:bg-lime-400 text-black"
              variant="secondary"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Télécharger le devis en PDF
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
