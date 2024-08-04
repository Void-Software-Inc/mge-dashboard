"use client"

import React, { useState, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { format, subDays, subMonths, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { addDays } from 'date-fns'
import { getQuotes } from '@/services/quotes'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppContext } from '@/app/context/AppContext'
import { Skeleton } from '../ui/skeleton'

const chartConfig: ChartConfig = {
  quotes: {
    label: "Devis",
    color: "hsl(var(--chart-1))",
  },
}

const QuoteCreationChart = () => {
  const [timeRange, setTimeRange] = useState("90j")
  const [data, setData] = useState<any[]>([])
  const { quotesShouldRefetch, setQuotesShouldRefetch } = useAppContext()
  const [isLoading, setIsLoading] = useState(true)


  

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const quotes = await getQuotes()
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cachedQuotes', JSON.stringify(quotes))
      }
      const now = new Date()
      let startDate = subMonths(now, 3)

      if (timeRange === "30j") {
        startDate = subDays(now, 30)
      } else if (timeRange === "7j") {
        startDate = subDays(now, 7)
      }

      const filteredQuotes = quotes.filter(quote => 
        new Date(quote.created_at) >= startDate && new Date(quote.created_at) <= now
      )

      const groupedData = groupQuotesByDate(filteredQuotes)
      setData(groupedData)
    } catch (error) {
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (quotesShouldRefetch) {
      fetchData()
    } else {
      if (typeof window !== 'undefined') {
        const cachedStatsQuotes = sessionStorage.getItem('cachedQuotes')
        if (cachedStatsQuotes) {
          const now = new Date()
          let startDate = subMonths(now, 3)

          if (timeRange === "30j") {
            startDate = subDays(now, 30)
          } else if (timeRange === "7j") {
            startDate = subDays(now, 7)
          }

          const parsedCachedStatsQuotes = JSON.parse(cachedStatsQuotes)
          const filteredQuotes = parsedCachedStatsQuotes.filter((quote: { created_at: string }) => 
            new Date(quote.created_at) >= startDate && new Date(quote.created_at) <= now
          )

          const groupedData = groupQuotesByDate(filteredQuotes)
          setData(groupedData)
          setIsLoading(false)
        } else {
          fetchData()
        }
      }
    }
  }, [timeRange, quotesShouldRefetch])

  /*useEffect(() => {
    const fetchData = async () => {
      // Generate 500 fake quotes
      const fakeQuotes = generateFakeQuotes(500)
      const now = new Date()
      let startDate = subMonths(now, 3)
      
      if (timeRange === "30j") {
        startDate = subDays(now, 30)
      } else if (timeRange === "7j") {
        startDate = subDays(now, 7)
      }
  
      const filteredQuotes = fakeQuotes.filter(quote => 
        new Date(quote.created_at) >= startDate && new Date(quote.created_at) <= now
      )
  
      const groupedData = groupQuotesByDate(filteredQuotes)
      setData(groupedData)
    }
  
    fetchData()
  }, [timeRange, quotesShouldRefetch])

  const generateFakeQuotes = (count: number) => {
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)
    const quotes = []
  
    for (let i = 0; i < count; i++) {
      const createdAt = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
      quotes.push({
        id: i + 1,
        created_at: createdAt.toISOString(),
      })
    }
  
    return quotes
  }*/

  const groupQuotesByDate = (quotes: any[]) => {
    const groupedData: { [key: string]: number } = {}
  
    quotes.forEach(quote => {
      const date = format(new Date(quote.created_at), 'yyyy-MM-dd')
      groupedData[date] = (groupedData[date] || 0) + 1
    })
  
    return Object.entries(groupedData)
      .map(([date, count]) => ({ date, quotes: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const total = data.reduce((acc, curr) => acc + curr.quotes, 0)

  return isLoading ? 
  <>
    <Card className="flex flex-col h-[350px]">
      <CardHeader className="items-center pb-0">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="flex-1 mt-2 pb-0">
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardFooter>
    </Card>
  </> : (
    <Card className='w-full h-[350px] flex flex-col'>
      <CardHeader className="flex items-center justify-center sm:flex-row border-b p-0">
        <div className="flex flex-1 flex-col justify-center gap-1 px-2 py-2 md:py-2">
          <CardTitle className='text-lg md:text-xl text-center'>Devis créés</CardTitle>
          <CardDescription className='text-sm text-center'>
            Nombre total de devis créés : {total}
          </CardDescription>
        </div>
        <div className="hidden md:flex px-2 py-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Sélectionner une période"
            >
              <SelectValue placeholder="3 derniers mois" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90j" className="rounded-lg">
                3 derniers mois
              </SelectItem>
              <SelectItem value="30j" className="rounded-lg">
                30 derniers jours
              </SelectItem>
              <SelectItem value="7j" className="rounded-lg">
                7 derniers jours
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ChartContainer
          config={chartConfig}
          className="h-[275px] w-full"
        >
          <BarChart
            data={data}
            margin={{
              left: 0,
              right: 0,
              top: 16,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={30}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = parseISO(value)
                return format(date, 'd MMM', { locale: fr })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="quotes"
                  labelFormatter={(value) => {
                    return format(parseISO(value), 'd MMMM yyyy', { locale: fr })
                  }}
                />
              }
            />
            <Bar dataKey="quotes" fill={`var(--color-quotes)`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default QuoteCreationChart