'use client'

import React, { useState, useEffect } from 'react'
import QuoteCreationChart from '@/components/stats/QuoteCreationChart';
import ProductTypesChart from '@/components/stats/ProductTypesChart';
import { getProducts } from '@/services/products';
import { getQuotes } from '@/services/quotes';
import { Product } from '@/utils/types/products'
import { Quote } from '@/utils/types/quotes'
import { useAppContext } from '@/app/context/AppContext'

export default function StatsRegroupment() {
    const [products, setProducts] = useState<Product[]>([])
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [isProductsLoading, setIsProductsLoading] = useState(true)
    const [isQuotesLoading, setIsQuotesLoading] = useState(true)
    const { 
        productsShouldRefetch, 
        setProductsShouldRefetch,
        quotesShouldRefetch,
        setQuotesShouldRefetch
    } = useAppContext()

    const fetchProducts = async () => {
        setIsProductsLoading(true)
        try {
            const fetchedProducts = await getProducts()
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('cachedProducts', JSON.stringify(fetchedProducts))
            }
            setProducts(fetchedProducts)
            setProductsShouldRefetch(false)
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setIsProductsLoading(false)
        }
    }

    const fetchQuotes = async () => {
        setIsQuotesLoading(true)
        try {
            const fetchedQuotes = await getQuotes()
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('cachedQuotes', JSON.stringify(fetchedQuotes))
            }
            setQuotes(fetchedQuotes)
            setQuotesShouldRefetch(false)
        } catch (error) {
            console.error('Error fetching quotes:', error)
        } finally {
            setIsQuotesLoading(false)
        }
    }

    useEffect(() => {
        if (productsShouldRefetch) {
            fetchProducts()
        } else {
            if (typeof window !== 'undefined') {
                const cachedStatsProducts = sessionStorage.getItem('cachedProducts')
                if (cachedStatsProducts) {
                    setProducts(JSON.parse(cachedStatsProducts))
                    setIsProductsLoading(false)
                } else {
                    fetchProducts()
                }
            }
        }
    }, [productsShouldRefetch])

    useEffect(() => {
        if (quotesShouldRefetch) {
            fetchQuotes()
        } else {
            if (typeof window !== 'undefined') {
                const cachedQuotes = sessionStorage.getItem('cachedQuotes')
                if (cachedQuotes) {
                    setQuotes(JSON.parse(cachedQuotes))
                    setIsQuotesLoading(false)
                } else {
                    fetchQuotes()
                }
            }
        }
    }, [quotesShouldRefetch])
    
    return (
      <main className="flex min-h-screen flex-col items-center p-1 md:p-4">
        <div className='w-full mt-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='w-full px-1 md:px-0'>
            <ProductTypesChart products={products} isLoading={isProductsLoading} />
          </div>
          <div className='w-full px-1 md:px-0'>
            <QuoteCreationChart quotes={quotes} isLoading={isQuotesLoading} />
          </div>
        </div>
      </main>
    );
  }