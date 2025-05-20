"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserData, createUserData, type UserRole } from "@/lib/firestore"
import { useRouter, usePathname } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          // Fetch user data from Firestore
          const userData = await getUserData(user.uid)

          if (userData) {
            setUserRole(userData.role)
          } else {
            // If user doesn't exist in Firestore yet, create a new record
            // Default to "user" role
            await createUserData(user.uid, {
              email: user.email || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              role: "user",
            })
            setUserRole("user")
          }

          // Only redirect to dashboard if on login or register page
          if (pathname === "/" || pathname === "/register") {
            router.push("/dashboard")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setUserRole(null)
        setLoading(false)

        // Only redirect to login if on a protected page
        if (pathname !== "/" && pathname !== "/register") {
          router.push("/")
        }
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, userRole, loading }}>{children}</AuthContext.Provider>
}
