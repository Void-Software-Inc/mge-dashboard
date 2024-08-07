'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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
} from "@/components/ui/chart"
import { Skeleton } from '../ui/skeleton'

interface PopularProduct {
  id: string;
  name: string;
  count: number;
}

interface MostPopularProductsChartProps {
  popularProducts: PopularProduct[];
  isLoading: boolean;
}

const MostPopularProductsChart: React.FC<MostPopularProductsChartProps> = ({ popularProducts, isLoading }) => {
  
  
  const chartData = popularProducts.map((product, index) => ({
    name: product.name,
    count: product.count,
    fill: `hsl(var(--chart-${index + 1}))`
  }))

  const chartConfig: ChartConfig = {
    count: {
      label: "Count",
    },
    ...popularProducts.reduce((config, product, index) => {
      config[product.name] = {
        label: product.name,
        color: `hsl(var(--chart-${index + 1}))`,
      }
      return config
    }, {} as ChartConfig)
  }

  const CustomTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-2 rounded-md shadow-md">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: data.fill }}
            />
            <p className="font-semibold">{data.name}</p>
          </div>
          <p>Quantité: {data.count}</p>
        </div>
      );
    }
    return null;
  };

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
        <CardTitle>Produits les plus commandés</CardTitle>
        <CardDescription className='text-sm text-center'>Les 5 produits les plus commandés des devis en cours</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip content={<CustomTooltipContent />} />
            <Pie 
              data={chartData} 
              dataKey="count" 
              nameKey="name"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Basé sur les commandes <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Les 5 produits les plus commandés
        </div>
      </CardFooter>
    </Card>
  )
}

export default MostPopularProductsChart;