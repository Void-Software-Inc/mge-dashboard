import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Quote, FinishedQuote, QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";

// Type to handle both Quote and FinishedQuote
type AnyQuote = Quote | FinishedQuote;

// Document type enum
export enum DocumentType {
  QUOTE = 'Devis',
  INVOICE = 'Facture'
}

const formatDateToParisTime = (dateString?: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export const generateDocumentPDF = (
  quote: AnyQuote,
  quoteItems: QuoteItem[],
  products: Product[],
  documentType: DocumentType = DocumentType.QUOTE // Default to quote
) => {
  if (!quote) return null;

  const img = new Image();
  const logoPath = `${window.location.origin}/quote-mg-events.png`;
  img.crossOrigin = "anonymous";
  img.src = logoPath;

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const originalWidth = 788;
      const originalHeight = 380;
      const desiredWidth = 65;
      const scaledHeight = (desiredWidth * originalHeight) / originalWidth;
      
      // Generate the actual document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const rightMargin = 15;
      const lineSpacing = 7;

      doc.setFontSize(50);
      doc.setTextColor(51);
      doc.text(documentType, 15, 30);
      doc.setTextColor(0);

      doc.addImage(img, 'PNG', 133, 5, desiredWidth, scaledHeight);

      const contentStartY = 5 + scaledHeight;

      const quoteDate = new Date().toLocaleDateString('fr-FR');
      
      // Date and document info on the left
      doc.setFontSize(9);

      // Date
      doc.setFont('helvetica', 'bold');
      doc.text("Date:", 15, contentStartY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(quoteDate, 15 + doc.getTextWidth("Date:   "), contentStartY + 15);

      // Document number
      doc.setFont('helvetica', 'bold');
      doc.text(`Numéro ${documentType.toLowerCase()}: `, 15, contentStartY + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(quote.id.toString(), 15 + doc.getTextWidth(`Numéro ${documentType.toLowerCase()}:   `), contentStartY + 21);

      // Event dates
      const eventFromDate = formatDateToParisTime(quote.event_start_date);
      const eventToDate = formatDateToParisTime(quote.event_end_date);
      const eventDateValue = eventFromDate === eventToDate ? eventFromDate : `du ${eventFromDate} au ${eventToDate}`;
      doc.setFont('helvetica', 'bold');
      doc.text("Date(s) de l'événement:", 15, contentStartY + 27);
      doc.setFont('helvetica', 'normal');
      doc.text(eventDateValue, 15, contentStartY + 33);

      // Traiteur option
      const traiteurValue = quote.is_traiteur ? 'Oui' : 'Non';
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
        `${quote.first_name} ${quote.last_name}`,
        quote.email,
        quote.phone_number,
        quote.address?.voie ? `${quote.address.voie}${quote.address?.compl ? `, ${quote.address.compl}` : ''}` : '',
        quote.address?.cp || quote.address?.ville ? `${quote.address?.cp || ''} ${quote.address?.ville || ''}`.trim() : '',
        quote.address?.depart || ''
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
      const data = quoteItems.map(item => {
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

      // Add other costs if applicable
      if (quote.is_traiteur && quote.traiteur_price) {
        data.push([
          'Service traiteur',
          '1',
          `${quote.traiteur_price.toFixed(2)}€`,
          `${quote.traiteur_price.toFixed(2)}€`,
        ]);
      }
      
      if (quote.other_expenses && quote.other_expenses > 0) {
        data.push([
          'Frais supplémentaires',
          '1',
          `${quote.other_expenses.toFixed(2)}€`,
          `${quote.other_expenses.toFixed(2)}€`,
        ]);
      }

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

      // Add the table
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
      const requiredSpace = 120;

      // Calculate total from items
      const totalFromItems = quoteItems.reduce((total, item) => {
        const product = products.find(p => p.id === item.product_id);
        return total + ((product?.price || 0) * item.quantity);
      }, 0);
      
      // Add other costs
      const totalHT = totalFromItems + (quote.traiteur_price || 0) + (quote.other_expenses || 0);
      
      if (finalY + requiredSpace > pageHeight) {
        doc.addPage();
        addFooter(doc, pageHeight);
        
        addTotalsAndSignature(
          doc,
          20,
          pageWidth,
          totalHT,
          totalHT * 0.2,
          totalHT * 1.2,
          rightMargin,
          lineSpacing,
          documentType
        );
      } else {
        addTotalsAndSignature(
          doc,
          finalY,
          pageWidth,
          totalHT,
          totalHT * 0.2,
          totalHT * 1.2,
          rightMargin,
          lineSpacing,
          documentType
        );
      }
      
      const fileName = documentType === DocumentType.QUOTE 
        ? `Devis_${quote.id}_${quote.last_name}_${new Date().toLocaleDateString('fr-FR')}.pdf`
        : `Facture_${quote.id}_${quote.last_name}_${new Date().toLocaleDateString('fr-FR')}.pdf`;
      
      doc.save(fileName);
      resolve();
    };
    
    img.onerror = () => {
      console.error('Error loading logo image from:', logoPath);
      reject(new Error('Error loading logo image'));
    };
  });
};

// Helper function to add totals and signature
const addTotalsAndSignature = (
  doc: any,
  startY: number,
  pageWidth: number,
  totalHT: number,
  tva: number,
  totalTTC: number,
  rightMargin: number,
  lineSpacing: number,
  documentType: DocumentType
) => {
  // Add totals section
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Draw a light gray background for the totals section
  doc.setFillColor(245, 245, 245);
  doc.rect(pageWidth - 97, startY, 85, lineSpacing * 4, 'F');
  
  // Total HT
  doc.setFont('helvetica', 'bold');
  doc.text("Total HT:", pageWidth - 95, startY + lineSpacing);
  doc.setFont('helvetica', 'normal');
  const totalHTText = `${totalHT.toFixed(2)}€`;
  const totalHTWidth = doc.getTextWidth(totalHTText);
  doc.text(totalHTText, pageWidth - rightMargin - totalHTWidth, startY + lineSpacing);
  
  // TVA
  doc.setFont('helvetica', 'bold');
  doc.text("TVA 20%:", pageWidth - 95, startY + (lineSpacing * 2));
  doc.setFont('helvetica', 'normal');
  const tvaText = `${tva.toFixed(2)}€`;
  const tvaWidth = doc.getTextWidth(tvaText);
  doc.text(tvaText, pageWidth - rightMargin - tvaWidth, startY + (lineSpacing * 2));
  
  // Total TTC
  doc.setFont('helvetica', 'bold');
  doc.text("Total TTC:", pageWidth - 95, startY + (lineSpacing * 3));
  doc.setFont('helvetica', 'normal');
  const totalTTCText = `${totalTTC.toFixed(2)}€`;
  const totalTTCWidth = doc.getTextWidth(totalTTCText);
  doc.text(totalTTCText, pageWidth - rightMargin - totalTTCWidth, startY + (lineSpacing * 3));
  
  // Add signature box only for quotes
  if (documentType === DocumentType.QUOTE) {
    const signatureY = startY + (lineSpacing * 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Signature du client", 15, signatureY);
    doc.setFont('helvetica', 'normal');
    doc.text("(précédée de la mention « Bon pour accord »)", 15, signatureY + 5);
    
    // Draw signature box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, signatureY + 10, 80, 40);
  }
};

// Export the original function for backward compatibility
export const generateQuotePDF = (
  quote: AnyQuote,
  quoteItems: QuoteItem[],
  products: Product[]
) => {
  return generateDocumentPDF(quote, quoteItems, products, DocumentType.QUOTE);
};

// Export a dedicated function for invoices
export const generateInvoicePDF = (
  quote: AnyQuote,
  quoteItems: QuoteItem[],
  products: Product[]
) => {
  return generateDocumentPDF(quote, quoteItems, products, DocumentType.INVOICE);
}; 