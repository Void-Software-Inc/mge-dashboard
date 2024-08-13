"use client"

import React, { useMemo } from 'react'
import { Label, Pie, PieChart } from 'recharts'
import { Quote, quoteStatus } from '@/utils/types/quotes'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from '../ui/skeleton'

const chartConfig: ChartConfig = {
  quotes: {
    label: "Devis",
  },
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface QuoteStatusChartProps {
  quotes: Quote[]
  isLoading: boolean
}

const QuoteStatusChart = ({ quotes, isLoading }: QuoteStatusChartProps) => {

  const groupQuotesByStatus = (quotes: Quote[]) => {
    const groupedData: { [key: string]: number } = {}
    
    quotes.forEach(quote => {
      groupedData[quote.status] = (groupedData[quote.status] || 0) + 1
    })
  
    return quoteStatus.map(status => ({
      status: status.name,
      count: groupedData[status.value] || 0,
      fill: status.color
    }))
  }

  const data = useMemo(() => groupQuotesByStatus(quotes), [quotes])
  const totalQuotes = quotes.length

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
  </>
   : (
    <Card className="flex flex-col h-[350px]">
      <CardHeader className="items-center pb-0">
        <CardTitle>Statuts des devis</CardTitle>
        <CardDescription>Répartition des devis par statut</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg bg-background p-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: data.fill }}
                        />
                        <span className="text-xs font-medium">
                          {data.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {data.count} devis avec ce statut
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalQuotes.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Devis
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {totalQuotes} devis au total
        </div>
        <div className="leading-none text-muted-foreground text-center">
          Affichage de tous les statuts de devis
        </div>
      </CardFooter>
    </Card>
  )
}

export default QuoteStatusChart