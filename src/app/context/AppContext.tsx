"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

const AppContext = createContext<{
  productsShouldRefetch: boolean;
  setProductsShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  quotesShouldRefetch: boolean;
  setQuotesShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  productsRecordsShouldRefetch: boolean;
  setProductsRecordsShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  quotesRecordsShouldRefetch: boolean;
  setQuotesRecordsShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  finishedQuotesShouldRefetch: boolean;
  setFinishedQuotesShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  popularProductsShouldRefetch: boolean;
  setPopularProductsShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  productsShouldRefetch: false,
  setProductsShouldRefetch: () => {},
  quotesShouldRefetch: false,
  setQuotesShouldRefetch: () => {},
  productsRecordsShouldRefetch: false,
  setProductsRecordsShouldRefetch: () => {},
  quotesRecordsShouldRefetch: false,
  setQuotesRecordsShouldRefetch: () => {},
  finishedQuotesShouldRefetch: false,
  setFinishedQuotesShouldRefetch: () => {},
  popularProductsShouldRefetch: false,
  setPopularProductsShouldRefetch: () => {},
})

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [productsShouldRefetch, setProductsShouldRefetch] = useState(false)
  const [quotesShouldRefetch, setQuotesShouldRefetch] = useState(false)
  const [productsRecordsShouldRefetch, setProductsRecordsShouldRefetch] = useState(false)
  const [quotesRecordsShouldRefetch, setQuotesRecordsShouldRefetch] = useState(false)
  const [finishedQuotesShouldRefetch, setFinishedQuotesShouldRefetch] = useState(false)
  const [popularProductsShouldRefetch, setPopularProductsShouldRefetch] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const productsChannel = supabase.channel('products_changes')
    const quotesChannel = supabase.channel('quotes_changes')
    const productsRecordsChannel = supabase.channel('products_records_changes')
    const quotesRecordsChannel = supabase.channel('quotes_records_changes')
    const finishedQuotesChannel = supabase.channel('finished_quotes_changes')

    productsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        setProductsShouldRefetch(true)
        setPopularProductsShouldRefetch(true)
      })
      .subscribe()

    quotesChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        setQuotesShouldRefetch(true)
      })
      .subscribe()

    productsRecordsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products_records' }, () => {
        setProductsRecordsShouldRefetch(true)
        setProductsShouldRefetch(true)
      })
      .subscribe()

    quotesRecordsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes_records' }, () => {
        setQuotesRecordsShouldRefetch(true)
        setQuotesShouldRefetch(true)
      })
      .subscribe()

    finishedQuotesChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finished_quotes' }, () => {
        setFinishedQuotesShouldRefetch(true)
        setQuotesShouldRefetch(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(quotesChannel)
      supabase.removeChannel(productsRecordsChannel)
      supabase.removeChannel(quotesRecordsChannel)
      supabase.removeChannel(finishedQuotesChannel)
    }
  }, [])

  return (
    <AppContext.Provider value={{ 
      productsShouldRefetch, 
      setProductsShouldRefetch, 
      quotesShouldRefetch, 
      setQuotesShouldRefetch, 
      productsRecordsShouldRefetch, 
      setProductsRecordsShouldRefetch,
      quotesRecordsShouldRefetch,
      setQuotesRecordsShouldRefetch,
      finishedQuotesShouldRefetch,
      setFinishedQuotesShouldRefetch,
      popularProductsShouldRefetch,
      setPopularProductsShouldRefetch
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)