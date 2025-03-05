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
import { ChevronLeftIcon, DownloadIcon, CheckIcon, Cross2Icon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons"
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useRouter } from 'next/navigation'
import { getFinishedQuotes, getFinishedQuoteItems } from "@/services/quotes"
import { FinishedQuote, quoteStatus, QuoteItem, paymentModes } from "@/utils/types/quotes"
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getProducts } from "@/services/products"
import { Product } from "@/utils/types/products"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Define a proper union type for the items
type QuoteDisplayItem = 
  | { type: 'product'; item: QuoteItem; index: number }
  | { type: 'traiteur'; price: number }
  | { type: 'expenses'; price: number };

export default function FinishedQuoteView({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [quote, setQuote] = useState<FinishedQuote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Move pagination state to the top level
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch the finished quote data
  const fetchFinishedQuote = useCallback(async () => {
    try {
      setIsLoading(true)
      // Get all finished quotes and find the one with matching ID
      const finishedQuotes = await getFinishedQuotes()
      const quoteData = finishedQuotes.find(q => q.id === parseInt(quoteId))
      
      if (!quoteData) {
        toast.error('Devis non trouvé')
        return
      }
      
      setQuote(quoteData)
      
      // Fetch quote items from the finished_quoteItems table
      const items = await getFinishedQuoteItems(parseInt(quoteId))
      setQuoteItems(items)
      
      // Fetch products for reference
      const productsData = await getProducts()
      setProducts(productsData)
      
    } catch (error) {
      console.error('Error fetching finished quote:', error)
      toast.error('Erreur lors du chargement du devis')
    } finally {
      setIsLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    fetchFinishedQuote()
  }, [fetchFinishedQuote])

  const handleGoBack = () => {
    router.push('/records')
  }

  // Calculate TTC from HT
  const calculateTTC = (ht: number | undefined): number => {
    return ht !== undefined ? ht * 1.20 : 0
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non défini'
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Download PDF functionality
  const downloadPDF = () => {
    if (!quote) return

    const img = new Image()
    img.src = '/logo.png'

    img.onload = () => {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const rightMargin = 20
      const lineSpacing = 10
      
      // Add logo
      const logoWidth = 60
      const logoHeight = (img.height * logoWidth) / img.width
      doc.addImage(img, 'PNG', margin, margin, logoWidth, logoHeight)
      
      // Add quote number and date
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Devis N° ${quote.id}`, pageWidth - rightMargin - 50, margin)
      doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString('fr-FR')}`, pageWidth - rightMargin - 50, margin + 7)
      
      // Add company info
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text("MANI GRIMAUDO", margin, margin + logoHeight + 10)
      doc.text("SIRET: 95106125400019", margin, margin + logoHeight + 15)
      doc.text("TVA non applicable, art. 293 B du CGI", margin, margin + logoHeight + 20)
      doc.text("Tél: 06 58 30 35 34", margin, margin + logoHeight + 25)
      doc.text("Email: mani.grimaudo@icloud.com", margin, margin + logoHeight + 30)
      
      // Add client info
      const clientInfoX = pageWidth - rightMargin - 80
      const clientInfoY = margin + logoHeight + 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text("CLIENT", clientInfoX, clientInfoY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`${quote.first_name} ${quote.last_name}`, clientInfoX, clientInfoY + 7)
      
      if (quote.address) {
        const addressLines = []
        if (quote.address.voie) addressLines.push(quote.address.voie)
        if (quote.address.compl) addressLines.push(quote.address.compl)
        if (quote.address.cp && quote.address.ville) addressLines.push(`${quote.address.cp} ${quote.address.ville}`)
        if (quote.address.depart) addressLines.push(quote.address.depart)
        if (quote.address.pays) addressLines.push(quote.address.pays)
        
        let addressY = clientInfoY + 14
        addressLines.forEach(line => {
          doc.text(line, clientInfoX, addressY)
          addressY += 5
        })
      }
      
      doc.text(`Tél: ${quote.phone_number}`, clientInfoX, clientInfoY + 35)
      doc.text(`Email: ${quote.email}`, clientInfoX, clientInfoY + 40)
      
      // Add event info
      const lastClientInfoY = clientInfoY + 50
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text("ÉVÉNEMENT", margin, lastClientInfoY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      if (quote.event_start_date) {
        const startDate = new Date(quote.event_start_date).toLocaleDateString('fr-FR')
        doc.text(`Date de début: ${startDate}`, margin, lastClientInfoY + 7)
      }
      
      if (quote.event_end_date) {
        const endDate = new Date(quote.event_end_date).toLocaleDateString('fr-FR')
        doc.text(`Date de fin: ${endDate}`, margin, lastClientInfoY + 14)
      }
      
      if (quote.description) {
        doc.text(`Description: ${quote.description}`, margin, lastClientInfoY + 21)
      }
      
      // Add table headers and data
      const headers = [
        { header: 'Produit', dataKey: 'product' },
        { header: 'Quantité', dataKey: 'quantity' },
        { header: 'Prix unitaire HT', dataKey: 'unit_price' },
        { header: 'Total HT', dataKey: 'total' },
      ]
      
      const data = quoteItems.map(item => {
        const product = products.find(p => p.id === item.product_id);

        return [
          product?.name || `Produit inconnu (ID: ${item.product_id})`,
          item.quantity.toString(),
          `${(product?.price || 0).toFixed(2)}€`,
          `${((product?.price || 0) * item.quantity).toFixed(2)}€`,
        ]
      })
      
      // Add other costs if applicable
      if (quote.is_traiteur && quote.traiteur_price) {
        data.push([
          'Service traiteur',
          '1',
          `${quote.traiteur_price.toFixed(2)}€`,
          `${quote.traiteur_price.toFixed(2)}€`,
        ])
      }
      
      if (quote.other_expenses && quote.other_expenses > 0) {
        data.push([
          'Frais supplémentaires',
          '1',
          `${quote.other_expenses.toFixed(2)}€`,
          `${quote.other_expenses.toFixed(2)}€`,
        ])
      }
      
      // Add footer with payment info
      const addFooter = (doc: any, pageHeight: number) => {
        const footerY = pageHeight - 30
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text("Conditions de paiement: Paiement à réception de facture", margin, footerY)
        
        // Add bank details
        const bankX = margin
        doc.setFont('helvetica', 'bold')
        doc.text("Coordonnées bancaires", bankX, footerY + 10)
        doc.setFont('helvetica', 'normal')
        doc.text("IBAN FR76 2823 3000 0113 2935 6527 041\nCode BIC / SWIFT REVOFRP2\nPaypal: mani.grimaudo@icloud.com", bankX, footerY + 15)
      }
      
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
          const pageHeight = doc.internal.pageSize.getHeight()
          addFooter(doc, pageHeight)
          
          // Add page numbers
          doc.setFontSize(8)
          const text = `Page ${data.pageNumber} sur ${totalPages}`
          const textWidth = doc.getTextWidth(text)
          doc.text(
            text,
            doc.internal.pageSize.getWidth() - 15 - textWidth,
            pageHeight - 5
          )
        }
      })
      
      // After autoTable, check if we need to add a new page for totals
      const finalY = (doc as any).lastAutoTable.finalY + 10
      const requiredSpace = 90
      
      if (finalY + requiredSpace > pageHeight) {
        doc.addPage()
        addFooter(doc, pageHeight)
        
        // Calculate total from items
        const totalFromItems = quoteItems.reduce((total, item) => {
          const product = products.find(p => p.id === item.product_id)
          return total + ((product?.price || 0) * item.quantity)
        }, 0)
        
        // Add other costs
        const totalHT = totalFromItems + (quote.traiteur_price || 0) + (quote.other_expenses || 0)
        
        addTotalsAndSignature(
          doc,
          20,
          pageWidth,
          totalHT,
          totalHT * 0.2,
          totalHT * 1.2,
          rightMargin,
          lineSpacing
        )
      } else {
        // Calculate total from items
        const totalFromItems = quoteItems.reduce((total, item) => {
          const product = products.find(p => p.id === item.product_id)
          return total + ((product?.price || 0) * item.quantity)
        }, 0)
        
        // Add other costs
        const totalHT = totalFromItems + (quote.traiteur_price || 0) + (quote.other_expenses || 0)
        
        addTotalsAndSignature(
          doc,
          finalY,
          pageWidth,
          totalHT,
          totalHT * 0.2,
          totalHT * 1.2,
          rightMargin,
          lineSpacing
        )
      }
      
      doc.save(`Devis_${quote.id}_${quote.last_name}_${new Date().toLocaleDateString('fr-FR')}.pdf`)
    }
    
    img.onerror = () => {
      console.error('Error loading logo image')
      toast.error('Erreur lors du chargement du logo')
    }
  }
  
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
    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    
    const totalHTText = `Total HT:  ${totalHT.toFixed(2)}€`
    const totalHTWidth = doc.getTextWidth(totalHTText)
    doc.text(totalHTText, pageWidth - rightMargin - totalHTWidth, startY)
    
    const tvaText = `TVA 20%:  ${tva.toFixed(2)}€`
    const tvaWidth = doc.getTextWidth(tvaText)
    doc.text(tvaText, pageWidth - rightMargin - tvaWidth, startY + lineSpacing)
    
    const totalTTCText = `Total TTC:  ${totalTTC.toFixed(2)}€`
    const totalTTCWidth = doc.getTextWidth(totalTTCText)
    doc.text(totalTTCText, pageWidth - rightMargin - totalTTCWidth, startY + (lineSpacing * 2))
    
    const signatureText = "Signature du client (précédée de la mention « Bon pour accord »)"
    const signatureBoxWidth = totalHTWidth + 80
    const signatureBoxHeight = 30
    const signatureBoxX = pageWidth - rightMargin - signatureBoxWidth
    const signatureBoxY = startY + (lineSpacing * 3)
    
    addSignatureAndCompanyInfo(doc, signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, signatureText, pageWidth)
  }
  
  const addSignatureAndCompanyInfo = (
    doc: any,
    signatureBoxX: number,
    signatureBoxY: number,
    signatureBoxWidth: number,
    signatureBoxHeight: number,
    signatureText: string,
    pageWidth: number
  ) => {
    doc.setFillColor(240, 240, 240)
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, 'F')
    
    doc.setFontSize(9)
    doc.setTextColor(133, 133, 132)
    const signatureTextWidth = doc.getTextWidth(signatureText)
    doc.text(signatureText, 
      signatureBoxX + (signatureBoxWidth - signatureTextWidth) / 2, 
      signatureBoxY + 7
    )
    
    doc.setTextColor(0)
  }

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
      <div className="flex flex-col items-center justify-center p-0 md:px-0">
        <div className="w-full max-w-5xl">
          <div className="mb-6 flex justify-between items-center">
            <Button variant="secondary" size="icon" onClick={handleGoBack}>
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            
            <Button 
              className="bg-gray-300 hover:bg-gray-400 whitespace-nowrap"
              variant="secondary"
              onClick={downloadPDF}
              disabled
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Télécharger le devis en PDF</span>
              <span className="inline sm:hidden">Télécharger PDF</span>
            </Button>
          </div>
          
          <div className="mb-4">
            <Label className="text-base">Numéro du devis</Label>
            <Input id="id" value={quote?.id ?? ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label htmlFor="color" className="text-base">Statut du devis</Label>
            <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-gray-100">
              <div 
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: quoteStatus.find(s => s.value === quote.status)?.color || '#999' }}
              />
              <span>{quoteStatus.find(s => s.value === quote.status)?.name || 'Inconnu'}</span>
            </div>
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
                      value={quote?.last_name ?? ''} 
                      className="w-full mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="first_name" className="text-sm text-gray-600">Prénom</Label>
                    <Input 
                      id="first_name" 
                      value={quote?.first_name ?? ''} 
                      className="w-full mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone_number" className="text-sm text-gray-600">Téléphone</Label>
                    <Input 
                      id="phone_number" 
                      value={quote?.phone_number ?? ''} 
                      className="w-full mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                    <Input 
                      id="email" 
                      value={quote?.email ?? ''} 
                      className="w-full mt-1 bg-gray-50" 
                      disabled
                    />
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
                      value={quote?.address?.voie ?? ''} 
                      className="w-full mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="compl" className="text-sm text-gray-600">Complément d'adresse</Label>
                    <Input 
                      id="compl" 
                      value={quote?.address?.compl ?? ''} 
                      className="w-full mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cp" className="text-sm text-gray-600">Code Postal</Label>
                      <Input 
                        id="cp" 
                        value={quote?.address?.cp ?? ''} 
                        className="w-full mt-1 bg-gray-50" 
                        disabled
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ville" className="text-sm text-gray-600">Ville</Label>
                      <Input 
                        id="ville" 
                        value={quote?.address?.ville ?? ''} 
                        className="w-full mt-1 bg-gray-50" 
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="depart" className="text-sm text-gray-600">Département</Label>
                      <Input 
                        id="depart" 
                        value={quote?.address?.depart ?? ''} 
                        className="w-full mt-1 bg-gray-50" 
                        disabled
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pays" className="text-sm text-gray-600">Pays</Label>
                      <Input 
                        id="pays" 
                        value={quote?.address?.pays ?? 'France'} 
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
                <Input 
                  value={formatDate(quote?.event_start_date)}
                  className="w-full mt-1 bg-gray-50"
                  disabled
                />
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="text-base font-medium mb-3 text-gray-700">Date de fin</h4>
                <Input 
                  value={formatDate(quote?.event_end_date)}
                  className="w-full mt-1 bg-gray-50"
                  disabled
                />
              </div>
            </div>
          </div>
          
          {/* Add Description Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <Textarea 
                value={quote?.description || 'Aucune description'}
                className="w-full min-h-[100px] bg-gray-50"
                disabled
              />
            </div>
          </div>
          
          {/* Products Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Produits du devis</h3>
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              {quoteItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Aucun produit dans ce devis</div>
              ) : (
                <div>
                  {/* Calculate pagination values here instead of using hooks */}
                  {(() => {
                    const totalItems = quoteItems.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                    
                    // Create items array
                    const allItems: QuoteDisplayItem[] = quoteItems.map((item, index) => ({
                      type: 'product' as const,
                      item,
                      index
                    }));
                    
                    // Get items for current page
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
                    const currentItems = allItems.slice(startIndex, endIndex);
                    
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <Table className="w-full">
                            <TableHeader>
                              <TableRow className="h-16">
                                <TableHead className="w-1/6 whitespace-nowrap">Image</TableHead>
                                <TableHead className="w-1/3 whitespace-nowrap">Nom</TableHead>
                                <TableHead className="w-1/6 whitespace-nowrap">Quantité</TableHead>
                                <TableHead className="w-1/6 whitespace-nowrap">Prix unitaire</TableHead>
                                <TableHead className="w-1/6 whitespace-nowrap">Total HT</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentItems.map((item, idx) => {
                                if (item.type === 'product') {
                                  const product = products.find(p => p.id === item.item.product_id);
                                  return (
                                    <TableRow key={`product-${idx}`} className="h-20">
                                      <TableCell className="align-middle">
                                        {product?.image_url ? (
                                          <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                            <img 
                                              src={product.image_url} 
                                              alt={product?.name || 'Product'} 
                                              className="object-cover w-full h-full"
                                            />
                                          </div>
                                        ) : (
                                          <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                            No image
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>{product?.name || `Produit inconnu (ID: ${item.item.product_id})`}</TableCell>
                                      <TableCell className="text-left">{item.item.quantity}</TableCell>
                                      <TableCell className="text-left">{(product?.price || 0).toFixed(2)}€</TableCell>
                                      <TableCell className="text-left">{((product?.price || 0) * item.item.quantity).toFixed(2)}€</TableCell>
                                    </TableRow>
                                  );
                                }
                                return null;
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {/* Pagination controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => setCurrentPage(1)}
                              disabled={currentPage === 1}
                              variant='outline'
                              aria-label="Première page"
                              className="flex"
                            >
                              <DoubleArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              variant='outline'
                              aria-label="Page précédente"
                            >
                              <ChevronLeftIcon className="h-4 w-4 sm:hidden" />
                              <span className="hidden sm:inline">Précédent</span>
                            </Button>
                          </div>
                          {/* Pagination text - for larger screens */}
                          <span className='hidden sm:block text-sm text-gray-500 text-center'>
                            <span>Page </span>
                            {currentPage}<span> sur </span>{totalPages}
                          </span>
                          {/* Pagination text for small screens - only visible on small screens */}
                          <span className='sm:hidden text-sm text-gray-500 text-center mt-2 w-full'>
                            {currentPage} / {totalPages}
                          </span>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              variant='outline'
                              aria-label="Page suivante"
                            >
                              <ChevronRightIcon className="h-4 w-4 sm:hidden" />
                              <span className="hidden sm:inline">Suivant</span>
                            </Button>
                            <Button 
                              onClick={() => setCurrentPage(totalPages)}
                              disabled={currentPage === totalPages}
                              variant='outline'
                              aria-label="Dernière page"
                              className="flex"
                            >
                              <DoubleArrowRightIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {/* Price and Payment Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Prix et Paiement</h3>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-4">
              <h4 className="text-base font-medium mb-3">Détail du prix</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="total_cost" className="text-sm text-gray-600">Prix total HT</Label>
                  <Input 
                    id="total_cost" 
                    value={quote?.total_cost?.toFixed(2) ?? '0.00'} 
                    className="w-full text-base font-semibold bg-gray-50" 
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="tva_amount" className="text-sm text-gray-600">TVA (20%)</Label>
                  <Input 
                    id="tva_amount" 
                    value={quote?.total_cost ? (quote.total_cost * 0.2).toFixed(2) : '0.00'} 
                    className="w-full text-base font-semibold bg-gray-50" 
                    disabled
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="total_cost_ttc" className="text-sm text-gray-600">Prix total TTC</Label>
                  <Input 
                    id="total_cost_ttc" 
                    value={quote?.total_cost ? (quote.total_cost * 1.2).toFixed(2) : '0.00'} 
                    className="w-full text-base font-semibold bg-gray-50" 
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
                      checked={quote?.is_traiteur ?? false}
                      disabled
                    />
                    <Label htmlFor="is_traiteur" className="text-base">Service traiteur</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="traiteur_price" className="text-sm text-gray-600">Prix traiteur HT</Label>
                    <Input 
                      id="traiteur_price" 
                      value={quote?.traiteur_price?.toFixed(2) ?? '0.00'} 
                      className="w-full text-base mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg bg-white">
                  <h4 className="text-base font-medium mb-3 text-gray-700">Frais supplémentaires</h4>
                  <div>
                    <Label htmlFor="other_expenses" className="text-sm text-gray-600">Montant HT</Label>
                    <Input 
                      id="other_expenses" 
                      value={quote?.other_expenses?.toFixed(2) ?? '0.00'} 
                      className="w-full text-base mt-1 bg-gray-50" 
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_deposit"
                    checked={quote?.is_deposit ?? false}
                    disabled
                    className="data-[state=checked]:bg-lime-500"
                  />
                  <Label htmlFor="is_deposit" className="text-base font-medium">Acompte versé (30%)</Label>
                </div>
                <div className="text-sm text-gray-500">
                  {quote?.is_deposit ? "Acompte payé" : "Acompte non payé"}
                </div>
              </div>
              
              {quote?.is_deposit && (
                <div>
                  <Label htmlFor="deposit_amount" className="text-sm text-gray-600">Montant de l'acompte TTC</Label>
                  <Input 
                    id="deposit_amount" 
                    value={quote?.deposit_amount?.toFixed(2) ?? '0.00'} 
                    className="w-full text-base font-semibold bg-gray-50"
                    disabled
                  />
                </div>
              )}

              <div className="mt-4">
                <Label className="text-sm text-gray-600">Montant restant à payer TTC</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={quote ? (
                    quote.is_paid 
                      ? "0.00"
                      : (() => {
                          // Calculate total payments
                          const totalPayments = quote.payments?.reduce(
                            (sum, payment) => sum + (payment.amount === null ? 0 : Number(payment.amount)),
                            0
                          ) || 0;
                          
                          // Calculate remaining amount based on deposit status
                          const totalTTC = quote.total_cost * 1.2;
                          const remainingAmount = quote.is_deposit 
                            ? totalTTC * 0.7 - totalPayments
                            : totalTTC - totalPayments;
                          
                          return Math.max(0, remainingAmount).toFixed(2);
                        })()
                  ) : '0.00'} 
                  className="w-full text-base font-semibold bg-gray-50"
                  disabled
                />
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white mb-6">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-medium">Modes de Paiement</Label>
              </div>
              
              {(!quote?.payments || quote.payments.length === 0) && (
                <div className="text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-md">
                  Aucun paiement enregistré
                </div>
              )}
              
              {quote?.payments?.map((payment, index) => (
                <div key={index} className="flex gap-4 mb-4 p-3 border border-gray-100 rounded-md bg-gray-50">
                  <div className="flex-1">
                    <Label className="text-sm text-gray-600">Mode de paiement</Label>
                    <Input
                      value={paymentModes.find(mode => mode.value === payment.mode)?.name || payment.mode}
                      className="w-full mt-1 bg-gray-50"
                      disabled
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-sm text-gray-600">Montant</Label>
                    <Input
                      type="number"
                      value={payment.amount?.toFixed(2) ?? '0.00'}
                      className="w-full mt-1 bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              ))}
              
              {quote?.payments && quote.payments.length > 0 && (
                <div className="mt-4 p-3 border border-lime-100 rounded-md bg-lime-50">
                  <Label className="text-sm text-gray-600">Total payé</Label>
                  <Input
                    type="number"
                    value={quote.payments.reduce((sum, payment) => 
                      sum + (payment.amount === null ? 0 : Number(payment.amount)), 
                      0
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
                    checked={quote?.is_paid ?? false}
                    disabled
                    className="data-[state=checked]:bg-lime-500"
                  />
                  <Label htmlFor="is_paid" className="text-base font-medium">Payé intégralement</Label>
                </div>
                {quote?.is_paid && (
                  <div className="px-3 py-1 bg-lime-100 text-lime-800 text-sm font-medium rounded-full">
                    Payé
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="text-base">Date de création du devis</Label>
            <Input 
              value={quote?.created_at ? new Date(quote.created_at).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} 
              className="w-full text-base bg-gray-50" 
              disabled 
            />
          </div>
          
          <div className="mb-20">
            <Label className="text-base">Date de dernière mise à jour du devis</Label>
            <Input 
              value={quote?.last_update ? new Date(quote.last_update).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} 
              className="w-full text-base bg-gray-50" 
              disabled 
            />
          </div>
        </div>
      </div>
    </>
  )
}