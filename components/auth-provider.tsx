'use client'

import { Spinner } from '@/components/atomics/spinner'
import { addActivity, getUserData } from '@/lib/database'
import { auth } from '@/lib/firebase'
import type { UserData, UserRole } from '@/types'
import { ActivityActionType } from '@/types/database'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  userData: UserData | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  userData: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setUser(user)

      if (user) {
        try {
          // Email verification is no longer required for login
          // Users can sign in immediately after registration with "pending" status

          // Fetch user data from Firestore
          const fetchedUserData = await getUserData(user.uid)

          if (fetchedUserData) {
            if (fetchedUserData.status === 'pending') {
              // User dengan status pending tidak boleh masuk ke sistem
              // Logout user dan tampilkan pesan bahwa akun menunggu persetujuan admin
              await addActivity({
                userId: user.uid,
                type: 'auth',
                action: ActivityActionType.AUTH_LOGIN,
                status: 'unread',
                targetId: user.uid,
                targetName: user.displayName || user.email || 'User',
                details: {
                  message: `${user.displayName || user.email} attempted to login with pending account.`,
                  login_status: 'denied_pending_approval',
                },
              })
              await signOut(auth) // Logout user
              setUser(null)
              setUserRole(null)
              setUserData(null)
              setLoading(false)

              // Set error message untuk ditampilkan di login form
              // Kita akan menggunakan localStorage untuk menyimpan pesan error sementara
              localStorage.setItem(
                'pendingAccountMessage',
                'Akun Anda sedang menunggu persetujuan admin. Silakan tunggu hingga admin menyetujui akun Anda sebelum dapat masuk ke sistem.'
              )

              return // Stop further processing
            }

            // User dengan status active bisa login
            setUserRole(fetchedUserData.role)
            setUserData(fetchedUserData)

            // Log successful login activity
            await addActivity({
              userId: user.uid,
              type: 'auth',
              action: ActivityActionType.AUTH_LOGIN,
              status: 'unread',
              targetId: user.uid,
              targetName: user.displayName || user.email || 'User',
              details: {
                message: `${user.displayName || user.email} logged in successfully.`,
                login_status: 'active',
              },
            })

            // Check for pending user creation activity
            const pendingCreation = localStorage.getItem('pendingUserCreation')
            if (pendingCreation && fetchedUserData.role === 'admin') {
              try {
                const creationData = JSON.parse(pendingCreation)
                if (creationData.adminEmail === user.email) {
                  // Add the pending activity
                  await addActivity({
                    userId: user.uid,
                    type: 'user',
                    action: ActivityActionType.USER_CREATED,
                    targetId: creationData.newUserId,
                    targetName: creationData.newUserName,
                    status: 'unread',
                    details: {
                      message: `${creationData.adminDisplayName || creationData.adminEmail} added ${creationData.newUserName} as a new ${creationData.newUserRole}.`,
                      adminActor: creationData.adminDisplayName || creationData.adminEmail,
                      newUserName: creationData.newUserName,
                      newUserRole: creationData.newUserRole,
                    },
                  })
                  // Clear the pending creation
                  localStorage.removeItem('pendingUserCreation')
                }
              } catch (error) {
                console.error('Error processing pending user creation:', error)
                localStorage.removeItem('pendingUserCreation')
              }
            }
          } else {
            // Data pengguna tidak ditemukan di Firestore untuk pengguna yang terautentikasi ini.
            // Ini bisa berarti data Firestore dihapus oleh admin, atau akun dibuat langsung di Firebase Console.
            // Jangan buat ulang data. Logout pengguna dan tampilkan pesan.
            console.warn(
              `User ${user.uid} authenticated but no Firestore record found. Logging out.`
            )
            toast.error(
              'User profile not found. Please contact administrator if you believe this is an error.',
              { duration: 7000 }
            )
            await signOut(auth) // Logout pengguna
            setUser(null)
            setUserRole(null)
            setUserData(null)
            // setLoading(false) dan redirect akan ditangani oleh blok 'else' di bawah setelah signOut
            return // Hentikan proses lebih lanjut untuk user ini
          }

          // Only redirect to dashboard if on login or register page
          if (pathname === '/' || pathname === '/register') {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setUserRole(null)
        setUserData(null)
        setLoading(false)

        // Only redirect to login if on a protected page
        if (
          pathname !== '/' &&
          pathname !== '/register' &&
          pathname !== '/verify-email' &&
          pathname !== '/forgot-password'
        ) {
          router.push('/')
        }
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
