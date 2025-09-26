import jsPDF from 'jspdf';
import { Quote, FinishedQuote, QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";

// Type to handle both Quote and FinishedQuote
type AnyQuote = Quote | FinishedQuote;

export const generateContractPDF = (quote: AnyQuote, quoteItems: QuoteItem[], products: Product[]) => {
  if (!quote) return null;

  const img = new Image();
  const logoPath = `${window.location.origin}/quote-mg-events.png`;
  img.crossOrigin = "anonymous";
  img.src = logoPath;

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio - smaller logo
      const originalWidth = 788;
      const originalHeight = 380;
      const desiredWidth = 50;
      const scaledHeight = (desiredWidth * originalHeight) / originalWidth;
      
      // Generate the actual document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const rightMargin = 15;
      const leftMargin = 15;
      
      // We'll count pages as we create them
      let totalPages = 1;
      let currentPage = 1;

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

      // Add footer function
      const addFooter = (doc: any, pageHeight: number, currentPage: number, totalPages: number) => {
        const footerY = pageHeight - 20;

        // Add horizontal line
        doc.setDrawColor(168, 168, 168);
        doc.setLineWidth(0.25);
        doc.line(15, footerY, pageWidth - 15, footerY);

        // Add simple footer text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text("SIREN 918 638 008 - https://www.mgevenements.fr - mgevenementiel31@gmail.com - @mg_evenements31 - tél : 07 68 10 96 17", 20, footerY + 5);

        // Add page numbers
        doc.setFontSize(9);
        const text = `Page ${currentPage} sur ${totalPages}`;
        const textWidth = doc.getTextWidth(text);
        doc.text(
          text,
          doc.internal.pageSize.getWidth() - 15 - textWidth,
          pageHeight - 5
        );
      };

      // PAGE 1
      // Add logo
      doc.addImage(img, 'PNG', 82.5, 5, desiredWidth, scaledHeight);

      // Title - thinner font
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text("CONTRAT DE LOCATION BARNUM", pageWidth / 2, 40, { align: 'center' });

      // Section: ENTRE LES SOUSSIGNÉS
      let currentY = 60;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("ENTRE LES SOUSSIGNÉS", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("MG ÉVÉNEMENTS", leftMargin, currentY);
      currentY += 5;
      doc.text("SIREN 918 638 008", leftMargin, currentY);
      currentY += 5;
      doc.text("Représentée par Mani GRIMAUDO", leftMargin, currentY);
      currentY += 5;
      doc.text("Ci-après dénommée \"le Loueur\"", leftMargin, currentY);

      currentY += 7;
      doc.text("Et", leftMargin, currentY);

      currentY += 7;
      // Client information instead of lines
      const clientName = `${quote.first_name || ''} ${quote.last_name || ''}`.trim();
      if (clientName) {
        doc.text(clientName, leftMargin, currentY);
        currentY += 5;
      }
      
      if (quote.raison_sociale) {
        doc.text(quote.raison_sociale, leftMargin, currentY);
        currentY += 5;
      }
      
      if (quote.email) {
        doc.text(quote.email, leftMargin, currentY);
        currentY += 5;
      }
      
      if (quote.phone_number) {
        doc.text(quote.phone_number, leftMargin, currentY);
        currentY += 5;
      }

      doc.text("Ci-après dénommé \"le Locataire\"", leftMargin, currentY);

      // Section: IL A ÉTÉ CONVENU CE QUI SUIT
                currentY += 14;;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("IL A ÉTÉ CONVENU CE QUI SUIT", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Le loueur loue au locataire, qui accepte, le matériel suivant :", leftMargin, currentY);

      currentY += 7;
      
      // Get chapiteau products from the quote
      const chapiteauItems = quoteItems.filter(item => {
        const product = products.find(p => p.id === item.product_id);
        return product && product.type === 'chapiteau';
      });

      if (chapiteauItems.length > 0) {
        chapiteauItems.forEach((item, index) => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const quantity = item.quantity || 1;
            const quantityText = quantity === 1 ? 'Un' : quantity === 2 ? 'Deux' : 
                               quantity === 3 ? 'Trois' : quantity === 4 ? 'Quatre' :
                               quantity === 5 ? 'Cinq' : quantity.toString();
            
            const productText = `• ${quantityText} ${product.name}`;
            
            // Check if we need to add a new page
            const textHeight = 5;
            if (currentY + textHeight > pageHeight - 60) {
              doc.addPage();
              currentPage++;
              totalPages++; // Increment total pages when adding a page
              addFooter(doc, pageHeight, currentPage, totalPages);
              currentY = 20;
            }
            
            doc.text(productText, leftMargin + 5, currentY);
            currentY += textHeight;
          }
        });
      } else {
        // Fallback if no chapiteau products found
        doc.text("• Un barnum", leftMargin + 5, currentY);
        currentY += 5;
      }

      // Checkboxes - 4 separate checkboxes on the same line
      currentY += 7;
      const checkboxSize = 3;
      const checkboxSpacing = 35; // Space between each checkbox
      
      // Check which fees are enabled
      const enabledFees = quote.fees?.filter(fee => fee.enabled) || [];
      const isMontageEnabled = enabledFees.some(fee => fee.name === 'marquee_setup');
      const isDemontageEnabled = enabledFees.some(fee => fee.name === 'marquee_dismantling');
      const isLivraisonEnabled = enabledFees.some(fee => fee.name === 'delivery');
      const isEnlevementEnabled = enabledFees.some(fee => fee.name === 'pickup');
      
      // Montage checkbox
      const montageX = leftMargin + 5;
      doc.rect(montageX, currentY - 3, checkboxSize, checkboxSize);
      if (isMontageEnabled) {
        // Add X mark
        doc.setFontSize(6);
        doc.text("X", montageX + 1, currentY - 0.5);
        doc.setFontSize(9);
      }
      doc.text("Montage", leftMargin + 12, currentY);
      
      // Démontage checkbox
      const demontageX = leftMargin + 5 + checkboxSpacing;
      doc.rect(demontageX, currentY - 3, checkboxSize, checkboxSize);
      if (isDemontageEnabled) {
        // Add X mark
        doc.setFontSize(6);
        doc.text("X", demontageX + 1, currentY - 0.5);
        doc.setFontSize(9);
      }
      doc.text("Démontage", demontageX + 7, currentY);
      
      // Livraison checkbox
      const livraisonX = leftMargin + 5 + (checkboxSpacing * 2);
      doc.rect(livraisonX, currentY - 3, checkboxSize, checkboxSize);
      if (isLivraisonEnabled) {
        // Add X mark
        doc.setFontSize(6);
        doc.text("X", livraisonX + 1, currentY - 0.5);
        doc.setFontSize(9);
      }
      doc.text("Livraison", livraisonX + 7, currentY);
      
      // Enlèvement checkbox
      const enlevementX = leftMargin + 5 + (checkboxSpacing * 3);
      doc.rect(enlevementX, currentY - 3, checkboxSize, checkboxSize);
      if (isEnlevementEnabled) {
        // Add X mark
        doc.setFontSize(6);
        doc.text("X", enlevementX + 1, currentY - 0.5);
        doc.setFontSize(9);
      }
      doc.text("Enlèvement", enlevementX + 7, currentY);

      // Section: DURÉE DE LA LOCATION
                currentY += 14;;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("DURÉE DE LA LOCATION", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Format event dates
      const formatDate = (dateString?: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
      };
      
      const eventFromDate = formatDate(quote.event_start_date);
      const eventToDate = formatDate(quote.event_end_date);
      const durationText = eventFromDate === eventToDate 
        ? `le ${eventFromDate}` 
        : `du ${eventFromDate} au ${eventToDate}`;
      
      doc.text(`La location est consentie pour une durée de _____ jour(s), du ____________ au ____________.`, leftMargin, currentY);

      // Section: LIEU DE LA LOCATION
                currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("LIEU DE LA LOCATION", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Le matériel sera installé et utilisé à l'adresse suivante :", leftMargin, currentY);

      currentY += 7;
      // Event location (using location_address if available, otherwise client address)
      const locationAddress = quote.location_address || quote.address;
      
      // Check if location address has any meaningful content
      const hasLocationAddress = locationAddress?.voie || locationAddress?.cp || locationAddress?.ville;
      
      if (hasLocationAddress) {
        // Line 1: Voie
        if (locationAddress?.voie) {
          doc.text(locationAddress.voie, leftMargin+5, currentY);
        }
        currentY += 5;
        
        // Line 2: Complément d'adresse (if exists)
        if (locationAddress?.compl) {
          doc.text(locationAddress.compl, leftMargin+5, currentY);
          currentY += 5;
        }
        
        
        // Line 3: Ville, Code postal
        const cityPostal = [];
        if (locationAddress?.ville) cityPostal.push(locationAddress.ville);
        if (locationAddress?.cp) cityPostal.push(locationAddress.cp);
        if (cityPostal.length > 0) {
          doc.text(cityPostal.join(', '), leftMargin+5, currentY);
        }
        currentY += 5;
      } else {
        // No location address - display 3 placeholder lines
        doc.text("_________________________________________________", leftMargin, currentY);
        currentY += 5;
        doc.text("_________________________________________________", leftMargin, currentY);
        currentY += 5;
        doc.text("_________________________________________________", leftMargin, currentY);
        currentY += 5;
      }

      // Check if we need to move payment section to page 2
      const shouldMovePaymentToPage2 = chapiteauItems.length > 5;
      
      if (!shouldMovePaymentToPage2) {
        // Section: PRIX DE LA LOCATION ET MODALITÉS DE PAIEMENT (on page 1)
              currentY += 8;;
        
        // Check if we need to add a new page
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentPage++;
          totalPages++; // Increment total pages when adding a page
          addFooter(doc, pageHeight, currentPage, totalPages);
          currentY = 20;
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("PRIX DE LA LOCATION ET MODALITÉS DE PAIEMENT", leftMargin, currentY);

        currentY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const totalTTC = quote.total_cost ? (quote.total_cost * 1.20).toFixed(2) : '0.00';
        doc.text(`Le prix de la location est fixé à ${totalTTC} euros, payable comme suit :`, leftMargin, currentY);

        currentY += 7;
        // Calculate 30% deposit and remaining amount
        const depositAmount = quote.total_cost ? (quote.total_cost * 1.20 * 0.30).toFixed(2) : '0.00';
        const remainingAmount = quote.total_cost ? (quote.total_cost * 1.20 * 0.70).toFixed(2) : '0.00';
        
        doc.text(`• 30 % à la réservation, soit ${depositAmount} euros.`, leftMargin + 5, currentY);
        currentY += 5;
        doc.text(`• Le solde, soit ${remainingAmount} euros, le jour de la livraison.`, leftMargin + 5, currentY);

        currentY += 5;
        doc.text(`Un dépôt de garantie de ___________________ euros sera versé par le Locataire au Loueur le jour de la livraison.`, leftMargin, currentY);
        currentY += 5;
        doc.text("Ce dépôt sera restitué au Locataire à la fin de la location, déduction faite des éventuels frais de réparation ou de", leftMargin, currentY);
        currentY += 5;
        doc.text("remplacement en cas de dommages.", leftMargin, currentY);
      }

      // PAGE 2
      doc.addPage();
      currentPage++;
      totalPages++; // Increment total pages when adding a page
      addFooter(doc, pageHeight, currentPage, totalPages);
      currentY = 20;

      // Add payment section to page 2 if there are more than 4 chapiteau items
      if (shouldMovePaymentToPage2) {
        // Section: PRIX DE LA LOCATION ET MODALITÉS DE PAIEMENT (on page 2)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("PRIX DE LA LOCATION ET MODALITÉS DE PAIEMENT", leftMargin, currentY);

        currentY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const totalTTC = quote.total_cost ? (quote.total_cost * 1.20).toFixed(2) : '0.00';
        doc.text(`Le prix de la location est fixé à ${totalTTC} euros, payable comme suit :`, leftMargin, currentY);

        currentY += 7;
        // Calculate 30% deposit and remaining amount
        const depositAmount = quote.total_cost ? (quote.total_cost * 1.20 * 0.30).toFixed(2) : '0.00';
        const remainingAmount = quote.total_cost ? (quote.total_cost * 1.20 * 0.70).toFixed(2) : '0.00';
        
        doc.text(`• 30 % à la réservation, soit ${depositAmount} euros.`, leftMargin + 5, currentY);
        currentY += 5;
        doc.text(`• Le solde, soit ${remainingAmount} euros, le jour de la livraison.`, leftMargin + 5, currentY);

        currentY += 5;
        doc.text(`Un dépôt de garantie de ${depositAmount} euros sera versé par le Locataire au Loueur le jour de la livraison.`, leftMargin, currentY);
        currentY += 5;
        doc.text("Ce dépôt sera restitué au Locataire à la fin de la location, déduction faite des éventuels frais de réparation ou de", leftMargin, currentY);
        currentY += 5;
        doc.text("remplacement en cas de dommages.", leftMargin, currentY);

        currentY += 14;
      }

      // Section: OBLIGATIONS DU LOUEUR
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("OBLIGATIONS DU LOUEUR", leftMargin, currentY);

      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("• Le Loueur s'engage à livrer et installer le matériel en état de fonctionnement à la date convenue.", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("• Le Loueur s'engage à fournir les instructions nécessaires à l'utilisation du matériel.", leftMargin + 5, currentY);

      // Section: OBLIGATIONS DU LOCATAIRE
            currentY += 14;;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("OBLIGATIONS DU LOCATAIRE", leftMargin, currentY);

      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("• Le Locataire s'engage à utiliser le matériel conformément à sa destination et aux instructions fournies par le Loueur.", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("• Le Locataire s'engage à restituer le matériel en bon état en fin de location.", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("• Le Locataire est responsable de tous les dommages causés au matériel pendant la durée de la location.", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("• Le Locataire doit s'assurer que le terrain où sera installé le Barnum soit apte à recevoir celui-ci, et est responsable de", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("toutes les démarches administratives concernant le terrain, et l'installation du Barnum.", leftMargin + 5, currentY);

      // Section: MODALITÉS DE MISE À DISPOSITION DU BARNUM
                currentY += 14;;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("MODALITÉS DE MISE À DISPOSITION DU BARNUM", leftMargin, currentY);

      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const modalitiesText = [
        "Pour une location en semaine, la durée de la location est de 48 heures environ avec un retrait du barnum la veille de l'événement et un retour le lendemain de l'événement.",
        "Pour une location le week-end, la durée de la location est de 96 heures environ avec un retrait du barnum le jeudi matin au plus tôt et un retour le lundi après-midi au plus tard.",
        "La location sera due que le barnum ait été utilisé ou non. Le client donneur d'ordre reconnaît avoir reçu le(s) barnum(s) toutes en bon état, sauf observations consignées. L'équipement fera foi en aucune façon sans que le locataire ait pris les accessoires correspondant au règle avec les normes de sécurité et d'hygiène en vigueur. Le client donneur d'ordre déclare avoir eu toute latitude de vérifier le barnum. Celui-ci sera préparé et remontré à l'enlèvement ou au débarrassage des déchets, trié et rangé dans son emballage d'origine. Dans le cas contraire, le temps passé à la préparation pour l'enlèvement ou au débarrassage sera facturé au tarif en vigueur l'heure de manutention et par personne.",
        "Un inventaire contradictoire est effectué avec le client donneur d'ordre ou son délégué lors de la reprise du barnum tout. En cas d'absence du client donneur d'ordre ou de son délégué, l'inventaire est effectué à l'entrepôt du loueur et seul accord particulier, seul l'inventaire du loueur fera foi, aucune contestation ne sera admise."
      ];

      modalitiesText.forEach((line) => {
        if (line === "") {
          currentY += 5;
        } else {
          const lines = doc.splitTextToSize(line, pageWidth - 30);
          doc.text(lines, leftMargin, currentY);
          currentY += lines.length * 5;
        }
      });

      // Section: FAIT À
            currentY += 14;;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const currentDate = new Date().toLocaleDateString('fr-FR');
      doc.text(`FAIT À ____________________, LE __________________`, leftMargin, currentY);

      // Signature sections
      currentY += 20;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      // Left signature - LE LOCATAIRE
      doc.text("LE LOCATAIRE", leftMargin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text("SIGNATURE :", leftMargin, currentY + 10);
      doc.setFontSize(9);
      doc.text("Précédée de la mention \"bon pour accord\"", leftMargin, currentY + 15);

      // Right signature - LE LOUEUR
      const rightSignatureX = pageWidth - 80;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("LE LOUEUR", rightSignatureX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text("SIGNATURE :", rightSignatureX, currentY + 10);

      // Update all footers with correct page counts
      updateAllFooters();

      // Save the PDF
      const fileName = `Contrat_Barnum_${quote.id}_${quote.last_name}_${new Date().toLocaleDateString('fr-FR')}.pdf`;
      doc.save(fileName);
      resolve();
    };
    
    img.onerror = () => {
      console.error('Error loading logo image from:', logoPath);
      reject(new Error('Error loading logo image'));
    };
  });
};
