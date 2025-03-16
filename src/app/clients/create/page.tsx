"use client"

import { Metadata } from "next"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, FileTextIcon } from "@radix-ui/react-icons"

export const metadata: Metadata = {
  title: "Créer un client",
  description: "Créer un nouveau client",
}

export default function CreateClientPage() {
  const router = useRouter()

  // Redirect to quote creation after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/quotes/create')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer un client</h1>
          <p className="text-muted-foreground">
            Les clients sont créés lors de la création d'un devis.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/clients')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
      <div className="py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Redirection</CardTitle>
            <CardDescription>
              Les clients sont créés automatiquement lors de la création d'un devis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Vous allez être redirigé vers la page de création de devis dans quelques secondes...
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => router.push('/quotes/create')}
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              Créer un devis
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 