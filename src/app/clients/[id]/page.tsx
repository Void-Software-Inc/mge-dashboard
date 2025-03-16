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
import { FileTextIcon, ArrowLeftIcon, MixerHorizontalIcon, Cross2Icon } from "@radix-ui/react-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { quoteStatus } from "@/utils/types/quotes"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [client, setClient] = useState<Client & { quotes?: any[] }>()
  const [isLoading, setIsLoading] = useState(true)
  
  // Add filter states
  const [selectedQuoteStatuses, setSelectedQuoteStatuses] = useState<string[]>([])
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [filteredQuotes, setFilteredQuotes] = useState<any[]>([])

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const clientData = await getClient(params.id)
       
        setClient(clientData)
        // Initialize filtered quotes with all quotes
        setFilteredQuotes(clientData.quotes || [])
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
  
  // Apply filters when selectedQuoteStatuses changes
  useEffect(() => {
    if (!client?.quotes) return
    
    if (selectedQuoteStatuses.length === 0) {
      // If no status filters are selected, show all quotes
      setFilteredQuotes(client.quotes)
    } else {
      // Filter quotes based on selected statuses
      const filtered = client.quotes.filter(quote => 
        selectedQuoteStatuses.includes(quote.status)
      )
      setFilteredQuotes(filtered)
    }
    
    // Update filter active state
    setIsFilterActive(selectedQuoteStatuses.length > 0)
  }, [selectedQuoteStatuses, client])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Add this helper function to debug quote rendering
  const groupQuotesByType = (quotes: any[] = []) => {
    const active = quotes.filter(q => q.quote_type === 'active');
    const finished = quotes.filter(q => q.quote_type === 'finished' || q.status === 'completed');
    const deleted = quotes.filter(q => q.quote_type === 'deleted' || q.is_deleted);
    
    
    return { active, finished, deleted };
  };
  
  // Add filter handlers
  const handleQuoteStatusChange = (status: string) => {
    setSelectedQuoteStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }
  
  const clearFilters = () => {
    setSelectedQuoteStatuses([])
  }

  // Helper function to render quotes
  const renderQuotes = (quotes: any[]) => {
    // Apply status filters if active
    const quotesToRender = isFilterActive 
      ? quotes.filter(quote => selectedQuoteStatuses.includes(quote.status))
      : quotes;
      
    if (quotesToRender.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">Aucun devis dans cette catégorie.</p>
        </div>
      );
    }
    
    return quotesToRender.map((quote, index) => {
      
      // Determine badge variant based on quote type
      let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "outline";
      if ((quote as any).is_deleted) {
        badgeVariant = "destructive";
      } else if (quote.status === 'completed' || (quote as any).quote_type === 'finished') {
        badgeVariant = "secondary";
      } else if ((quote as any).quote_type === 'active') {
        badgeVariant = "default"; // Blue badge for active quotes
      }
      
      // Determine quote URL based on type
      let quoteUrl = `/quotes/${quote.id}`;
      if ((quote as any).quote_type === 'finished') {
        quoteUrl = `/records/finished-quotes/${quote.id}`;
      } else if ((quote as any).quote_type === 'deleted') {
        quoteUrl = `/records/quotes/${quote.id}`;
      }
      
      return (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Devis #{quote.id}</CardTitle>
                <CardDescription>
                  {(quote as any).quote_type === 'deleted' ? 'Supprimé le ' + formatDate((quote as any).deleted_at || '') :
                   (quote as any).quote_type === 'finished' ? 'Terminé le ' + formatDate((quote as any).finished_at || '') :
                   'Créé le ' + formatDate(quote.created_at || '')}
                  {(quote as any).quote_type && <span> • Type: {(quote as any).quote_type}</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={badgeVariant}>
                  {(quote as any).is_deleted ? 'Supprimé' : 
                   quote.status === 'completed' || (quote as any).quote_type === 'finished' ? 'Terminé' : 'En cours'}
                </Badge>
                {quote.status && quote.status !== 'completed' && (
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1"
                    style={{ borderColor: quoteStatus.find(s => s.value === quote.status)?.color }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: quoteStatus.find(s => s.value === quote.status)?.color }}
                    />
                    {quoteStatus.find(s => s.value === quote.status)?.name || quote.status}
                  </Badge>
                )}
              </div>
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
              onClick={() => router.push(quoteUrl)}
              disabled={(quote as any).is_deleted} // Disable button for deleted quotes
            >
              Voir le devis
            </Button>
          </CardFooter>
        </Card>
      );
    });
  };

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

  // In the return statement, before rendering quotes, add:
  const groupedQuotes = client?.quotes ? groupQuotesByType(filteredQuotes) : { active: [], finished: [], deleted: [] };

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Devis du client</h2>
          
         
        </div>
        
        {/* Display active filters */}
        {isFilterActive && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedQuoteStatuses.map(status => (
              <Badge key={`status-${status}`} variant="secondary" className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: quoteStatus.find(s => s.value === status)?.color }}
                />
                {quoteStatus.find(s => s.value === status)?.name}
                <Cross2Icon 
                  className="h-3 w-3 cursor-pointer ml-1" 
                  onClick={() => handleQuoteStatusChange(status)}
                />
              </Badge>
            ))}
          </div>
        )}
        
        {client?.quotes && client.quotes.length > 0 ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Devis actifs ({groupedQuotes.active.length})
              </TabsTrigger>
              <TabsTrigger value="finished">
                Devis terminés ({groupedQuotes.finished.length})
              </TabsTrigger>
              <TabsTrigger value="deleted">
                Devis supprimés ({groupedQuotes.deleted.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Tous les devis ({filteredQuotes.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {renderQuotes(groupedQuotes.active)}
            </TabsContent>
            
            <TabsContent value="finished" className="space-y-4">
              {renderQuotes(groupedQuotes.finished)}
            </TabsContent>
            
            <TabsContent value="deleted" className="space-y-4">
              {renderQuotes(groupedQuotes.deleted)}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              {renderQuotes(filteredQuotes)}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground">Aucun devis trouvé pour ce client.</p>
          </div>
        )}
      </div>
    </div>
  )
} 