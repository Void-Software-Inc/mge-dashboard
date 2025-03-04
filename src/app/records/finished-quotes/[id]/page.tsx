import { Metadata } from "next"
import FinishedQuoteView from "./FinishedQuoteView"

export const metadata: Metadata = {
  title: "Détail du devis archivé",
  description: "Consulter les détails d'un devis archivé",
}

export default function FinishedQuotePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <FinishedQuoteView quoteId={params.id} />
    </div>
  )
} 