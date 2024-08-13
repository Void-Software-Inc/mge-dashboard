"use client"

import React, { useState, useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { format, subDays, subMonths, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
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
import { Skeleton } from '../ui/skeleton'
import { FinishedQuote } from '@/utils/types/quotes'

const chartConfig: ChartConfig = {
  finishedQuotes: {
    label: "Devis terminés",
    color: "hsl(var(--chart-2))",
  },
}

interface FinishedQuoteChartProps {
  finishedQuotes: FinishedQuote[]
  isLoading: boolean
}

const FinishedQuoteChart = ({ finishedQuotes, isLoading }: FinishedQuoteChartProps) => {
  const [timeRange, setTimeRange] = useState("90j")

  const groupFinishedQuotesByDate = (finishedQuotes: FinishedQuote[]) => {
    const groupedData: { [key: string]: { count: number; totalCost: number } } = {}
  
    finishedQuotes.forEach(quote => {
      const date = format(new Date(quote.finished_at), 'yyyy-MM-dd')
      if (!groupedData[date]) {
        groupedData[date] = { count: 0, totalCost: 0 }
      }
      groupedData[date].count += 1
      groupedData[date].totalCost += quote.total_cost
    })
  
    return Object.entries(groupedData)
      .map(([date, data]) => ({ date, finishedQuotes: data.count, totalCost: data.totalCost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const filteredAndGroupedData = useMemo(() => {
    const now = new Date()
    let startDate = subMonths(now, 3)

    if (timeRange === "30j") {
      startDate = subDays(now, 30)
    } else if (timeRange === "7j") {
      startDate = subDays(now, 7)
    }

    const filteredQuotes = finishedQuotes.filter(quote => 
      new Date(quote.finished_at) >= startDate && new Date(quote.finished_at) <= now
    )

    return groupFinishedQuotesByDate(filteredQuotes)
  }, [finishedQuotes, timeRange])

  const total = filteredAndGroupedData.reduce((acc, curr) => acc + curr.finishedQuotes, 0)
  const totalCost = filteredAndGroupedData.reduce((acc, curr) => acc + curr.totalCost, 0)

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
    <Card className='w-full h-[375px] flex flex-col'>
      <CardHeader className="flex items-center justify-center sm:flex-row border-b p-0">
        <div className="flex flex-1 flex-col justify-center gap-1 px-2 py-2 md:py-2">
        <CardTitle className='text-lg md:text-xl text-center md'>Devis terminés</CardTitle>
          <CardDescription className='text-sm text-center'>
            Nombre total de devis terminés : {total}
            <br />
            Montant total réalisé : {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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
            data={filteredAndGroupedData}
            margin={{
              left: 0,
              right: 0,
              top: 16,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} horizontal={false} />
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
                content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                    <div className="rounded-lg bg-background p-2 shadow-sm">
                        <div className="text-sm font-medium">
                        {format(parseISO(data.date), 'd MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                        Devis terminés : {data.finishedQuotes}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                        Montant total : {data.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </div>
                    );
                }
                return null;
                }}
            />
            <Bar dataKey="finishedQuotes" fill={`var(--color-finishedQuotes)`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default FinishedQuoteChart