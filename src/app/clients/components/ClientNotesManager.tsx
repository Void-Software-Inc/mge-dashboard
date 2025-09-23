"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Pencil1Icon, CheckIcon, Cross2Icon, FileTextIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"
import { ClientNote } from "@/utils/types/clients"

interface ClientNotesManagerProps {
  phoneNumber: string
}

export default function ClientNotesManager({ 
  phoneNumber
}: ClientNotesManagerProps) {
  const [notes, setNotes] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch notes when component mounts or phoneNumber changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!phoneNumber) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/client-notes?phone_number=${encodeURIComponent(phoneNumber)}`)
        if (response.ok) {
          const data = await response.json()
          setNotes(data.notes?.notes || '')
        }
      } catch (error) {
        console.error('Error fetching notes:', error)
      } finally {
        setIsLoading(false)
        setIsInitialLoad(false)
      }
    }

    fetchNotes()
  }, [phoneNumber])

  const handleSave = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/client-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          notes: notes.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      const data = await response.json()
      setNotes(data.notes.notes)
      setHasUnsavedChanges(false)
      setIsEditing(false)
      toast.success('Notes sauvegardées avec succès')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Erreur lors de la sauvegarde des notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset to the last saved notes by refetching
    const resetNotes = async () => {
      try {
        const response = await fetch(`/api/client-notes?phone_number=${encodeURIComponent(phoneNumber)}`)
        if (response.ok) {
          const data = await response.json()
          setNotes(data.notes?.notes || '')
        }
      } catch (error) {
        console.error('Error resetting notes:', error)
      }
    }
    
    resetNotes()
    setHasUnsavedChanges(false)
    setIsEditing(false)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setHasUnsavedChanges(true)
  }

  const hasNotes = notes && notes.trim() !== ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            <CardTitle>Notes sur le client</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                <Pencil1Icon className="h-4 w-4 mr-1" />
                {hasNotes ? 'Modifier' : 'Ajouter'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <Cross2Icon className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-lime-300 hover:bg-lime-400 text-black"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            )}
          </div>
        </div>
        <CardDescription>
          Ajoutez des notes personnalisées pour ce client
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Saisissez vos notes sur ce client..."
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="min-h-[120px]">
            {isInitialLoad ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm">Chargement des notes...</p>
                </div>
              </div>
            ) : hasNotes ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {notes}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune note pour ce client</p>
                  <p className="text-xs">Cliquez sur "Ajouter" pour commencer</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
