import { Metadata } from "next"
import FinishedQuoteView from "./FinishedQuoteView"

export const metadata: Metadata = {
  title: "Détail du devis archivé",
  description: "Consulter les détails d'un devis archivé",
}

export default async function FinishedQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <FinishedQuoteView quoteId={id} />
    </div>
  )
} 