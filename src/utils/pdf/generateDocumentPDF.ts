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

      // Track current page for multi-page documents
      let currentPage = 1;

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

      // Only show terms and conditions at the top for quotes
      if (documentType === DocumentType.QUOTE) {
        doc.text("Termes et conditions", 15, lastClientInfoY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text("Devis valable un mois", 15, lastClientInfoY + 20);
        doc.text("Un acompte de 30% est requis", 15, lastClientInfoY + 25);
      }

      // Add address section on the right
      doc.setFont('helvetica', 'bold');
      const addressTitle = "Adresse de récupération du matériel";
      const addressTitleWidth = doc.getTextWidth(addressTitle);
      doc.text(addressTitle, pageWidth - 15 - addressTitleWidth, lastClientInfoY + 15);

      doc.setFont('helvetica', 'normal');
      const addressText = "Chemin des droits de l'homme et du citoyen, 31450 Ayguevives";
      const addressWidth = doc.getTextWidth(addressText);
      doc.text(addressText, pageWidth - 15 - addressWidth, lastClientInfoY + 20);

      // Separate products into categories
      const decorationProducts: any[] = [];
      const traiteurProducts: any[] = [];

      quoteItems.forEach(item => {
        const product = products.find((p: Product) => p.id === item.product_id);
        if (!product) return;

        const unitPriceHT = product.price || 0;
        const subtotalHT = unitPriceHT * item.quantity;
        
        const productItem = {
          name: product.name || 'Produit inconnu',
          quantity: item.quantity,
          unitPrice: unitPriceHT,
          totalPrice: subtotalHT.toFixed(2)
        };

        // Categorize based on product type (assuming there's a category field)
        // You may need to adjust this logic based on your actual data structure
        if (product.category === 'traiteur') {
          traiteurProducts.push(productItem);
        } else {
          decorationProducts.push(productItem);
        }
      });

      // Add other costs if applicable
      if (quote.is_traiteur && quote.traiteur_price) {
        traiteurProducts.push({
          name: 'Service traiteur',
          quantity: 1,
          unitPrice: quote.traiteur_price,
          totalPrice: quote.traiteur_price.toFixed(2)
        });
      }
      
      if (quote.other_expenses && quote.other_expenses > 0) {
        decorationProducts.push({
          name: 'Frais supplémentaires',
          quantity: 1,
          unitPrice: quote.other_expenses,
          totalPrice: quote.other_expenses.toFixed(2)
        });
      }

      // We'll count pages as we create them
      let totalPages = 1;

      // Create a function to update all footers with the correct page count
      const updateAllFooters = () => {
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          
          // Clear the area where page numbers will be drawn
          const pageNumberY = pageHeight - 5;
          const clearWidth = 30; // Width of area to clear
          doc.setFillColor(255, 255, 255); // White background
          doc.rect(
            doc.internal.pageSize.getWidth() - 15 - clearWidth, 
            pageNumberY - 5, 
            clearWidth, 
            8, 
            'F'
          );
          
          addFooter(doc, pageHeight, i, totalPages);
        }
      };

      // Now use this totalPages value consistently throughout the document
      const addFooter = (doc: any, pageHeight: number, currentPage: number = 1, totalPages: number = 1) => {
        const footerY = pageHeight - 35;

        // Add horizontal line
        doc.setDrawColor(168, 168, 168);
        doc.setLineWidth(0.5);
        doc.line(15, footerY, pageWidth - 15, footerY);

        // Add the three sections below the line
        doc.setFontSize(7);
        
        // MG Événements section
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(89, 89, 89);
        doc.text("MG Événements", 15, footerY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text("Entreprise Individuelle\nChemin des droits de l'homme\net du citoyen, 31450 Ayguevives\nSIREN : 918 638 008\nNuméro de TVA : FR88918638008\nCode APE : 82.30Z", 15, footerY + 10);

        // MG Traiteur section
        const traiteurX = (pageWidth / 4) + 10;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(89, 89, 89);
        doc.text("MG Traiteur", traiteurX, footerY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text("Entreprise Individuelle\nSIREN : 911 582 468\nNuméro de TVA : FR88918638008\nCode APE : 5621Z", traiteurX, footerY + 10);

        // Contact section
        const contactX = (2 * pageWidth) / 4;
        doc.setFont('helvetica', 'bold');
        doc.text("Coordonnées", contactX, footerY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text("Mani Grimaudo\n07 68 10 96 17\nmgevenementiel31@gmail.com\nwww.mgevenements.fr", contactX, footerY + 10);

        // Bank details section
        const bankX = ((3 * pageWidth) / 4) - 10;
        doc.setFont('helvetica', 'bold');
        doc.text("Coordonnées bancaires", bankX, footerY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text("IBAN FR76 2823 3000 0113 2935 6527 041\nCode BIC / SWIFT REVOFRP2\nPaypal: mani.grimaudo@icloud.com", bankX, footerY + 10);
        
        // Add page numbers
        doc.setFontSize(8);
        const text = `Page ${currentPage} sur ${totalPages}`;
        const textWidth = doc.getTextWidth(text);
        doc.text(
          text,
          doc.internal.pageSize.getWidth() - 15 - textWidth,
          pageHeight - 5
        );
      };

      // Start with client info section
      let finalY = lastClientInfoY + 30;

      // Add decoration products table if there are any
      if (decorationProducts.length > 0) {
        // Add a title for the decoration table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("Matériel et Décoration", 15, finalY + 7);
        finalY += 10;
        
        // Create table with styling to match autoTable
        const tableStartY = finalY;
        const tableWidth = pageWidth - 30; // 15px margin on each side
        const colWidths = [tableWidth - 110, 30, 40, 40]; // Match the columnStyles from autoTable
        const rowHeight = 8; // Reduced row height
        
        // Draw table header (match headStyles from autoTable)
        doc.setFillColor(50, 50, 50);
        doc.rect(15, tableStartY, tableWidth, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8); // Smaller font size
        doc.setFont('helvetica', 'bold');
        
        // Header text alignment to match autoTable
        doc.text("Produit", 17, tableStartY + 6); // Adjusted for smaller row height
        doc.text("Quantité", 15 + colWidths[0] + 5, tableStartY + 6);
        doc.text("Prix unitaire HT", 15 + colWidths[0] + colWidths[1] + 5, tableStartY + 6);
        doc.text("Sous-Total HT", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableStartY + 6);
        
        // Draw table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        let currentY = tableStartY + rowHeight;
        
        decorationProducts.forEach((item: any, index: number) => {
          // Check if we need to add a new page
          if (currentY + rowHeight > pageHeight - 60) {
            doc.addPage();
            currentPage++;
            totalPages++; // Increment total pages when adding a page
            addFooter(doc, pageHeight, currentPage, totalPages);
            currentY = 20;
            
            // Redraw header on new page
            doc.setFillColor(50, 50, 50);
            doc.rect(15, currentY, tableWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text("Produit", 17, currentY + 6);
            doc.text("Quantité", 15 + colWidths[0] + 5, currentY + 6);
            doc.text("Prix unitaire HT", 15 + colWidths[0] + colWidths[1] + 5, currentY + 6);
            doc.text("Sous-Total HT", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 6);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            currentY += rowHeight;
          }
          
          // Draw row background (alternating colors like autoTable)
          doc.setFillColor(index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 245);
          doc.rect(15, currentY, tableWidth, rowHeight, 'F');
          
          // Draw cell content with proper alignment
          doc.setFontSize(8);
          
          // Product name (left aligned with ellipsis if too long)
          const name = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name;
          doc.text(name, 17, currentY + 6);
          
          // Quantity (center aligned)
          const qtyText = item.quantity.toString();
          const qtyWidth = doc.getTextWidth(qtyText);
          doc.text(qtyText, 15 + colWidths[0] + (colWidths[1] / 2) - (qtyWidth / 2), currentY + 6);
          
          // Unit price (right aligned)
          const unitPrice = `${(Number(item.totalPrice) / item.quantity).toFixed(2)}€`;
          const unitPriceWidth = doc.getTextWidth(unitPrice);
          doc.text(unitPrice, 15 + colWidths[0] + colWidths[1] + colWidths[2] - 5 - unitPriceWidth, currentY + 6);
          
          // Total price (right aligned)
          const totalPrice = `${item.totalPrice}€`;
          const totalPriceWidth = doc.getTextWidth(totalPrice);
          doc.text(totalPrice, 15 + tableWidth - 5 - totalPriceWidth, currentY + 6);
          
          currentY += rowHeight;
        });
        
        // Add decoration subtotal row
        const decorationTotal = decorationProducts.reduce(
          (sum: number, item: any) => sum + Number(item.totalPrice), 
          0
        ).toFixed(2);
        
        // Check if we need to add a new page
        if (currentY + rowHeight > pageHeight - 60) {
          doc.addPage();
          currentPage++;
          totalPages++; // Increment total pages when adding a page
          addFooter(doc, pageHeight, currentPage, totalPages);
          currentY = 20;
        }
        
        // Draw subtotal row with styling to match autoTable
        doc.setFillColor(240, 240, 240);
        doc.rect(15, currentY, tableWidth, rowHeight, 'F');
        doc.setFont('helvetica', 'bold');
        
        // Subtotal text (right aligned in the third column)
        const subtotalText = "Sous-total Décoration:";
        const subtotalTextWidth = doc.getTextWidth(subtotalText);
        doc.text(subtotalText, 15 + colWidths[0] + colWidths[1] + colWidths[2] - 5 - subtotalTextWidth, currentY + 6);
        
        // Subtotal amount (right aligned in the fourth column)
        const subtotalAmount = `${decorationTotal}€`;
        const subtotalAmountWidth = doc.getTextWidth(subtotalAmount);
        doc.text(subtotalAmount, 15 + tableWidth - 5 - subtotalAmountWidth, currentY + 6);
        
        finalY = currentY + rowHeight + 15; // Add more space between tables
      }
      
      // Check if there's enough space for the traiteur table
      // Calculate how much space the traiteur table will need
      const traiteurTableHeight = traiteurProducts.length > 0 
        ? (traiteurProducts.length + 2) * 8 + 20 // rows + header + subtotal + padding
        : 0;

      // If there's not enough space, add a new page before the traiteur table
      if (traiteurProducts.length > 0 && finalY + traiteurTableHeight > pageHeight - 60) {
        doc.addPage();
        currentPage++;
        totalPages++; // Increment total pages when adding a page
        addFooter(doc, pageHeight, currentPage, totalPages);
        finalY = 20;
      }

      // Add traiteur products table if there are any
      if (traiteurProducts.length > 0) {
        // Add a title for the traiteur table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("Traiteur", 15, finalY + 7);
        finalY += 10;
        
        // Create table with styling to match autoTable
        const tableStartY = finalY;
        const tableWidth = pageWidth - 30; // 15px margin on each side
        const colWidths = [tableWidth - 110, 30, 40, 40]; // Match the columnStyles from autoTable
        const rowHeight = 8; // Reduced row height
        
        // Draw table header (match headStyles from autoTable)
        doc.setFillColor(50, 50, 50);
        doc.rect(15, tableStartY, tableWidth, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8); // Smaller font size
        doc.setFont('helvetica', 'bold');
        
        // Header text alignment to match autoTable
        doc.text("Produit", 17, tableStartY + 6); // Adjusted for smaller row height
        doc.text("Quantité", 15 + colWidths[0] + 5, tableStartY + 6);
        doc.text("Prix unitaire HT", 15 + colWidths[0] + colWidths[1] + 5, tableStartY + 6);
        doc.text("Sous-Total HT", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableStartY + 6);
        
        // Draw table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        let currentY = tableStartY + rowHeight;
        
        traiteurProducts.forEach((item: any, index: number) => {
          // Check if we need to add a new page
          if (currentY + rowHeight > pageHeight - 60) {
            doc.addPage();
            currentPage++;
            totalPages++; // Increment total pages when adding a page
            addFooter(doc, pageHeight, currentPage, totalPages);
            currentY = 20;
            
            // Redraw header on new page
            doc.setFillColor(50, 50, 50);
            doc.rect(15, currentY, tableWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text("Produit", 17, currentY + 6);
            doc.text("Quantité", 15 + colWidths[0] + 5, currentY + 6);
            doc.text("Prix unitaire HT", 15 + colWidths[0] + colWidths[1] + 5, currentY + 6);
            doc.text("Sous-Total HT", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 6);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            currentY += rowHeight;
          }
          
          // Draw row background (alternating colors like autoTable)
          doc.setFillColor(index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 245);
          doc.rect(15, currentY, tableWidth, rowHeight, 'F');
          
          // Draw cell content with proper alignment
          doc.setFontSize(8);
          
          // Product name (left aligned with ellipsis if too long)
          const name = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name;
          doc.text(name, 17, currentY + 6);
          
          // Quantity (center aligned)
          const qtyText = item.quantity.toString();
          const qtyWidth = doc.getTextWidth(qtyText);
          doc.text(qtyText, 15 + colWidths[0] + (colWidths[1] / 2) - (qtyWidth / 2), currentY + 6);
          
          // Unit price (right aligned)
          const unitPrice = `${(Number(item.totalPrice) / item.quantity).toFixed(2)}€`;
          const unitPriceWidth = doc.getTextWidth(unitPrice);
          doc.text(unitPrice, 15 + colWidths[0] + colWidths[1] + colWidths[2] - 5 - unitPriceWidth, currentY + 6);
          
          // Total price (right aligned)
          const totalPrice = `${item.totalPrice}€`;
          const totalPriceWidth = doc.getTextWidth(totalPrice);
          doc.text(totalPrice, 15 + tableWidth - 5 - totalPriceWidth, currentY + 6);
          
          currentY += rowHeight;
        });
        
        // Add traiteur subtotal row
        const traiteurTotal = traiteurProducts.reduce(
          (sum: number, item: any) => sum + Number(item.totalPrice), 
          0
        ).toFixed(2);
        
        // Check if we need to add a new page
        if (currentY + rowHeight > pageHeight - 60) {
          doc.addPage();
          currentPage++;
          totalPages++; // Increment total pages when adding a page
          addFooter(doc, pageHeight, currentPage, totalPages);
          currentY = 20;
        }
        
        // Draw subtotal row with styling to match autoTable
        doc.setFillColor(240, 240, 240);
        doc.rect(15, currentY, tableWidth, rowHeight, 'F');
        doc.setFont('helvetica', 'bold');
        
        // Subtotal text (right aligned in the third column)
        const subtotalText = "Sous-total Traiteur:";
        const subtotalTextWidth = doc.getTextWidth(subtotalText);
        doc.text(subtotalText, 15 + colWidths[0] + colWidths[1] + colWidths[2] - 5 - subtotalTextWidth, currentY + 6);
        
        // Subtotal amount (right aligned in the fourth column)
        const subtotalAmount = `${traiteurTotal}€`;
        const subtotalAmountWidth = doc.getTextWidth(subtotalAmount);
        doc.text(subtotalAmount, 15 + tableWidth - 5 - subtotalAmountWidth, currentY + 6);
        
        finalY = currentY + rowHeight + 10;
      }

      // Calculate total from items
      const totalHT = [...decorationProducts, ...traiteurProducts].reduce(
        (sum, item) => sum + Number(item.totalPrice), 
        0
      );
      
      const tva = totalHT * 0.2;
      const totalTTC = totalHT * 1.2;

      // Check if there's enough space for totals and signature
      const requiredSpace = 80;
      
      // If there isn't enough space, add a new page
      if (finalY + requiredSpace > pageHeight) {
        doc.addPage();
        currentPage++;
        totalPages++; // Increment total pages when adding a page
        addFooter(doc, pageHeight, currentPage, totalPages);
        addTotalsAndSignature(
          doc,
          20,
          pageWidth,
          totalHT,
          tva,
          totalTTC,
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
          tva,
          totalTTC,
          rightMargin,
          lineSpacing,
          documentType
        );
      }
      
      // Then at the end of the document generation:
      updateAllFooters();
      
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
  
  // Add signature box only for quotes or terms and conditions for invoices
  if (documentType === DocumentType.QUOTE) {
    // Place signature box at the same level as the totals box
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Signature du client", 15, startY);
    doc.setFont('helvetica', 'normal');
    doc.text("(précédée de la mention « Bon pour accord »)", 15, startY + 5);
    
    // Draw signature box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, startY + 10, 85, lineSpacing * 4);
  } else {
    // Add terms and conditions for invoices after the totals
    const termsY = startY + (lineSpacing * 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("Termes et conditions", 15, termsY);
    doc.setFont('helvetica', 'normal');
    doc.text("Date d'échéance : Paiement sous 30 jours à compter de la facture, sauf accord contraire.\nPénalités de retard : Intérêts de retard au taux légal en vigueur en cas de retard.\nIndemnité de recouvrement : 40 € dus uniquement pour les professionnels (art. L441-10 C. com.).\nDates de réalisation de la prestation : Dates de l'événement.", 15, termsY + 5);

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