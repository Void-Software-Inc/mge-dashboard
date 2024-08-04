"use client"

import React, { createContext, useContext, useState } from 'react'

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

  return (
    <AppContext.Provider value={{ productsShouldRefetch, setProductsShouldRefetch, quotesShouldRefetch, setQuotesShouldRefetch }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)