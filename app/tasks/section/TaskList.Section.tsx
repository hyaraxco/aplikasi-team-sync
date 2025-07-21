'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import React from 'react'
import TaskCard, { TaskCardProps } from './TaskCard.section'

interface TaskListProps {
  title: string
  tasks: TaskCardProps[]
  onTaskClick: (task: TaskCardProps) => void
  droppableId: string
  enableDragDrop?: boolean
  onApproveTask?: (task: TaskCardProps) => void
  userRole?: 'admin' | 'employee'
}

const TaskList: React.FC<TaskListProps> = ({
  title,
  tasks,
  onTaskClick,
  droppableId,
  enableDragDrop = false,
  onApproveTask,
  userRole = 'employee',
}) => {
  // Count tasks by approval status
  const pendingApprovalCount = tasks.filter(
    task => (task as any).approvalStatus === 'pending'
  ).length
  const showApprovalCount = droppableId === 'completed' && pendingApprovalCount > 0

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='flex justify-between items-center text-lg font-medium'>
          <span>{title}</span>
          <span className='text-muted-foreground text-sm font-normal'>{tasks.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enableDragDrop ? (
          <Droppable droppableId={droppableId}>
            {provided => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className='space-y-2 min-h-[200px]'
              >
                {tasks.length > 0 ? (
                  tasks.map((task, index) => {
                    // Disable dragging for employees when task is completed (pending review) or done (approved)
                    const isDragDisabled =
                      userRole === 'employee' &&
                      (task.status === 'completed' || task.status === 'done')

                    return (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                        isDragDisabled={isDragDisabled}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className='relative'>
                              <TaskCard {...task} onClick={() => onTaskClick(task)} />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })
                ) : (
                  <div className='flex items-center justify-center h-[200px] border border-dashed rounded-lg'>
                    <p className='text-muted-foreground text-sm'>No tasks</p>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <div className='space-y-2'>
            {tasks.length > 0 ? (
              tasks.map(task => (
                <div key={task.id} className='relative'>
                  <TaskCard {...task} onClick={() => onTaskClick(task)} />
                </div>
              ))
            ) : (
              <div className='flex items-center justify-center h-[200px] border border-dashed rounded-lg'>
                <p className='text-muted-foreground text-sm'>No tasks</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TaskList
