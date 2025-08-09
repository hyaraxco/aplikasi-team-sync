'use client'

import type React from 'react'

import { Alert, AlertDescription } from '@/components/atomics/alert'
import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Spinner } from '@/components/atomics/spinner'
import { SimpleThemeToggle } from '@/components/theme-toggle'
import { createUserData } from '@/lib/database'
import { auth } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Logo } from '../atomics/logo'

type AuthMode = 'login' | 'register'

interface AnimatedAuthPageProps {
  initialMode?: AuthMode
}

export function AnimatedAuthPage({ initialMode = 'login' }: AnimatedAuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(
    null
  )

  useEffect(() => {
    const pendingMessage = localStorage.getItem('pendingAccountMessage')
    if (pendingMessage) {
      setLoginError(pendingMessage)
      localStorage.removeItem('pendingAccountMessage')
    }
  }, [])

  const switchMode = (newMode: AuthMode) => {
    if (newMode === mode) return
    setIsTransitioning(true)
    setLoginError('')
    setRegisterError('')
    setRegisterSuccess('')
    if (newMode === 'login') {
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
      setPasswordStrength(null)
    } else {
      setLoginEmail('')
      setLoginPassword('')
    }
    setTimeout(() => {
      setMode(newMode)
      setIsTransitioning(false)
    }, 150)
  }

  const handlePasswordChange = async (newPassword: string) => {
    setRegisterPassword(newPassword)
    if (newPassword) {
      const { validatePassword } = await import('@/lib/auth/password-validation')
      const validation = validatePassword(newPassword)
      setPasswordStrength(validation.strength)
    } else {
      setPasswordStrength(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      setLoginLoading(false)
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        setLoginError('Invalid email or password.')
      } else {
        setLoginError('An unexpected error occurred. Please try again.')
        console.error(error)
      }
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match.')
      return
    }
    const { validatePassword } = await import('@/lib/auth/password-validation')
    const passwordValidation = validatePassword(registerPassword)
    if (!passwordValidation.isValid) {
      setRegisterError(passwordValidation.errors[0])
      return
    }
    setRegisterLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      )
      const user = userCredential.user
      await updateProfile(user, { displayName: registerName })
      await createUserData(user.uid, {
        email: user.email || '',
        displayName: registerName,
        role: 'employee',
        status: 'pending',
      })
      await auth.signOut()
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
      setRegisterSuccess(
        'Account created! Your account is pending admin approval. You will be able to sign in once approved.'
      )
      setTimeout(() => {
        switchMode('login')
      }, 1000)
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setRegisterError('This email is already in use.')
      } else if (error.code === 'auth/invalid-email') {
        setRegisterError('Please enter a valid email address.')
      } else {
        setRegisterError('Failed to create account. Please try again.')
        console.error(error)
      }
    }
    setRegisterLoading(false)
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
          <p className='text-muted-foreground'>
            {mode === 'login'
              ? 'Welcome back! Sign in to continue.'
              : 'Create an account to get started.'}
          </p>
        </div>
        <div className='bg-card border rounded-lg shadow-sm'>
          <div
            className={`transition-all duration-300 ease-in-out p-8 ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className='space-y-6'>
                {loginError && (
                  <Alert variant='destructive'>
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <div className='space-y-2'>
                  <Label htmlFor='login-email'>Email</Label>
                  <Input
                    id='login-email'
                    type='email'
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='login-password'>Password</Label>
                    <Link
                      href='/forgot-password'
                      className='text-sm font-medium text-primary hover:text-primary/80 transition-colors'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id='login-password'
                    type='password'
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type='submit' className='w-full' disabled={loginLoading}>
                  {loginLoading && <Spinner className='mr-2' />}
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className='space-y-4'>
                {registerError && (
                  <Alert variant='destructive'>
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                )}
                {registerSuccess && (
                  <Alert variant='default'>
                    <AlertDescription>{registerSuccess}</AlertDescription>
                  </Alert>
                )}
                <div className='space-y-2'>
                  <Label htmlFor='register-name'>Full Name</Label>
                  <Input
                    id='register-name'
                    value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='register-email'>Email</Label>
                  <Input
                    id='register-email'
                    type='email'
                    value={registerEmail}
                    onChange={e => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='register-password'>Password</Label>
                  <Input
                    id='register-password'
                    type='password'
                    value={registerPassword}
                    onChange={e => handlePasswordChange(e.target.value)}
                    required
                  />
                  {passwordStrength && (
                    <div className='text-xs'>
                      <span className='text-muted-foreground'>Password strength: </span>
                      <span
                        className={
                          passwordStrength === 'weak'
                            ? 'text-red-500'
                            : passwordStrength === 'medium'
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }
                      >
                        {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='register-confirm-password'>Confirm Password</Label>
                  <Input
                    id='register-confirm-password'
                    type='password'
                    value={registerConfirmPassword}
                    onChange={e => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type='submit' className='w-full' disabled={registerLoading}>
                  {registerLoading && <Spinner className='mr-2' />}
                  Create Account
                </Button>
              </form>
            )}
            <div className='text-center mt-6'>
              <p className='text-sm text-muted-foreground'>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className='font-bold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline'
                  disabled={isTransitioning}
                >
                  {mode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
