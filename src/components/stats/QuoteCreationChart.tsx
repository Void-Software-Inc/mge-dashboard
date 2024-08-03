"use client"

import React, { useState, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { format, subDays, subMonths, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getQuotes } from '@/services/quotes'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  quotes: {
    label: "Devis",
    color: "black",
  },
}

const QuoteCreationChart = () => {
  const [timeRange, setTimeRange] = useState("90j")
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const quotes = await getQuotes()
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
    }

    fetchData()
  }, [timeRange])

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

  return (
    <Card className='w-full'>
      <CardHeader className="flex items-center sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Devis créés</CardTitle>
          <CardDescription>
            Affiche le nombre total de devis créés au fil du temps
          </CardDescription>
        </div>
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
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] h-[248px] w-full"
        >
          <AreaChart data={data}>
              <defs>
                <linearGradient id="fillQuotes" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(220, 252, 231)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(132, 204, 22)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={60}
                tickFormatter={(value) => {
                  const date = parseISO(value)
                  return format(date, 'd MMM', { locale: fr })
                }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return format(parseISO(value), 'd MMMM yyyy', { locale: fr })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="quotes"
                stroke="rgb(132, 204, 22)"
                fillOpacity={1}
                fill="url(#fillQuotes)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default QuoteCreationChart