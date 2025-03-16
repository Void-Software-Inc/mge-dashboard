"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClient } from "@/services/clients"
import { Client } from "@/utils/types/clients"
import { Quote } from "@/utils/types/quotes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileTextIcon, ArrowLeftIcon } from "@radix-ui/react-icons"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [client, setClient] = useState<Client & { quotes?: Quote[] }>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const clientData = await getClient(params.id)
        setClient(clientData)
        // Update document title dynamically
        document.title = clientData.name ? `${clientData.name} - Détails du client` : "Détails du client"
      } catch (error) {
        console.error("Error fetching client:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClient()
  }, [params.id])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center py-10">
          <h2 className="text-2xl font-bold mb-4">Client non trouvé</h2>
          <p className="text-muted-foreground mb-6">
            Le client avec l'identifiant {params.id} n'existe pas.
          </p>
          <Button onClick={() => router.push('/clients')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Retour à la liste des clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.company ? `${client.company} · ` : ''}
            {client.phone}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/clients')}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{client.email || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
              <p>{client.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entreprise</p>
              <p>{client.company || "Non renseigné"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Adresse</p>
              <p>{client.address || "Non renseigné"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ville</p>
                <p>{client.city || "Non renseigné"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Code postal</p>
                <p>{client.postal_code || "Non renseigné"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pays</p>
              <p>France</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre de devis</p>
              <p className="text-2xl font-bold">{client.quotes?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Premier devis</p>
              <p>{formatDate(client.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dernier devis</p>
              <p>{formatDate(client.updated_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Devis du client</h2>
        {client.quotes && client.quotes.length > 0 ? (
          <div className="space-y-4">
            {client.quotes.map((quote, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Devis #{quote.id}</CardTitle>
                      <CardDescription>
                        Créé le {formatDate(quote.created_at)}
                      </CardDescription>
                    </div>
                    <Badge variant={quote.status === 'completed' ? 'secondary' : 'outline'}>
                      {quote.status === 'completed' ? 'Terminé' : 'En cours'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Événement</p>
                      <p>{quote.description || "Non spécifié"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p>{quote.event_start_date ? formatDate(quote.event_start_date) : "Non spécifiée"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Montant total</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.total_cost || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    Voir le devis
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground">Aucun devis trouvé pour ce client.</p>
          </div>
        )}
      </div>
    </div>
  )
} 