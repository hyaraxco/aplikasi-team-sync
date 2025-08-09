'use client'

import type React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/atomics/alert'
import { Button } from '@/components/atomics/button'
import { Spinner } from '@/components/atomics/spinner'
import { auth } from '@/lib/firebase'
import { sendEmailVerification } from 'firebase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface EmailVerificationProps {
  userEmail?: string
}

export function EmailVerificationForm({ userEmail }: EmailVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setError('No user logged in')
      return
    }

    setLoading(true)
    setError('')

    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/verify-email`, // Custom verification page
        handleCodeInApp: true,
      })
      
      setSuccessMessage('Verification email sent! Please check your email inbox.')
      setEmailSent(true)
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait before requesting another verification email')
      } else {
        setError('Failed to send verification email. Please try again')
        console.error('Email verification error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToLogin = () => {
    router.push('/')
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2 text-center'>
        <h2 className='text-2xl font-bold'>Verify Your Email</h2>
        <p className='text-muted-foreground'>
          We've sent a verification email to{' '}
          <span className='font-medium'>{userEmail || 'your email address'}</span>
        </p>
        <p className='text-sm text-muted-foreground'>
          Please check your email inbox (and spam folder) and click the verification link to activate your account.
        </p>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant='default'>
          <AlertTitle>Email Sent</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-4'>
        <Button 
          onClick={handleResendVerification} 
          className='w-full' 
          disabled={loading}
          variant='outline'
        >
          {loading ? <Spinner className='mr-2' /> : null}
          Resend Verification Email
        </Button>

        <Button onClick={handleContinueToLogin} className='w-full'>
          Continue to Login
        </Button>
      </div>

      <div className='text-center text-sm'>
        <p className='text-muted-foreground'>
          Already verified your email?{' '}
          <Link href='/' className='font-medium text-primary hover:underline'>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}