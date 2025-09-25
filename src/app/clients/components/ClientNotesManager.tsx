"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Pencil1Icon, CheckIcon, Cross2Icon, FileTextIcon, CalendarIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"
import { ClientNote } from "@/utils/types/clients"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ClientNotesManagerProps {
  phoneNumber: string
}

export default function ClientNotesManager({ 
  phoneNumber
}: ClientNotesManagerProps) {
  const [notes, setNotes] = useState('')
  const [firstRelationDate, setFirstRelationDate] = useState<Date | undefined>(undefined)
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
          if (data.notes?.first_relation_date) {
            // Parse the date string as local date to avoid timezone issues
            const dateParts = data.notes.first_relation_date.split('-')
            const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
            setFirstRelationDate(localDate)
          }
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
          notes: notes.trim(),
          first_relation_date: firstRelationDate ? format(firstRelationDate, 'yyyy-MM-dd') : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      const data = await response.json()
      setNotes(data.notes.notes)
      if (data.notes.first_relation_date) {
        // Parse the date string as local date to avoid timezone issues
        const dateParts = data.notes.first_relation_date.split('-')
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
        setFirstRelationDate(localDate)
      }
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
          if (data.notes?.first_relation_date) {
            // Parse the date string as local date to avoid timezone issues
            const dateParts = data.notes.first_relation_date.split('-')
            const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
            setFirstRelationDate(localDate)
          } else {
            setFirstRelationDate(undefined)
          }
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

  const handleDateChange = (date: Date | undefined) => {
    setFirstRelationDate(date)
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
                {hasNotes || firstRelationDate ? 'Modifier' : 'Ajouter'}
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
          Ajoutez des notes personnalisées sur ce client
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Date de première relation
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !firstRelationDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {firstRelationDate ? (
                      format(firstRelationDate, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={firstRelationDate}
                    onSelect={handleDateChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Saisissez vos notes sur ce client..."
                className="min-h-[120px] resize-none"
                disabled={isLoading}
              />
            </div>
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
            ) : hasNotes || firstRelationDate ? (
              <div className="space-y-4">
                {firstRelationDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date de première relation</p>
                    <p className="text-sm">
                      {format(firstRelationDate, "PPP", { locale: fr })}
                    </p>
                  </div>
                )}
                {hasNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune information pour ce client</p>
                  <p className="text-xs">Cliquez sur "Ajouter" pour ajouter des notes ou une date</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
