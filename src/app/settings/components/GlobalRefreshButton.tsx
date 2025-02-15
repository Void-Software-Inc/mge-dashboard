"use client"

import { Button } from "@/components/ui/button"
import { useAppContext } from "@/app/context/AppContext"
import { ReloadIcon } from "@radix-ui/react-icons"
import { useState } from "react"
import { toast } from "sonner"

export default function GlobalRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const {
    setProductsShouldRefetch,
    setQuotesShouldRefetch,
    setProductsRecordsShouldRefetch,
    setQuotesRecordsShouldRefetch,
    setFinishedQuotesShouldRefetch,
    setPopularProductsShouldRefetch,
  } = useAppContext()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Trigger all refetch flags
      setProductsShouldRefetch(true)
      setQuotesShouldRefetch(true)
      setProductsRecordsShouldRefetch(true)
      setQuotesRecordsShouldRefetch(true)
      setFinishedQuotesShouldRefetch(true)
      setPopularProductsShouldRefetch(true)

      // Clear all cached data
      sessionStorage.clear()
      
      toast.success('Toutes les données ont été actualisées')
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Erreur lors de l\'actualisation des données')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="default"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="w-full"
    >
      {isRefreshing ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ReloadIcon className="mr-2 h-4 w-4" />
      )}
      Actualiser toutes les données
    </Button>
  )
}