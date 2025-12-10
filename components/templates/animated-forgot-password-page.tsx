'use client'

import type React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/atomics/alert'
import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Spinner } from '@/components/atomics/spinner'
import { SimpleThemeToggle } from '@/components/theme-toggle'
import { auth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import Link from 'next/link'
import { useState } from 'react'
import { Logo } from '../atomics/logo'

export function AnimatedForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/`,
        handleCodeInApp: false,
      })
      setSuccessMessage(
        'Password reset email sent! Please check your inbox (and spam folder) for instructions.'
      )
      setEmail('')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to send password reset email. Please try again.')
        console.error('Password reset error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-background flex flex-col items-center justify-center p-4'>
      <div className='absolute top-4 right-4 z-10'>
        <SimpleThemeToggle />
      </div>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <Logo />
            <h1 className='text-3xl font-bold ml-2'>Team Sync</h1>
          </div>
          <p className='text-muted-foreground'>Forgot your password? No problem.</p>
        </div>
        <div className='bg-card border rounded-lg shadow-sm p-8'>
          {successMessage ? (
            <div className='space-y-6'>
              <Alert variant='default'>
                <AlertTitle>Email Sent Successfully</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
              <div className='text-center'>
                <Link
                  href='/'
                  className='text-sm font-medium text-primary hover:text-primary/80 transition-colors'
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <p className='text-sm text-center text-muted-foreground'>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='Enter your email address'
                  required
                />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading && <Spinner className='mr-2' />}
                Send Reset Email
              </Button>
              <div className='text-center text-sm'>
                <p className='text-muted-foreground'>
                  Remember your password?{' '}
                  <Link
                    href='/'
                    className='font-medium text-primary hover:text-primary/80 transition-colors'
                  >
                    Back to Sign In
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
