'use client'

import React, { useState, useEffect } from 'react'
import QuoteCreationChart from '@/components/stats/QuoteCreationChart';
import ProductTypesChart from '@/components/stats/ProductTypesChart';
import MostPopularProductsChart from '@/components/stats/MostPopularProductsChart';
import QuotesStatusChart from '@/components/stats/QuotesStatusChart';
import { getProducts, getMostPopularProducts } from '@/services/products';
import { getQuotes } from '@/services/quotes';
import { Product } from '@/utils/types/products'
import { Quote } from '@/utils/types/quotes'
import { useAppContext } from '@/app/context/AppContext'

export default function StatsRegroupment() {
    const [products, setProducts] = useState<Product[]>([])
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [popularProducts, setPopularProducts] = useState<{ id: string; name: string; count: number; average_quantity: number }[]>([])
    const [isProductsLoading, setIsProductsLoading] = useState(true)
    const [isQuotesLoading, setIsQuotesLoading] = useState(true)
    const [isPopularProductsLoading, setIsPopularProductsLoading] = useState(true)
    const { 
        productsShouldRefetch, 
        setProductsShouldRefetch,
        quotesShouldRefetch,
        setQuotesShouldRefetch,
        popularProductsShouldRefetch,
        setPopularProductsShouldRefetch
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

    const fetchPopularProducts = async () => {
        setIsPopularProductsLoading(true)
        try {
            const fetchedPopularProducts = await getMostPopularProducts()
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('cachedPopularProducts', JSON.stringify(fetchedPopularProducts))
            }
            setPopularProducts(fetchedPopularProducts)
            setPopularProductsShouldRefetch(false)
        } catch (error) {
            console.error('Error fetching popular products:', error)
        } finally {
            setIsPopularProductsLoading(false)
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

    useEffect(() => {
        if (popularProductsShouldRefetch) {
            fetchPopularProducts()
        } else {
            if (typeof window !== 'undefined') {
                const cachedPopularProducts = sessionStorage.getItem('cachedPopularProducts')
                if (cachedPopularProducts) {
                    setPopularProducts(JSON.parse(cachedPopularProducts))
                    setIsPopularProductsLoading(false)
                } else {
                    fetchPopularProducts()
                }
            }
        }
    }, [popularProductsShouldRefetch])

    return (
      <main className="flex min-h-screen flex-col items-center p-1 md:p-4">
        <div className='w-full mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <div className='w-full px-1 md:px-0'>
            <ProductTypesChart products={products} isLoading={isProductsLoading} />
          </div>
          <div className='w-full px-1 md:px-0'>
            <QuotesStatusChart quotes={quotes} isLoading={isQuotesLoading} />
          </div>
          <div className='w-full px-1 md:px-0'>
            <MostPopularProductsChart popularProducts={popularProducts} isLoading={isPopularProductsLoading} />
          </div>
        </div>
        <div className='w-full mt-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='w-full px-1 md:px-0'>
            <QuoteCreationChart quotes={quotes} isLoading={isQuotesLoading} />
          </div>
          <div className='w-full px-1 md:px-0'>
            <QuoteCreationChart quotes={quotes} isLoading={isQuotesLoading} />
          </div>
        </div>
      </main>
    );
  }