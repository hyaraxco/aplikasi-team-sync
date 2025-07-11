'use client'

import { Button } from '@/components/atomics/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Calendar, CheckCircle, Paperclip, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { TaskCardProps } from './TaskCard.section'

interface SidebarDetailTasksProps {
  task: TaskCardProps | null
  isOpen: boolean
  userRole: 'admin' | 'employee' | null
  onOpenChange: (isOpen: boolean) => void
  onUpdateTask: (status: 'done' | 'revision', comment?: string) => Promise<void>
}

export function SidebarDetailTasks({
  task,
  isOpen,
  userRole,
  onOpenChange,
  onUpdateTask,
}: SidebarDetailTasksProps) {
  const [revisionComment, setRevisionComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  if (!task) return null

  const handleApprove = async () => {
    setIsSubmitting(true)
    await onUpdateTask('done')
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const handleRequestRevision = async () => {
    if (!revisionComment.trim()) {
      // Maybe show a toast message
      return
    }
    setIsSubmitting(true)
    await onUpdateTask('revision', revisionComment)
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'border-red-500 text-red-500'
      case 'Medium':
        return 'border-yellow-500 text-yellow-500'
      case 'Low':
        return 'border-green-500 text-green-500'
      default:
        return ''
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader className='space-y-1 pb-4'>
          <div className='flex justify-between items-center'>
            <SheetTitle className='text-lg'>{task.name}</SheetTitle>
            <Badge variant='outline' className={getPriorityClass(task.priority)}>
              {task.priority}
            </Badge>
          </div>
          <SheetDescription className='flex items-center gap-2 text-xs'>
            <Calendar className='h-3.5 w-3.5' />
            Due {format(task.dueDate, 'PPP')}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className='mt-6 space-y-6'>
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Assigned To</h3>
            <div className='flex items-center gap-2'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={task.assignee?.avatar} />
                <AvatarFallback>{task.assignee?.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium text-sm'>{task.assignee?.name}</p>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Description</h3>
            <p className='text-sm text-muted-foreground'>{task.description}</p>
          </div>

          <Separator />

          <div className='space-y-4'>
            <h3 className='font-medium'>Activity</h3>
            <div className='flex items-start space-x-3'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={task.assignee?.avatar} />
                <AvatarFallback>{task.assignee?.initials}</AvatarFallback>
              </Avatar>
              <div className='w-full'>
                <Textarea placeholder='Add a comment...' />
                <div className='flex justify-between items-center mt-2'>
                  <div className='flex items-center gap-2'>
                    <Button variant='ghost' size='icon' disabled>
                      <Paperclip className='h-4 w-4' />
                    </Button>
                  </div>
                  <Button size='sm'>Comment</Button>
                </div>
              </div>
            </div>
          </div>

          {userRole === 'admin' && task.status === 'completed' && (
            <>
              <Separator />
              <div className='space-y-4'>
                <h3 className='text-sm font-medium text-muted-foreground'>Review Task</h3>
                <Textarea
                  placeholder='Add a revision comment... (Required for revision request)'
                  value={revisionComment}
                  onChange={e => setRevisionComment(e.target.value)}
                />
                <div className='flex justify-end gap-2 mt-2'>
                  <Button
                    variant='destructive'
                    onClick={handleRequestRevision}
                    disabled={isSubmitting || !revisionComment.trim()}
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Reject Task
                  </Button>
                  <Button onClick={handleApprove} disabled={isSubmitting}>
                    <CheckCircle className='mr-2 h-4 w-4' />
                    Approve Task
                  </Button>
                </div>
              </div>
            </>
          )}

          {userRole === 'employee' && task.status === 'rejected' && (
            <div className='flex justify-end'>
              <Button
                onClick={async () => {
                  try {
                    setIsSubmitting(true)
                    await updateDoc(doc(db, 'tasks', task.id), {
                      status: 'in_progress',
                      updatedAt: serverTimestamp(),
                    })
                    setIsSubmitting(false)
                    onOpenChange(false)
                    toast({ title: 'Task diambil ulang, silakan kerjakan!' })
                  } catch (err) {
                    setIsSubmitting(false)
                    toast({
                      title: 'Gagal mengubah status task',
                      description: (err as any)?.message || 'Terjadi kesalahan.',
                      variant: 'destructive',
                    })
                  }
                }}
                disabled={isSubmitting}
              >
                Kerjakan Ulang
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
