"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Label, Pie, PieChart } from 'recharts'
import { getProducts } from '@/services/products'
import { Product } from '@/utils/types/products'
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
import { useAppContext } from '@/app/context/AppContext'
import { Skeleton } from '../ui/skeleton'

const chartConfig: ChartConfig = {
  products: {
    label: "Produits",
  },
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface ProductTypesChartProps {
  products: Product[]
  isLoading: boolean
}

const ProductTypesChart = ({ products, isLoading }: ProductTypesChartProps) => {

  const groupProductsByType = (products: Product[]) => {
    const groupedData: { [key: string]: number } = {}
    
    products.forEach(product => {
      groupedData[product.type] = (groupedData[product.type] || 0) + 1
    })

    return Object.entries(groupedData)
      .map(([type, count], index) => ({
        type,
        count,
        fill: colors[index % colors.length]
      }))
  }

  const data = useMemo(() => groupProductsByType(products), [products])
  const totalProducts = products.length

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
        <CardTitle>Types de Produits</CardTitle>
        <CardDescription>Répartition des produits par type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
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
                          {totalProducts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Produits
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
          {totalProducts} produits en stock
        </div>
        <div className="leading-none text-muted-foreground">
          Affichage de tous les produits en stock
        </div>
      </CardFooter>
    </Card>
  )
}

export default ProductTypesChart