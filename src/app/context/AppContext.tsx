"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

const AppContext = createContext<{
  productsShouldRefetch: boolean;
  setProductsShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  quotesShouldRefetch: boolean;
  setQuotesShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  productsShouldRefetch: false,
  setProductsShouldRefetch: () => {},
  quotesShouldRefetch: false,
  setQuotesShouldRefetch: () => {},
})

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [productsShouldRefetch, setProductsShouldRefetch] = useState(false)
  const [quotesShouldRefetch, setQuotesShouldRefetch] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const productsChannel = supabase.channel('products_changes')
    const quotesChannel = supabase.channel('quotes_changes')

    productsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        setProductsShouldRefetch(true)
      })
      .subscribe()

    quotesChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        setQuotesShouldRefetch(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(quotesChannel)
    }
  }, [])

  return (
    <AppContext.Provider value={{ productsShouldRefetch, setProductsShouldRefetch, quotesShouldRefetch, setQuotesShouldRefetch }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)