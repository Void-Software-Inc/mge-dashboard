"use client"

import React, { createContext, useContext, useState } from 'react'

const QuotesContext = createContext<{
  shouldRefetch: boolean;
  setShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}>({ shouldRefetch: false, setShouldRefetch: () => {} })

export const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [shouldRefetch, setShouldRefetch] = useState(false)
  return (
    <QuotesContext.Provider value={{ shouldRefetch, setShouldRefetch }}>
      {children}
    </QuotesContext.Provider>
  )
}

export const useQuotesContext = () => useContext(QuotesContext)