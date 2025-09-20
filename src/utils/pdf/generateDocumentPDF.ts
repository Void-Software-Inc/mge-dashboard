import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Quote, FinishedQuote, QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";

// Type to handle both Quote and FinishedQuote
type AnyQuote = (Quote | FinishedQuote) & {
  options?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
};

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
  documentType: DocumentType = DocumentType.QUOTE, // Default to quote
  showHtTtc: boolean = true // New parameter to control HT/TTC display
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
      
      // Create client info array, including company name if present
      const clientInfo = [];
      
      // Clean up potential duplicate names in first_name field
      const cleanFirstName = quote.first_name?.trim() || '';
      const cleanLastName = quote.last_name?.trim() || '';
      
      // Check if first_name already contains the last name to avoid duplication
      const fullName = cleanFirstName.includes(cleanLastName) 
        ? cleanFirstName 
        : `${cleanFirstName} ${cleanLastName}`.trim();

      if (quote.raison_sociale) {
        // Company client: show company name first, then individual name, then contact info
        clientInfo.push(
          quote.raison_sociale,
          fullName,
          quote.email,
          quote.phone_number
        );
      } else {
        // Individual client: show individual name first, then contact info
        clientInfo.push(
          fullName,
          quote.email,
          quote.phone_number
        );
      }
      
      // Add address information (same for both company and individual)
      if (quote.address?.voie) {
        clientInfo.push(`${quote.address.voie}${quote.address?.compl ? `, ${quote.address.compl}` : ''}`);
      }
      if (quote.address?.cp || quote.address?.ville) {
        clientInfo.push(`${quote.address?.cp || ''} ${quote.address?.ville || ''}`.trim());
      }
      if (quote.address?.depart) {
        clientInfo.push(quote.address.depart);
      }
      
      // Filter out any empty lines
      const filteredClientInfo = clientInfo.filter(line => line && line.trim() !== '');

      // Fixed position for the last line
      const lastClientInfoY = contentStartY + 21 + (5 * 6); // 5 is the number of spaces between 6 lines

      filteredClientInfo.forEach((line, index) => {
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
      const addressText = "14 Allée Chantecaille, 31670 Labège";
      const addressWidth = doc.getTextWidth(addressText);
      doc.text(addressText, pageWidth - 15 - addressWidth, lastClientInfoY + 20);

      // Separate products into categories
      const decorationProducts: any[] = [];
      const traiteurProducts: any[] = [];

      quoteItems.forEach(item => {
        const product = products.find((p: Product) => p.id === item.product_id);
        if (!product) return;

        const unitPriceTTC = product.ttc_price || 0;
        const subtotalTTC = unitPriceTTC * item.quantity;
        
        const productItem = {
          name: product.name || 'Produit inconnu',
          quantity: item.quantity,
          unitPrice: showHtTtc ? unitPriceTTC / 1.20 : unitPriceTTC,
          totalPrice: showHtTtc ? (subtotalTTC / 1.20).toFixed(2) : subtotalTTC.toFixed(2)
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
          unitPrice: showHtTtc ? quote.traiteur_price : quote.traiteur_price * 1.20,
          totalPrice: showHtTtc ? quote.traiteur_price.toFixed(2) : (quote.traiteur_price * 1.20).toFixed(2)
        });
      }
      
      if (quote.other_expenses && quote.other_expenses > 0) {
        decorationProducts.push({
          name: 'Frais supplémentaires',
          quantity: 1,
          unitPrice: showHtTtc ? quote.other_expenses : quote.other_expenses * 1.20,
          totalPrice: showHtTtc ? quote.other_expenses.toFixed(2) : (quote.other_expenses * 1.20).toFixed(2)
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
        doc.text("Entreprise Individuelle\nSIREN : 918 638 008\nNuméro de TVA : FR88918638008\nCode APE : 82.30Z", 15, footerY + 10);

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
        doc.text("IBAN IE03 MPOS 9903 9021 1561 79\nCode BIC/SWIFT MPOSIE2D\nÉtablissement: myPOS Ltd\nPaypal: mani.grimaudo@icloud.com", bankX, footerY + 10);

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
        doc.text(showHtTtc ? "Prix unitaire HT" : "Prix unitaire", 15 + colWidths[0] + colWidths[1] + 5, tableStartY + 6);
        doc.text(showHtTtc ? "Sous-Total HT" : "Sous-Total", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableStartY + 6);
        
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
            doc.text(showHtTtc ? "Prix unitaire HT" : "Prix unitaire", 15 + colWidths[0] + colWidths[1] + 5, currentY + 6);
            doc.text(showHtTtc ? "Sous-Total HT" : "Sous-Total", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 6);
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
        doc.text(showHtTtc ? "Prix unitaire HT" : "Prix unitaire", 15 + colWidths[0] + colWidths[1] + 5, tableStartY + 6);
        doc.text(showHtTtc ? "Sous-Total HT" : "Sous-Total", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableStartY + 6);
        
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
            doc.text(showHtTtc ? "Prix unitaire HT" : "Prix unitaire", 15 + colWidths[0] + colWidths[1] + 5, currentY + 6);
            doc.text(showHtTtc ? "Sous-Total HT" : "Sous-Total", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 6);
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

      // Add options table (always shown, even if empty)
      // Check if we need to add a new page before starting the options section
      // We need space for: title (17px) + spacing (10px) + table header (8px) + at least one row (8px)
      const requiredSpaceForOptions = 17 + 10 + 8 + 8;
      if (finalY + requiredSpaceForOptions > pageHeight - 60) {
        doc.addPage();
        currentPage++;
        totalPages++; // Increment total pages when adding a page
        addFooter(doc, pageHeight, currentPage, totalPages);
        finalY = 20;
      }

      // Add a title for the options table
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text("Options", 15, finalY + 7);
      finalY += 10;
      
      // Create table with styling to match autoTable
      doc.setTextColor(255, 255, 255);
      const tableStartY = finalY;
      const tableWidth = pageWidth - 30; // 15px margin on each side
      const colWidths = [tableWidth - 110, 30, 40, 40]; // Match the columnStyles from autoTable
      const rowHeight = 8; // Reduced row height

      // Mapping for option names
      const optionNameMapping: { [key: string]: string } = {
        'marquee_setup': 'Montage et installation pour barnum',
        'delivery': 'Livraison',
        'marquee_dismantling': 'Démontage du barnum',
        'pickup': 'Récupération du matériel',
        'decoration': 'Décoration',
        'table_service': 'Service à table',
      };
      
      // Draw table header (match headStyles from autoTable)
      doc.setFillColor(50, 50, 50);
      doc.rect(15, finalY, tableWidth, rowHeight, 'F');
      doc.setFontSize(8); // Smaller font size
      doc.setFont('helvetica', 'bold');
      
      // Header text alignment to match autoTable
      doc.text("Option", 17, finalY + 6); // Adjusted for smaller row height
      doc.text("Quantité", 15 + colWidths[0] + 5, finalY + 6);
      doc.text(showHtTtc ? "Prix unitaire HT" : "Prix unitaire", 15 + colWidths[0] + colWidths[1] + 5, finalY + 6);
      doc.text(showHtTtc ? "Sous-Total HT" : "Sous-Total", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, finalY + 6);
      
      // Draw table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      let currentY = finalY + rowHeight;
      
      // Add options if they exist
      if (quote.fees && quote.fees.length > 0) {
        quote.fees.forEach((fee: any, index: number) => {
          if (!fee.enabled) return; // Skip disabled fees
          
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
            doc.text("Option", 17, currentY + 6);
            doc.text("Quantité", 15 + colWidths[0] + 5, currentY + 6);
            doc.text(showHtTtc ? "Prix unitaire HT" : "Prix unitaire", 15 + colWidths[0] + colWidths[1] + 5, currentY + 6);
            doc.text(showHtTtc ? "Sous-Total HT" : "Sous-Total", 15 + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 6);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            currentY += rowHeight;
          }
          
          // Draw row background (alternating colors like autoTable)
          doc.setFillColor(index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 245);
          doc.rect(15, currentY, tableWidth, rowHeight, 'F');
          
          // Draw cell content with proper alignment
          doc.setFontSize(8);
          
          // Option name (left aligned with ellipsis if too long)
          const displayName = optionNameMapping[fee.name] || fee.name;
          const name = displayName.length > 40 ? displayName.substring(0, 37) + "..." : displayName;
          doc.text(name, 17, currentY + 6);
          
          // Quantity (center aligned)
          const qtyText = "1";
          const qtyWidth = doc.getTextWidth(qtyText);
          doc.text(qtyText, 15 + colWidths[0] + (colWidths[1] / 2) - (qtyWidth / 2), currentY + 6);
          
          // Unit price (right aligned)
          const unitPrice = `${(showHtTtc ? fee.price : fee.price * 1.20).toFixed(2)}€`;
          const unitPriceWidth = doc.getTextWidth(unitPrice);
          doc.text(unitPrice, 15 + colWidths[0] + colWidths[1] + colWidths[2] - 5 - unitPriceWidth, currentY + 6);
          
          // Total price (right aligned)
          const totalPrice = `${(showHtTtc ? fee.price : fee.price * 1.20).toFixed(2)}€`;
          const totalPriceWidth = doc.getTextWidth(totalPrice);
          doc.text(totalPrice, 15 + tableWidth - 5 - totalPriceWidth, currentY + 6);
          
          currentY += rowHeight;
        });
        
        // Add options subtotal row
        const optionsTotal = quote.fees.reduce(
          (sum: number, fee: any) => sum + (fee.enabled ? (showHtTtc ? fee.price : fee.price * 1.20) : 0), 
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
        const subtotalText = "Sous-total Options:";
        const subtotalTextWidth = doc.getTextWidth(subtotalText);
        doc.text(subtotalText, 15 + colWidths[0] + colWidths[1] + colWidths[2] - 5 - subtotalTextWidth, currentY + 6);
        
        // Subtotal amount (right aligned in the fourth column)
        const subtotalAmount = `${optionsTotal}€`;
        const subtotalAmountWidth = doc.getTextWidth(subtotalAmount);
        doc.text(subtotalAmount, 15 + tableWidth - 5 - subtotalAmountWidth, currentY + 6);
      }
      
      finalY = currentY + rowHeight + 10;

      // Calculate subtotal from items before promo code discount
      const subtotalHT = [...decorationProducts, ...traiteurProducts].reduce(
        (sum, item) => sum + Number(item.totalPrice), 
        0
      ) + (quote.fees?.reduce((sum, fee) => sum + (fee.enabled ? (showHtTtc ? fee.price : fee.price * 1.20) : 0), 0) || 0);
      
      // Apply promo code discount
      const hasPromoCode = quote.code_promo_code && quote.code_promo_discount;
      const rawPromoDiscount = hasPromoCode && quote.code_promo_discount
        ? (subtotalHT * (quote.code_promo_discount / 100))
        : 0;
      const promoDiscount = Math.round(rawPromoDiscount * 100) / 100;
      
      // Calculate final totals after discount
      const totalHT = subtotalHT - promoDiscount;
      const tva = showHtTtc ? totalHT * 0.2 : 0;
      const totalTTC = showHtTtc ? totalHT * 1.2 : totalHT;

      // Check if there's enough space for totals and signature
      const requiredSpace = 80;
      
      // If there isn't enough space, add a new page
      if (finalY + requiredSpace > pageHeight) {
        doc.addPage();
        currentPage++;
        totalPages = currentPage + 1; // Add one more for conditions page
        addTotalsAndSignature(
          doc,
          20,
          pageWidth,
          subtotalHT,
          totalHT,
          tva,
          totalTTC,
          rightMargin,
          lineSpacing,
          documentType,
          pageHeight,
          currentPage,
          totalPages,
          showHtTtc,
          hasPromoCode ? quote.code_promo_code : undefined,
          hasPromoCode ? quote.code_promo_discount : undefined,
          promoDiscount
        );
      } else {
        totalPages = currentPage + 1; // Add one more for conditions page
        addTotalsAndSignature(
          doc,
          finalY,
          pageWidth,
          subtotalHT,
          totalHT,
          tva,
          totalTTC,
          rightMargin,
          lineSpacing,
          documentType,
          pageHeight,
          currentPage,
          totalPages,
          showHtTtc,
          hasPromoCode ? quote.code_promo_code : undefined,
          hasPromoCode ? quote.code_promo_discount : undefined,
          promoDiscount
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
  subtotalHT: number,
  totalHT: number,
  tva: number,
  totalTTC: number,
  rightMargin: number,
  lineSpacing: number,
  documentType: DocumentType,
  pageHeight: number,
  currentPage: number,
  totalPages: number,
  showHtTtc: boolean,
  promoCode?: string,
  promoDiscount?: number,
  promoDiscountAmount?: number
) => {
  // Add totals section
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Calculate the height needed for the totals section
  const hasPromoCode = promoCode && promoDiscount && promoDiscountAmount;
  const totalsSectionHeight = hasPromoCode ? 
    (showHtTtc ? lineSpacing * 5.5 : lineSpacing * 3.5) : 
    (showHtTtc ? lineSpacing * 4.5 : lineSpacing * 2);
  
  // Draw a light gray background for the totals section
  doc.setFillColor(245, 245, 245);
  doc.rect(pageWidth - 97, startY, 85, totalsSectionHeight, 'F');
  
  let currentLineY = startY + lineSpacing;
  
  if (showHtTtc) {
    // Show full breakdown: Subtotal HT, Promo discount, Total HT, TVA, Total TTC
    
    // If there's a promo code, show the breakdown
    if (hasPromoCode) {
      // Subtotal before discount
      doc.setFont('helvetica', 'normal');
      doc.text("Sous-total HT:", pageWidth - 95, currentLineY);
      const subtotalText = `${subtotalHT.toFixed(2)}€`;
      const subtotalWidth = doc.getTextWidth(subtotalText);
      doc.text(subtotalText, pageWidth - rightMargin - subtotalWidth, currentLineY);
      currentLineY += lineSpacing;
      
      // Promo code discount
      doc.setTextColor(34, 197, 94); // Green color for discount
      doc.text(`Code ${promoCode} (-${promoDiscount}%) :`, pageWidth - 95, currentLineY);
      const discountText = `-${promoDiscountAmount.toFixed(2)}€`;
      const discountWidth = doc.getTextWidth(discountText);
      doc.text(discountText, pageWidth - rightMargin - discountWidth, currentLineY);
      currentLineY += lineSpacing;
      
      // Reset text color
      doc.setTextColor(0);
    }
    
    // Total HT
    doc.setFont('helvetica', 'bold');
    doc.text("Total HT:", pageWidth - 95, currentLineY);
    doc.setFont('helvetica', 'normal');
    const totalHTText = `${totalHT.toFixed(2)}€`;
    const totalHTWidth = doc.getTextWidth(totalHTText);
    doc.text(totalHTText, pageWidth - rightMargin - totalHTWidth, currentLineY);
    currentLineY += lineSpacing;
    
    // TVA
    doc.setFont('helvetica', 'bold');
    doc.text("TVA 20%:", pageWidth - 95, currentLineY);
    doc.setFont('helvetica', 'normal');
    const tvaText = `${tva.toFixed(2)}€`;
    const tvaWidth = doc.getTextWidth(tvaText);
    doc.text(tvaText, pageWidth - rightMargin - tvaWidth, currentLineY);
    currentLineY += lineSpacing;
    
    // Total TTC
    doc.setFont('helvetica', 'bold');
    doc.text("Total TTC:", pageWidth - 95, currentLineY);
    doc.setFont('helvetica', 'normal');
    const totalTTCText = `${totalTTC.toFixed(2)}€`;
    const totalTTCWidth = doc.getTextWidth(totalTTCText);
    doc.text(totalTTCText, pageWidth - rightMargin - totalTTCWidth, currentLineY);
  } else {
    // Show only total with promo code if applicable
    
    // If there's a promo code, show the breakdown
    if (hasPromoCode) {
      // Subtotal before discount
      doc.setFont('helvetica', 'normal');
      doc.text("Sous-total:", pageWidth - 95, currentLineY);
      const subtotalText = `${subtotalHT.toFixed(2)}€`;
      const subtotalWidth = doc.getTextWidth(subtotalText);
      doc.text(subtotalText, pageWidth - rightMargin - subtotalWidth, currentLineY);
      currentLineY += lineSpacing;
      
      // Promo code discount
      doc.setTextColor(34, 197, 94); // Green color for discount
      doc.text(`Code ${promoCode} (-${promoDiscount}%) :`, pageWidth - 95, currentLineY);
      const discountText = `-${promoDiscountAmount.toFixed(2)}€`;
      const discountWidth = doc.getTextWidth(discountText);
      doc.text(discountText, pageWidth - rightMargin - discountWidth, currentLineY);
      currentLineY += lineSpacing;
      
      // Reset text color
      doc.setTextColor(0);
    }
    
    // Final total
    doc.setFont('helvetica', 'bold');
    doc.text("Total:", pageWidth - 95, currentLineY);
    doc.setFont('helvetica', 'normal');
    const totalText = `${totalHT.toFixed(2)}€`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.text(totalText, pageWidth - rightMargin - totalWidth, currentLineY);
  }

  // Add a new page for conditions générales de location
  doc.addPage();
  const conditionsY = 20;
  
  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("CONDITIONS GÉNÉRALES DE LOCATION", pageWidth / 2, conditionsY, { align: 'center' });
  
  // Content
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Calculate the width of the text block (page width - 40 for margins)
  const textBlockX = 20;
  const textBlockWidth = pageWidth - 40;
  let currentY = conditionsY + 15;
  
  // Helper function to add text with wrapping
  const addWrappedText = (text: string, y: number, indent: number = 0) => {
    const lines = doc.splitTextToSize(text, textBlockWidth - indent);
    doc.text(lines, textBlockX + indent, y);
    return lines.length * 5; // Return the height used (5 units per line)
  };
  
  // Section 1
  doc.setFont('helvetica', 'bold');
  doc.text("1. Lieu de mise à disposition du matériel", textBlockX, currentY);
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  currentY += addWrappedText("Plusieurs options s'offrent à vous :", currentY);
  currentY += addWrappedText("- Retrait en boutique", currentY);
  currentY += addWrappedText("- Livraison à domicile", currentY);
  currentY += addWrappedText("Le retrait et le retour du matériel peuvent être effectués au 14 Allée Chantecaille,31670 Labège.", currentY);
  currentY += addWrappedText("Ou nous pouvons assurer la livraison et le retour à votre adresse.", currentY);
  currentY += addWrappedText("Pour une location en semaine, la durée de la location est de 48 heures environ avec un retrait du matériel la veille de l'événement et un retour le lendemain de l'événement.", currentY);
  currentY += addWrappedText("Pour une location le week-end, la durée de la location est de 96 heures environ avec un retrait du matériel le jeudi matin au plus tôt et un retour le lundi après-midi au plus tard.", currentY);
  currentY += 5;
  
  // Section 2
  doc.setFont('helvetica', 'bold');
  doc.text("2. Modalités de réservation et de paiement", textBlockX, currentY);
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  currentY += addWrappedText("• Toute réservation de matériel doit faire l'objet d'un devis préalable établi par le Loueur.", currentY);
  currentY += addWrappedText("• La réservation est effective à réception du devis signé par le Locataire, accompagné d'un acompte de 30% du montant total de la location.", currentY);
  currentY += addWrappedText("• Le solde de la location est payable au plus tard le jour de l'événement", currentY);
  currentY += 5;
  
  // Section 3
  doc.setFont('helvetica', 'bold');
  doc.text("3. Résiliation", textBlockX, currentY);
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  currentY += addWrappedText("• En cas de manquement grave de l'une des parties à ses obligations, le contrat pourra être résilié de plein droit.", currentY);
  currentY += addWrappedText("• En cas d'annulation de l'événement, les conditions de résiliation seront les suivantes :", currentY);
  currentY += addWrappedText("- Annulation J-90 : l'acompte de 30% n'est pas remboursé.", currentY, 5);
  currentY += addWrappedText("- Annulation après J-15 : le loueur s'engage à régler 50% du montant total de la prestation.", currentY, 5);
  currentY += addWrappedText("- Cas de force majeure : Être constitutif d'un « cas de force majeure » un événement qui est imprévisible et en dehors de la volonté des deux parties, et d'origines diverses : climatique, bactériologique, politique, militaire. En cas d'annulation suite à un cas de force majeure, MG EVENEMENTS s'engage à proposer au client un avoir d'une valeur égale aux sommes déjà versées, valable 12 mois, utilisable pour toute prestation de location.", currentY, 5);
  currentY += 5;
  
  // Section 4
  doc.setFont('helvetica', 'bold');
  doc.text("4. Acceptation des CGL", textBlockX, currentY);
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Calculate text baseline position
  const checkboxSize = 3;
  const textY = currentY;
  const checkboxY = textY - 2; // Move checkbox up to align with text baseline
  
  // Draw checkbox box (smaller size and aligned with text)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(textBlockX, checkboxY, checkboxSize, checkboxSize);
  
  // Add acceptance text with proper spacing after checkbox
  const acceptanceText = "En cochant cette case, je déclare avoir pris connaissance des conditions générales de location.";
  const lines = doc.splitTextToSize(acceptanceText, textBlockWidth - (checkboxSize + 5));
  doc.text(lines, textBlockX + checkboxSize + 3, textY);
  currentY += lines.length * 5;
  currentY += 10;
  
  // Add signature boxes
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Client signature
  doc.text("Signature du client", textBlockX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text("(précédée de la mention « Bon pour accord »)", textBlockX, currentY + 5);
  
  // Prestataire signature
  doc.setFont('helvetica', 'bold');
  const prestataireText = "Signature du prestataire";
  const prestataireWidth = doc.getTextWidth(prestataireText);
  doc.text(prestataireText, pageWidth - textBlockX - prestataireWidth, currentY);
  doc.setFont('helvetica', 'normal');
  
  
  // Add footer with company info and page number
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
  doc.text("Entreprise Individuellen\nSIREN : 918 638 008\nNuméro de TVA : FR88918638008\nCode APE : 82.30Z", 15, footerY + 10);
  
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
  doc.text("IBAN IE03 MPOS 9903 9021 1561 79\nCode BIC/SWIFT MPOSIE2D\nÉtablissement: myPOS Ltd\nPaypal: mani.grimaudo@icloud.com", bankX, footerY + 10);

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

// Export the original function for backward compatibility
export const generateQuotePDF = (
  quote: AnyQuote,
  quoteItems: QuoteItem[],
  products: Product[],
  showHtTtc: boolean = true
) => {
  return generateDocumentPDF(quote, quoteItems, products, DocumentType.QUOTE, showHtTtc);
};

// Export a dedicated function for invoices
export const generateInvoicePDF = (
  quote: AnyQuote,
  quoteItems: QuoteItem[],
  products: Product[],
  showHtTtc: boolean = true
) => {
  return generateDocumentPDF(quote, quoteItems, products, DocumentType.INVOICE, showHtTtc);
}; 