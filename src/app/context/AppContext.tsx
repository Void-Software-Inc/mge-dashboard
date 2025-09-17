"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public'

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
  codesPromosShouldRefetch: boolean;
  setCodesPromosShouldRefetch: (value: boolean) => void;
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
  codesPromosShouldRefetch: true,
  setCodesPromosShouldRefetch: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [productsShouldRefetch, setProductsShouldRefetch] = useState(true);
  const [quotesShouldRefetch, setQuotesShouldRefetch] = useState(true);
  const [productsRecordsShouldRefetch, setProductsRecordsShouldRefetch] = useState(true);
  const [quotesRecordsShouldRefetch, setQuotesRecordsShouldRefetch] = useState(true);
  const [finishedQuotesShouldRefetch, setFinishedQuotesShouldRefetch] = useState(true);
  const [popularProductsShouldRefetch, setPopularProductsShouldRefetch] = useState(true);
  const [clientsShouldRefetch, setClientsShouldRefetch] = useState(true);
  const [codesPromosShouldRefetch, setCodesPromosShouldRefetch] = useState(true);

  useEffect(() => {
    const supabase = createClient()

    const productsChannel = supabase.channel('products_changes')
    const quotesChannel = supabase.channel('quotes_changes')


    productsChannel
      .on('postgres_changes', { event: '*', schema: schema, table: 'products' }, () => {
        setProductsShouldRefetch(true)
        setPopularProductsShouldRefetch(true)
      })
      .subscribe()

    quotesChannel
      .on('postgres_changes', { event: '*', schema: schema, table: 'quotes' }, () => {
        setQuotesShouldRefetch(true)
        setPopularProductsShouldRefetch(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(quotesChannel)
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
        codesPromosShouldRefetch,
        setCodesPromosShouldRefetch,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)