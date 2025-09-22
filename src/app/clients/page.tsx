"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getClients } from "@/services/clients"
import { Client } from "@/utils/types/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  MixerHorizontalIcon, 
  Cross2Icon 
} from "@radix-ui/react-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { quoteStatus } from "@/utils/types/quotes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Define the quote type filter options
const quoteTypeFilters = [
  { value: "active", label: "Devis en cours" },
  { value: "finished", label: "Devis terminés" },
  { value: "deleted", label: "Devis supprimés" },
]

// Define the service type filter options
const serviceTypeFilters = [
  { value: "traiteur", label: "Services traiteur" },
  { value: "barnum", label: "Barnum/Chapiteau" },
]

// Helper functions to detect service types from quotes
const hasTraiteurService = (quote: any): boolean => {
  // Check if quote has traiteur flag or price
  const hasTraiteurFlag = quote.is_traiteur === true || (quote.traiteur_price && quote.traiteur_price > 0)
  
  // Check if quote has products with traiteur category
  const hasTraiteurProducts = quote.items && Array.isArray(quote.items) && 
    quote.items.some((item: any) => item.product && item.product.category === 'traiteur')
  
  return hasTraiteurFlag || hasTraiteurProducts
}


const hasBarnumProduct = (quote: any): boolean => {
  // Check if quote has products with chapiteau type
  return quote.items && Array.isArray(quote.items) && 
    quote.items.some((item: any) => item.product && item.product.type === 'chapiteau')
}

const getClientServiceTypes = (client: any): string[] => {
  if (!client.quotes || !Array.isArray(client.quotes)) return []
  
  const serviceTypes = new Set<string>()
  
  client.quotes.forEach((quote: any) => {
    if (hasTraiteurService(quote)) {
      serviceTypes.add('traiteur')
    }
    if (hasBarnumProduct(quote)) {
      serviceTypes.add('barnum')
    }
  })
  
  return Array.from(serviceTypes)
}

export default function ClientsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Add filter states
  const [selectedQuoteTypes, setSelectedQuoteTypes] = useState<string[]>([])
  const [selectedQuoteStatuses, setSelectedQuoteStatuses] = useState<string[]>([])
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([])
  const [showCompaniesOnly, setShowCompaniesOnly] = useState(false)
  const [isFilterActive, setIsFilterActive] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients()
        setClients(data)
        setFilteredClients(data)
      } catch (error) {
        console.error("Error fetching clients:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  useEffect(() => {
    // Apply all filters: search query, quote types, quote statuses, service types, and company filter
    let filtered = clients

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        client =>
          client.name.toLowerCase().includes(query) ||
          (client.company && client.company.toLowerCase().includes(query)) ||
          client.email.toLowerCase().includes(query) ||
          client.phone.includes(query)
      )
    }

    // Apply company filter
    if (showCompaniesOnly) {
      filtered = filtered.filter(client => {
        // Check if client has any quotes with raison_sociale not null
        const clientWithQuotes = client as any
        if (!clientWithQuotes.quotes) return false
        
        return clientWithQuotes.quotes.some((quote: any) => 
          quote.raison_sociale && quote.raison_sociale.trim() !== ""
        )
      })
    }

    // Apply service type filter
    if (selectedServiceTypes.length > 0) {
      filtered = filtered.filter(client => {
        const clientServiceTypes = getClientServiceTypes(client)
        return selectedServiceTypes.some(serviceType => 
          clientServiceTypes.includes(serviceType)
        )
      })
    }

    // Apply quote type filter
    if (selectedQuoteTypes.length > 0) {
      filtered = filtered.filter(client => {
        // Check if client has any quotes that match the selected types
        const clientWithQuotes = client as any
        if (!clientWithQuotes.quotes) return false
        
        return clientWithQuotes.quotes.some((quote: any) => 
          selectedQuoteTypes.includes(quote.quote_type)
        )
      })
    }

    // Apply quote status filter
    if (selectedQuoteStatuses.length > 0) {
      filtered = filtered.filter(client => {
        // Check if client has any quotes that match the selected statuses
        const clientWithQuotes = client as any
        if (!clientWithQuotes.quotes) return false
        
        return clientWithQuotes.quotes.some((quote: any) => 
          selectedQuoteStatuses.includes(quote.status)
        )
      })
    }

    setFilteredClients(filtered)
    setCurrentPage(1)
    
    // Update filter active state
    setIsFilterActive(selectedQuoteTypes.length > 0 || selectedQuoteStatuses.length > 0 || selectedServiceTypes.length > 0 || showCompaniesOnly)
  }, [searchQuery, clients, selectedQuoteTypes, selectedQuoteStatuses, selectedServiceTypes, showCompaniesOnly])

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentClients = filteredClients.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleClientClick = (client: Client) => {
    router.push(`/clients/${client.id}`)
  }
  
  const handleQuoteTypeChange = (type: string) => {
    setSelectedQuoteTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }
  
  const handleQuoteStatusChange = (status: string) => {
    setSelectedQuoteStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }
  
  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceTypes(prev => {
      if (prev.includes(serviceType)) {
        return prev.filter(s => s !== serviceType)
      } else {
        return [...prev, serviceType]
      }
    })
  }
  
  const clearFilters = () => {
    setSelectedQuoteTypes([])
    setSelectedQuoteStatuses([])
    setSelectedServiceTypes([])
    setShowCompaniesOnly(false)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos clients et consultez leurs informations
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative w-full md:w-auto">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un client..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Add filter button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={isFilterActive ? "default" : "outline"} 
                size="icon"
                className={isFilterActive ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                <MixerHorizontalIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtres</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    disabled={!isFilterActive}
                  >
                    <Cross2Icon className="h-4 w-4 mr-2" />
                    Effacer
                  </Button>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Type de client</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="companies-only" 
                        checked={showCompaniesOnly}
                        onCheckedChange={(checked) => setShowCompaniesOnly(checked as boolean)}
                      />
                      <Label htmlFor="companies-only">Entreprises uniquement</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Type de services</h5>
                  <div className="space-y-2">
                    {serviceTypeFilters.map((serviceType) => (
                      <div key={serviceType.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`service-${serviceType.value}`} 
                          checked={selectedServiceTypes.includes(serviceType.value)}
                          onCheckedChange={() => handleServiceTypeChange(serviceType.value)}
                        />
                        <Label htmlFor={`service-${serviceType.value}`}>{serviceType.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Type de devis</h5>
                  <div className="space-y-2">
                    {quoteTypeFilters.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type.value}`} 
                          checked={selectedQuoteTypes.includes(type.value)}
                          onCheckedChange={() => handleQuoteTypeChange(type.value)}
                        />
                        <Label htmlFor={`type-${type.value}`}>{type.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Statut du devis</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {quoteStatus.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status.value}`} 
                          checked={selectedQuoteStatuses.includes(status.value)}
                          onCheckedChange={() => handleQuoteStatusChange(status.value)}
                        />
                        <Label htmlFor={`status-${status.value}`} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Display active filters */}
      {isFilterActive && (
        <div className="mb-4 flex flex-wrap gap-2">
          {showCompaniesOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Entreprises uniquement
              <Cross2Icon 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setShowCompaniesOnly(false)}
              />
            </Badge>
          )}
          {selectedServiceTypes.map(serviceType => (
            <Badge key={`service-${serviceType}`} variant="secondary" className="flex items-center gap-1">
              {serviceTypeFilters.find(s => s.value === serviceType)?.label}
              <Cross2Icon 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleServiceTypeChange(serviceType)}
              />
            </Badge>
          ))}
          {selectedQuoteTypes.map(type => (
            <Badge key={`type-${type}`} variant="secondary" className="flex items-center gap-1">
              {quoteTypeFilters.find(t => t.value === type)?.label}
              <Cross2Icon 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleQuoteTypeChange(type)}
              />
            </Badge>
          ))}
          {selectedQuoteStatuses.map(status => (
            <Badge key={`status-${status}`} variant="secondary" className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: quoteStatus.find(s => s.value === status)?.color }}
              />
              {quoteStatus.find(s => s.value === status)?.name}
              <Cross2Icon 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleQuoteStatusChange(status)}
              />
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="hidden md:table-cell">Ville</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentClients.length > 0 ? (
                  currentClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleClientClick(client)}
                    >
                      <TableCell className="font-medium">
                        {client.name}
                        {client.company && (
                          <div className="text-sm text-muted-foreground">{client.company}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{client.email || "—"}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.city || "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Aucun client trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault()
                        if (currentPage > 1) handlePageChange(currentPage - 1)
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                              e.preventDefault()
                              handlePageChange(page)
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    // Show ellipsis for gaps
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <span className="px-4 py-2">...</span>
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault()
                        if (currentPage < totalPages) handlePageChange(currentPage + 1)
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
} 