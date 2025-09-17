"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckIcon, ReloadIcon } from "@radix-ui/react-icons"
import { getClientMessages, updateClientMessage } from "@/services/clientMessage"
import { ClientMessage as ClientMessageType } from "@/utils/types/clientMessage"

export default function ClientMessage() {
  const [clientMessage, setClientMessage] = useState<ClientMessageType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    message: "",
    is_active: true
  })

  // Fetch the client message on component mount
  useEffect(() => {
    fetchClientMessage()
  }, [])

  const fetchClientMessage = async () => {
    try {
      setIsLoading(true)
      const messages = await getClientMessages()
      
      // Get the first (and presumably only) message
      if (messages.length > 0) {
        const message = messages[0]
        setClientMessage(message)
        setFormData({
          message: message.message,
          is_active: message.is_active
        })
      }
    } catch (error) {
      console.error('Error fetching client message:', error)
      toast.error('Erreur lors du chargement du message client')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      message: e.target.value
    }))
  }

  const handleActiveChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }))
  }

  const handleSave = async () => {
    if (!clientMessage) {
      toast.error('Aucun message client trouvé')
      return
    }

    if (!formData.message.trim()) {
      toast.error('Le message ne peut pas être vide')
      return
    }

    setIsSaving(true)
    try {
      const updatedMessage = await updateClientMessage({
        id: clientMessage.id,
        message: formData.message.trim(),
        is_active: formData.is_active
      })

      setClientMessage(updatedMessage)
      toast.success('Message client mis à jour avec succès')
    } catch (error: any) {
      console.error('Error updating client message:', error)
      
      let errorMessage = "Erreur lors de la mise à jour du message client"
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.error) {
        errorMessage = error.error
      }

      if (errorMessage.includes('required')) {
        errorMessage = "Le message est obligatoire."
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = "Erreur de connexion. Veuillez vérifier votre connexion internet."
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (clientMessage) {
      setFormData({
        message: clientMessage.message,
        is_active: clientMessage.is_active
      })
      toast.info('Modifications annulées')
    }
  }

  // Check if there are unsaved changes
  const hasChanges = clientMessage && (
    formData.message !== clientMessage.message || 
    formData.is_active !== clientMessage.is_active
  )

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!clientMessage) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-destructive">Message Client</CardTitle>
          <CardDescription>
            Aucun message client trouvé dans la base de données.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Message Client</span>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            <span className={`text-sm ${formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
              {formData.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Modifiez le message qui sera affiché sur mgevenements.fr et gérez son statut d'activation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-message">Message</Label>
          <Textarea
            id="client-message"
            placeholder="Saisissez le message à afficher aux clients..."
            value={formData.message}
            onChange={handleMessageChange}
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Ce message sera visible par dans le site mgevenements.fr</span>
            <span>{formData.message.length}/1000</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="message-active"
              checked={formData.is_active}
              onCheckedChange={handleActiveChange}
              className="data-[state=checked]:bg-lime-500"
            />
            <Label htmlFor="message-active" className="font-medium">
              Message actif
            </Label>
          </div>

          <div className="flex space-x-2">
            {hasChanges && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isSaving}
              >
                <ReloadIcon className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-lime-300 hover:bg-lime-400 text-black"
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
            ⚠️ Vous avez des modifications non sauvegardées
          </div>
        )}
      </CardContent>
    </Card>
  )
}
