import { Button } from '@/components/atomics/Button.atomic'
import { Label } from '@/components/atomics/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import { Badge } from '@/components/atomics/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  addExistingProjectToTeam,
  getTeams,
  removeTeamFromProject,
  type Team,
} from '@/lib/firestore'
import { DialogDescription } from '@radix-ui/react-dialog'
import { CircleX, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AddTeamDialogProps {
  projectId: string
  existingTeamIds: string[]
  isOpen: boolean
  onClose: () => void
  onTeamsAdded?: (addedTeamIds: string[]) => void
}

export type { AddTeamDialogProps }

export function AddTeamDialog({
  projectId,
  existingTeamIds,
  isOpen,
  onClose,
  onTeamsAdded,
}: AddTeamDialogProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)
      setSelectedTeams([]) // Reset selected teams when dialog opens
      setError(null) // Reset error state
      const allTeams = await getTeams(undefined, 'admin')
      setTeams(allTeams.filter(t => !existingTeamIds.includes(t.id)))
      setLoading(false)
    }
    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen, existingTeamIds])

  const handleAddTeam = (teamId: string) => {
    if (!selectedTeams.includes(teamId)) {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  const handleDeselectTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter(id => id !== teamId))
  }

  const handleConfirmAddTeams = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      for (const teamId of selectedTeams) {
        await addExistingProjectToTeam(teamId, projectId)
      }
      if (onTeamsAdded) onTeamsAdded(selectedTeams)
      onClose()
    } catch (e) {
      setError('Failed to add team(s) to project.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-lg max-h-[90dvh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Add Team to Project</DialogTitle>
          <DialogDescription>Add teams to the project to collaborate with them.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 pt-6'>
          <form onSubmit={handleConfirmAddTeams} className='space-y-4'>
            <div className='grid gap-4'>
              <div className='grid gap-4'>
                <Label htmlFor='teams'>
                  Assign Teams {selectedTeams.length > 0 && `(${selectedTeams.length} selected)`}
                </Label>
                <Select onValueChange={handleAddTeam}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select teams' />
                  </SelectTrigger>
                  <SelectContent className='max-h-60 overflow-y-auto'>
                    {teams.length === 0 ? (
                      <div className='p-2 text-sm text-muted-foreground select-none'>
                        No teams available
                      </div>
                    ) : (
                      teams.map(team => (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={selectedTeams.includes(team.id)}
                        >
                          {team.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-wrap gap-2 min-h-[2rem]'>
                {selectedTeams.length === 0 ? (
                  <p className='text-sm text-muted-foreground py-1'>No teams selected yet</p>
                ) : (
                  selectedTeams.map(teamId => {
                    const team = teams.find(t => t.id === teamId)
                    return (
                      <Badge key={teamId} variant='secondary' className='gap-1 pr-1'>
                        {team ? team.name : 'Unknown Team'}
                        <button
                          type='button'
                          onClick={() => handleDeselectTeam(teamId)}
                          className='ml-1 rounded-full outline-none focus:ring-2 hover:bg-destructive/20 p-0.5'
                          aria-label={`Remove ${team?.name || 'team'}`}
                        >
                          <CircleX className='h-3 w-3' />
                        </button>
                      </Badge>
                    )
                  })
                )}
              </div>
            </div>

            {error && <div className='text-red-500 text-sm'>{error}</div>}
          </form>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAddTeams} disabled={selectedTeams.length === 0 || loading}>
            {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Add Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Props and component for removing a team from a project
interface RemoveTeamDialogProps {
  projectId: string
  teamId: string
  isOpen: boolean
  onClose: () => void
  onTeamRemoved?: (teamId: string) => void
  teamName?: string | undefined
}

export function RemoveTeamDialog({
  projectId,
  teamId,
  isOpen,
  onClose,
  onTeamRemoved,
  teamName,
}: RemoveTeamDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await removeTeamFromProject(projectId, teamId)
      if (onTeamRemoved) onTeamRemoved(teamId)
      onClose()
    } catch (e) {
      setError('Failed to remove team from project.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-lg'>
        <DialogHeader>
          <DialogTitle>Remove Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {teamName ?? 'team'} from this project?
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            The team itself will not be deleted, only unlinked from this project.
          </p>
          {error && <p className='text-sm text-red-500'>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
