"use client"

import React, { createContext, useContext, useState } from 'react'

const ProductsContext = createContext<{
  shouldRefetch: boolean;
  setShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}>({ shouldRefetch: false, setShouldRefetch: () => {} })

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const [shouldRefetch, setShouldRefetch] = useState(false)
  return (
    <ProductsContext.Provider value={{ shouldRefetch, setShouldRefetch }}>
      {children}
    </ProductsContext.Provider>
  )
}

export const useProductsContext = () => useContext(ProductsContext)