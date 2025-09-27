import jsPDF from 'jspdf';
import { Quote, FinishedQuote, QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";

// Type to handle both Quote and FinishedQuote
type AnyQuote = Quote | FinishedQuote;

export const generateFurnitureContractPDF = (quote: AnyQuote, quoteItems: QuoteItem[], products: Product[]) => {
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
      let totalPages = 3; // Fixed to 3 pages
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

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text("CONTRAT DE LOCATION DE MOBILIER", pageWidth / 2, 40, { align: 'center' });

      // Section: ENTRE LES SOUSIGNÉS
      let currentY = 60;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("ENTRE LES SOUSIGNÉS", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("MG EVENEMENTS", leftMargin, currentY);
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

      // Section: IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT
      currentY += 14;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Il a été convenu et arrêté ce qui suit", leftMargin, currentY);

      // Section: OBJET DU CONTRAT
      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("OBJET DU CONTRAT", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Le loueur s'engage à louer au Locataire, le mobilier événementiel tel que décrit dans l'annexe 1 pour une utilisation dans le\ncadre d'un événement.", leftMargin, currentY);

      // Section: DURÉE DE LA LOCATION
      currentY += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("DURÉE DE LA LOCATION", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("La location prend effet le ___________ et se termine le ___________.", leftMargin, currentY);

      currentY += 7;
      const durationText = [
        "Pour une location en semaine, la durée de la location est de 48 heures environ avec un retrait du matériel la veille de l'événement et un retour le lendemain de l'événement.",
        "Pour une location le week-end, la durée de la location est de 96 heures environ avec un retrait du matériel le jeudi matin au plus tôt et un retour le lundi après-midi au plus tard.",
        "La location sera due que le matériel ait été utilisé ou non. Le client donneur d'ordre reconnaît avoir reçu les matériels loués en bon état, aptes au fonctionnement, avec l'équipement normal et les accessoires nécessaires, le tout propre, entretenu correctement, en règle avec les normes de sécurité et d'hygiène en vigueur. Le client donneur d'ordre déclare avoir eu toute latitude de vérifier le matériel. Le matériel est rendu sale et préparé pour l'enlèvement c'est à dire, débarrassé des déchets, trié et rangé dans son emballage d'origine à l'exception des emballages perdus et regroupés au lieu précis de la livraison. Dans le cas contraire, le temps passé à la préparation pour l'enlèvement et / ou débarrassage sera facturé au tarif en vigueur l'heure de manutention et par personne.\nUn inventaire contradictoire est effectué avec le client donneur d'ordre ou son délégué lors de la reprise des matériels loués. En cas d'absence du client donneur d'ordre ou de son délégué, l'inventaire est effectué à l'entrepôt du loueur et sauf accord particulier, seul l'inventaire du loueur fera foi, aucune contestation ne sera admise."
      ];

      durationText.forEach((line, index) => {
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.text(lines, leftMargin, currentY);
        // For the last paragraph (very long one), add less spacing
        if (index === durationText.length - 1) {
          currentY += lines.length * 5 - 10; // Reduce spacing for the long paragraph
        } else {
          currentY += lines.length * 5 + 2; // Normal spacing for other paragraphs
        }
      });
      currentY += 5;
      // Section: LIEU DE LA MISE À DISPOSITION DU MATÉRIEL
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("LIEU DE LA MISE À DISPOSITION DU MATÉRIEL", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Plusieurs options s'offrent à vous :", leftMargin, currentY);

      currentY += 7;
      // Checkboxes
      const checkboxSize = 3;
      const checkboxY = currentY - 3;
      
      // Retrait en boutique checkbox
      doc.rect(leftMargin + 5, checkboxY, checkboxSize, checkboxSize);
      doc.text("Retrait en boutique", leftMargin + 12, currentY);
      
      // Livraison à domicile checkbox
      doc.rect(leftMargin + 5 + 50, checkboxY, checkboxSize, checkboxSize);
      doc.text("Livraison à domicile", leftMargin + 12 + 50, currentY);

      currentY += 7;
      doc.text("Le retrait et le retour du matériel peuvent être effectués au chemin des droits de l'homme et du citoyen, 31450 Ayguesvives.", leftMargin, currentY);
      currentY += 5;
      doc.text("Ou nous pouvons assurer la livraison et le retour à votre adresse.", leftMargin, currentY);

      // Add footer to page 1
      addFooter(doc, pageHeight, 1, totalPages);

      // PAGE 2
      doc.addPage();
      currentPage = 2;
      addFooter(doc, pageHeight, currentPage, totalPages);
      currentY = 20;

      // Section: PRIX DE LA LOCATION ET MODALITÉS DE PAIEMENT
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("PRIX DE LA LOCATION ET MODALITÉS DE PAIEMENT", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Le prix de la location est fixé à ___________ euros, payable comme suit :", leftMargin, currentY);

      currentY += 7;
      doc.text("• 30% à la réservation, soit ___________ euros.", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("• Le solde, soit ___________ euros, le jour de la restitution du matériel.", leftMargin + 5, currentY);

      currentY += 10;

      // Section: DÉPOT DE GARANTIE
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("DÉPOT DE GARANTIE", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const depositText = [
        "Les dommages, vols ou dégradations du matériel pendant la durée de la location sont à la charge du client. Un chèque de caution défini dans le devis est remis par le client pour la durée de la location et ne sera encaissé qu'en cas de problème constaté d'un commun accord entre les deux parties."
      ];

      depositText.forEach((line) => {
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.text(lines, leftMargin, currentY);
        currentY += lines.length * 5 + 2; // Account for actual line height plus small spacing
      });

      // Section: OBLIGATIONS DU LOCATAIRE
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("OBLIGATIONS DU LOCATAIRE", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Le Locataire s'engage à :", leftMargin, currentY);

      currentY += 7;
      const locataireObligations = [
        "• Utiliser le mobilier conformément à sa destination et aux règles de sécurité.",
        "• Ne pas sous-louer le mobilier sans l'accord écrit du Loueur.",
        "• Informer immédiatement le Loueur en cas de détérioration ou de perte du mobilier."
      ];

      locataireObligations.forEach((line) => {
        doc.text(line, leftMargin, currentY);
        currentY += 5;
      });

      // Section: OBLIGATIONS DU LOUEUR
      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("OBLIGATIONS DU LOUEUR", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const loueurObligations = [
        "• Le Loueur s'engage à livrer et installer le matériel en état de fonctionnement à la date convenue.",
        "• Le Loueur s'engage à fournir les instructions nécessaires à l'utilisation du matériel."
      ];

      loueurObligations.forEach((line) => {
        doc.text(line, leftMargin, currentY);
        currentY += 5;
      });

      // Section: RESPONSABILITÉ
      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("RESPONSABILITÉ", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const responsabiliteText = [
        "Le Locataire est responsable de toute détérioration ou perte du mobilier pendant la durée de la location. Le Loueur décline toute responsabilité pour les dommages causés par le mobilier loué. En cas de force majeure, les obligations des parties seront suspendues."
      ];

      responsabiliteText.forEach((line) => {
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.text(lines, leftMargin, currentY);
        currentY += lines.length * 5 + 2; // Account for actual line height plus small spacing
      });

      // Section: RÉSILIATION
      currentY += 1;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("RÉSILIATION", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("• En cas de manquement grave aux obligations par l'une des parties, le contrat pourra être résilié de plein droit.", leftMargin, currentY);
      currentY += 5;
      doc.text("• Conditions d'annulation de l'événement :", leftMargin, currentY);
      currentY += 5;
      doc.text("  - Annulation J-90 : l'acompte de 30% n'est pas remboursé.", leftMargin + 5, currentY);
      currentY += 5;
      doc.text("  - Annulation après J-15 : le loueur s'engage à régler 50% du montant total de la prestation.", leftMargin + 5, currentY);

      currentY += 7;
      const forceMajeureText = [
        "Cas de force majeure : événement imprévisible, irrésistible et extérieur aux parties, de quelque nature qu'il soit (climatique, bactériologique, politique, militaire). Dans ce cas, MG EVENEMENTS propose au client un avoir d'un montant égal aux sommes déjà versées, valable 12 mois, utilisable pour toute prestation de location."
      ];

      forceMajeureText.forEach((line) => {
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.text(lines, leftMargin, currentY);
        currentY += lines.length * 5 + 2; // Account for actual line height plus small spacing
      });

      // Section: LITIGES
      currentY += 2;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("LITIGES", leftMargin, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Le présent contrat est régi par le droit français et soumis à la juridiction exclusive des tribunaux français. Tout litige sera porté\ndevant le Tribunal de Commerce de Toulouse de MG EVENEMENTS, auquel les parties attribuent compétence exclusive.", leftMargin, currentY);

      // Section: FAIT À
      currentY += 18;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("FAIT À ____________________, LE __________________", leftMargin, currentY);

      // Signature sections
      currentY += 12;
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

      // Add footer to page 2
      addFooter(doc, pageHeight, 2, totalPages);

      // PAGE 3
      doc.addPage();
      currentPage = 3;
      addFooter(doc, pageHeight, currentPage, totalPages);
      currentY = 20;

      // Section: ANNEXE 1
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("ANNEXE 1 : MOBILIER EVENEMENTIEL", leftMargin, currentY);

      // Update all footers with correct page counts
      updateAllFooters();

      // Save the PDF
      const fileName = `Contrat_Mobilier_${quote.id}_${quote.last_name}_${new Date().toLocaleDateString('fr-FR')}.pdf`;
      doc.save(fileName);
      resolve();
    };
    
    img.onerror = () => {
      console.error('Error loading logo image from:', logoPath);
      reject(new Error('Error loading logo image'));
    };
  });
};