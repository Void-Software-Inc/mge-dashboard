"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type AppContextType = {
  productsShouldRefetch: boolean;
  setProductsShouldRefetch: (value: boolean) => void;
  quotesShouldRefetch: boolean;
  setQuotesShouldRefetch: (value: boolean) => void;
  productsRecordsShouldRefetch: boolean;
  setProductsRecordsShouldRefetch: (value: boolean) => void;
  quotesRecordsShouldRefetch: boolean;
  setQuotesRecordsShouldRefetch: (value: boolean) => void;
  finishedQuotesShouldRefetch: boolean;
  setFinishedQuotesShouldRefetch: (value: boolean) => void;
  popularProductsShouldRefetch: boolean;
  setPopularProductsShouldRefetch: (value: boolean) => void;
  clientsShouldRefetch: boolean;
  setClientsShouldRefetch: (value: boolean) => void;
};

export const AppContext = createContext<AppContextType>({
  productsShouldRefetch: true,
  setProductsShouldRefetch: () => {},
  quotesShouldRefetch: true,
  setQuotesShouldRefetch: () => {},
  productsRecordsShouldRefetch: true,
  setProductsRecordsShouldRefetch: () => {},
  quotesRecordsShouldRefetch: true,
  setQuotesRecordsShouldRefetch: () => {},
  finishedQuotesShouldRefetch: true,
  setFinishedQuotesShouldRefetch: () => {},
  popularProductsShouldRefetch: true,
  setPopularProductsShouldRefetch: () => {},
  clientsShouldRefetch: true,
  setClientsShouldRefetch: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [productsShouldRefetch, setProductsShouldRefetch] = useState(true);
  const [quotesShouldRefetch, setQuotesShouldRefetch] = useState(true);
  const [productsRecordsShouldRefetch, setProductsRecordsShouldRefetch] = useState(true);
  const [quotesRecordsShouldRefetch, setQuotesRecordsShouldRefetch] = useState(true);
  const [finishedQuotesShouldRefetch, setFinishedQuotesShouldRefetch] = useState(true);
  const [popularProductsShouldRefetch, setPopularProductsShouldRefetch] = useState(true);
  const [clientsShouldRefetch, setClientsShouldRefetch] = useState(true);

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
        setPopularProductsShouldRefetch(true)
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
    <AppContext.Provider
      value={{
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
        setPopularProductsShouldRefetch,
        clientsShouldRefetch,
        setClientsShouldRefetch,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)