import * as React from 'react'

import { cn } from '@/lib/ui'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'

    const handleTogglePassword = () => {
      setShowPassword(prev => !prev)
    }

    return (
      <div className='relative'>
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            isPassword ? 'pr-10' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type='button'
            onClick={handleTogglePassword}
            className='absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground'
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
