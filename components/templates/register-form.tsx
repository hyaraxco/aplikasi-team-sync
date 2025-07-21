'use client'

import type React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/atomics/alert'
import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Spinner } from '@/components/atomics/spinner'
import { createUserData } from '@/lib/database'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useState } from 'react'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, { displayName: name })

      // Create user data in Firestore
      await createUserData(user.uid, {
        email: user.email || '',
        displayName: name,
        role: 'employee',
        status: 'pending',
      })

      // Tampilkan pesan sukses dan reset form
      setSuccessMessage(
        'Registration successful! Your account is awaiting admin approval. You will be notified once it is active.'
      )
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      // Redirect is handled by the AuthProvider
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else {
        setError('Failed to create account')
        console.error(error)
      }
    }
    setLoading(false)
  }

  if (successMessage) {
    return (
      <Alert variant='default'>
        <AlertTitle>Registration Submitted</AlertTitle>
        <AlertDescription>{successMessage}</AlertDescription>
        <Button onClick={() => setSuccessMessage('')} className='mt-4 w-full'>
          Back to Register
        </Button>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className='space-y-2'>
        <Label htmlFor='name'>Full Name</Label>
        <Input id='name' value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='password'>Password</Label>
        <Input
          id='password'
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='confirmPassword'>Confirm Password</Label>
        <Input
          id='confirmPassword'
          type='password'
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? <Spinner className='mr-2' /> : null}
        Create Account
      </Button>
    </form>
  )
}
