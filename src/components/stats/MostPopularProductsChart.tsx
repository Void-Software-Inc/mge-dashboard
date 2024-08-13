'use client'

import React from 'react'
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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
  average_quantity: number;
}

interface MostPopularProductsChartProps {
  popularProducts: PopularProduct[];
  isLoading: boolean;
}

const MostPopularProductsChart: React.FC<MostPopularProductsChartProps> = ({ popularProducts, isLoading }) => {
  const chartData = popularProducts.map(product => ({
    name: product.name,
    count: product.count,
    average_quantity: product.average_quantity
  }))

  
  const chartConfig: ChartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-1))",
    },
    average_quantity: {
      label: "Average Quantity",
      color: "hsl(var(--chart-2))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig

  const CustomTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-2 rounded-md shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p>Apparait dans {data.count} devis</p>
          <p>Quantité moyenne commandée: {data.average_quantity.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const radius = 10;
    const truncatedValue = truncateText(value, 15);

    return (
      <text
        x={x + 5}
        y={y + height / 2}
        fill="#6b7280"
        textAnchor="start"
        dominantBaseline="middle"
        style={{ fontSize: '12px' }}
      >
        {truncatedValue}
      </text>
    );
  };

  return isLoading ? (
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
  ) : (
    <Card className="flex flex-col h-[350px]">
      <CardHeader className="items-center pb-0">
        <CardTitle className='text-center'>Produits les plus commandés</CardTitle>
        <CardDescription className='text-xs text-center'>Les 5 produits les plus commandés des devis en cours et terminés</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto max-h-[220px]">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 15,
              right: 16,
              left: 15,
              bottom: 0,
            }}
          >
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <ChartTooltip
              cursor={false}
              content={<CustomTooltipContent />}
            />
            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={4}>
              <LabelList
                dataKey="name"
                content={renderCustomizedLabel}
              />
              <LabelList
                dataKey="count"
                position="right"
                fill="hsl(var(--foreground))"
                style={{ fontSize: '12px' }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Basé sur les commandes <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

export default MostPopularProductsChart;