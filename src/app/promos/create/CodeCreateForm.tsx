"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createCodePromo } from "@/services/codesPromos"
import { toast } from "sonner"
import { useAppContext } from "@/app/context/AppContext"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

export default function CodeCreateForm() {
  const router = useRouter()
  const { setCodesPromosShouldRefetch } = useAppContext()
  
  const [formData, setFormData] = useState({
    code_promo: "",
    amount: "",
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code_promo.trim()) {
      toast.error("Le code promo est obligatoire")
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0 || parseFloat(formData.amount) > 100) {
      toast.error("Le pourcentage doit être entre 1 et 100")
      return
    }

    setIsLoading(true)
    try {
      await createCodePromo({
        code_promo: formData.code_promo.trim().toUpperCase(),
        amount: parseFloat(formData.amount),
        is_active: formData.is_active,
      })
      
      setCodesPromosShouldRefetch(true)
      toast.success("Code promo créé avec succès")
      router.push("/promos")
    } catch (error: any) {
      console.error("Error creating code promo:", error)
      toast.error(error.message || "Erreur lors de la création du code promo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/promos')}
          className="mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Retour aux codes promos
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight">Créer un code promo</h1>
        <p className="text-muted-foreground">
          Ajoutez un nouveau code de réduction pour vos clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du code promo</CardTitle>
          <CardDescription>
            Saisissez les détails du nouveau code promo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code_promo">Code promo *</Label>
              <Input
                id="code_promo"
                name="code_promo"
                type="text"
                placeholder="Ex: REDUCTION20"
                value={formData.code_promo}
                onChange={handleInputChange}
                className="uppercase"
                maxLength={50}
                required
              />
              <p className="text-sm text-muted-foreground">
                Le code sera automatiquement converti en majuscules
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Pourcentage de réduction (%) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                placeholder="Ex: 15.00"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Pourcentage de réduction qui sera appliqué au total (1-100%)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active">Code promo actif</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/promos')}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-lime-300 hover:bg-lime-400 text-black"
              >
                {isLoading ? "Création..." : "Créer le code promo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}