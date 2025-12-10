'use client'

import { Textarea } from '@/components/atomics/textarea'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface EmployeeCommentTextareaProps {
  initialValue: string
  onChange: (value: string) => void
  disabled: boolean
  taskId: string
}

export const EmployeeCommentTextarea = memo(function EmployeeCommentTextarea({
  initialValue,
  onChange,
  disabled,
  taskId,
}: EmployeeCommentTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [internalValue, setInternalValue] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync initial value changes only when task changes
  useEffect(() => {
    if (!isFocused) {
      setInternalValue(initialValue)
    }
  }, [initialValue, taskId])

  // Ensure focus is maintained during typing
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      // Use requestAnimationFrame to ensure focus is set after any potential re-renders
      requestAnimationFrame(() => {
        if (textareaRef.current && document.activeElement !== textareaRef.current) {
          textareaRef.current.focus()
        }
      })
    }
  }, [isFocused, internalValue])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      onChange(newValue)
    },
    [onChange]
  )

  const handleFocus = useCallback(() => {
    // Clear any pending blur timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current)
    }
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    // Delay blur to allow for potential refocus (e.g., from parent re-render)
    focusTimeoutRef.current = setTimeout(() => {
      setIsFocused(false)
    }, 100)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Textarea
      ref={textareaRef}
      id='employee-comment'
      placeholder='Add notes about your completed work, challenges faced, or anything the reviewer should know...'
      value={internalValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className='min-h-[80px] bg-white dark:bg-gray-800'
      disabled={disabled}
    />
  )
})
