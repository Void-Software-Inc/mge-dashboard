import jsPDF from 'jspdf';

export const generateConditionsGeneralesPDF = () => {
  const img = new Image();
  const logoPath = `${window.location.origin}/quote-mg-events.png`;
  img.crossOrigin = "anonymous";
  img.src = logoPath;

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio - same as other PDFs
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
      
      // Fixed to 2 pages
      let totalPages = 2;
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

      // Title - same styling as other PDFs
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text("CONDITIONS GÉNÉRALES DE LOCATION", pageWidth / 2, 40, { align: 'center' });

      let currentY = 60;

      // ARTICLE 1: OBJET
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("ARTICLE 1: OBJET", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article1Text = "Les présentes conditions générales de location (CGL) ont pour objet de définir les modalités de location de matériel événementiel (tables, chaises, vaisselle, décoration, etc.) entre MG EVENEMENTS, ci-après dénommé « le Loueur », et le client, ci-après dénommé « le Locataire ».";
      const article1Lines = doc.splitTextToSize(article1Text, pageWidth - 30);
      doc.text(article1Lines, leftMargin, currentY);
      currentY += article1Lines.length * 5 + 7;

      // ARTICLE 2: DEVIS ET RESERVATION
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 2: DEVIS ET RÉSERVATION", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article2Text = "Toute réservation de matériel doit faire l'objet d'un devis préalable établi par le Loueur.\nLa réservation est effective à réception du devis signé par le Locataire, accompagné d'un acompte de 30% du montant total de la location. Le solde de la location est payable au plus tard le jour de la date de l'événement.";
      const article2Lines = doc.splitTextToSize(article2Text, pageWidth - 30);
      doc.text(article2Lines, leftMargin, currentY);
      currentY += article2Lines.length * 5 + 7;

      // ARTICLE 3: MISE À DISPOSITION ET RESTITUTION DU MATÉRIEL
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 3: MISE À DISPOSITION ET RESTITUTION DU MATÉRIEL", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article3Text = [
        "Pour une location en semaine, la durée de la location est de 48 heures environ avec un retrait du matériel la veille de l'événement et un retour le lendemain de l'événement.",
        "Pour une location le week-end, la durée de la location est de 96 heures environ avec un retrait du matériel le jeudi matin au plus tôt et un retour le lundi après-midi au plus tard.",
        "La location sera due que le matériel ait été utilisé ou non. Le client donneur d'ordre reconnaît avoir reçu les matériels loués en bon état, aptes au fonctionnement, avec l'équipement normal et les accessoires nécessaires, le tout propre, entretenu correctement, en règle avec les normes de sécurité et d'hygiène en vigueur. Le client donneur d'ordre déclare avoir eu toute latitude de vérifier le matériel. Le matériel est rendu sale et préparé pour l'enlèvement c'est à dire, débarrassé des déchets, trié et rangé dans son emballage d'origine à l'exception des emballages perdus et regroupés au lieu précis de la livraison. Dans le cas contraire, le temps passé à la préparation pour l'enlèvement et/ou débarrassage sera facturé au tarif en vigueur l'heure de manutention et par personne.\nUn inventaire contradictoire est effectué avec le client donneur d'ordre ou son délégué lors de la reprise des matériels loués. En cas d'absence du client donneur d'ordre ou de son délégué, l'inventaire est effectué à l'entrepôt du loueur et sauf accord particulier, seul l'inventaire du loueur fera foi, aucune contestation ne sera admise.\nLe retrait et le retour du matériel peuvent être effectués au chemin des droits de l'homme et du citoyen, 31 450 Ayguesvives.\nOu nous pouvons assurer la livraison et le retour à votre adresse."
      ];

      article3Text.forEach((paragraph, index) => {
        const lines = doc.splitTextToSize(paragraph, pageWidth - 30);
        doc.text(lines, leftMargin, currentY);
        currentY += lines.length * 3.5 ;
      });
      currentY += 12 ;

      // ARTICLE 4: DÉPOT DE GARANTIE
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 4: DÉPOT DE GARANTIE", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article4Text = "Les dégâts, vols ou dégradations subis par le matériel pendant la location est à la charge du client.\nUn chèque de caution dont le montant est défini dans le devis est remis par le client pendant la durée de location.\nIl n'est pas encaissé, sauf si un problème est constaté entre les deux parties.";
      const article4Lines = doc.splitTextToSize(article4Text, pageWidth - 30);
      doc.text(article4Lines, leftMargin, currentY);
      currentY += article4Lines.length * 5 + 7;

      // ARTICLE 5: OBLIGATIONS DU LOCATAIRE
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 5: OBLIGATIONS DU LOCATAIRE", leftMargin, currentY);
      
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
      currentY += 7;

    

      // Add footer to page 1
      addFooter(doc, pageHeight, 1, totalPages);


    
      // PAGE 2
      doc.addPage();
      currentPage = 2;
      addFooter(doc, pageHeight, currentPage, totalPages);
      currentY = 20;

          // ARTICLE 6: OBLIGATIONS DU LOUEUR
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text("ARTICLE 6: OBLIGATIONS DU LOUEUR", leftMargin, currentY);
          
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
          currentY += 7;
    
          // ARTICLE 7: RESPONSABILITÉ
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text("ARTICLE 7: RESPONSABILITÉ", leftMargin, currentY);
          
          currentY += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const responsabiliteText = [
            "• Le Locataire est responsable de toute détérioration ou perte du mobilier pendant la durée de la location. Le Loueur décline toute responsabilité en cas de dommages causés par le mobilier loué.",
            "• En cas de force majeure, les obligations des parties seront suspendues."
          ];
    
          responsabiliteText.forEach((line) => {
            const lines = doc.splitTextToSize(line, pageWidth - 30);
            doc.text(lines, leftMargin, currentY);
            currentY += lines.length * 5 + 2;
          });
  
      currentY += 7;
      // ARTICLE 8: RÉSILIATION
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 8: RÉSILIATION", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article8Text = [
        "• En cas de manquement grave aux obligations par l'une des parties, le contrat pourra être résilié de plein droit.",
        "• En cas d'annulation de l'événement, les conditions de résiliation seront les suivantes :"
      ];

      article8Text.forEach((line) => {
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.text(lines, leftMargin, currentY);
        currentY += lines.length * 5 + 2;
      });

      currentY += 1;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Annulation J-90:", leftMargin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text("l'acompte de 30% n'est pas remboursé.", leftMargin + 25, currentY);
      currentY += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Annulation après J-15:", leftMargin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text("le loueur s'engage à régler 50% du montant total de la prestation.", leftMargin + 35, currentY);
      currentY += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Cas de force majeure:", leftMargin, currentY);
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      const forceMajeureText = "Être constitutif d’un « cas de force majeure » un événement qui est imprévisible et en dehors de la volonté des deux parties, et d’origines diverses : climatique, bactériologique, politique, militaire. En cas d’annulation suite à un cas de force majeure, MG EVENEMENTS s’engage à proposer au client un avoir d’une valeur égale aux sommes déjà versées, valable 12 mois, utilisable pour toute prestation de location.";
      const forceMajeureLines = doc.splitTextToSize(forceMajeureText, pageWidth - 30);
      doc.text(forceMajeureLines, leftMargin, currentY);
      currentY += forceMajeureLines.length * 5 + 5;

      // ARTICLE 9: LITIGES
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 9: LITIGES", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article9Text = " Le contrat établi par la signature du devis et du présent document entre les deux parties est régi par la loi française et soumis à la juridiction exclusive des tribunaux français. Tout différend relatif aux présentes conditions sera tranché par le Tribunal de Commerce de Toulouse de MG EVENEMENTS auquel les parties attribuent une compétence exclusive.";
      const article9Lines = doc.splitTextToSize(article9Text, pageWidth - 30);
      doc.text(article9Lines, leftMargin, currentY);
      currentY += article9Lines.length * 5 + 7;

      // ARTICLE 10: ACCEPTATION DES CGL
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("ARTICLE 10: ACCEPTATION DES CGL", leftMargin, currentY);
      
      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const article10Text = "La signature du devis par le Loueur vaut acceptation pleine et entière des présentes CGL.";
      doc.text(article10Text, leftMargin, currentY);

      // Update all footers with correct page counts
      updateAllFooters();

      // Save the PDF
      const fileName = `Conditions_Generales_Location_${new Date().toLocaleDateString('fr-FR')}.pdf`;
      doc.save(fileName);
      resolve();
    };
    
    img.onerror = () => {
      console.error('Error loading logo image from:', logoPath);
      reject(new Error('Error loading logo image'));
    };
  });
};
