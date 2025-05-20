"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updateTeam } from "@/lib/firestore"
import { Loader2 } from "lucide-react"

interface EditTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: {
    id: string
    name: string
    description: string
  }
}

export function EditTeamDialog({ open, onOpenChange, team }: EditTeamDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Team name is required"
    } else if (name.length > 50) {
      newErrors.name = "Team name must be less than 50 characters"
    }

    if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      await updateTeam(team.id, {
        name,
        description,
      })

      toast({
        title: "Team updated",
        description: "The team has been updated successfully.",
      })

      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Make changes to the team information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center justify-between">
                Team Name
                {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
                disabled={isSubmitting}
                className={errors.name ? "border-destructive" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center justify-between">
                Description
                {errors.description && <span className="text-xs text-destructive">{errors.description}</span>}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter team description"
                disabled={isSubmitting}
                className={errors.description ? "border-destructive" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
