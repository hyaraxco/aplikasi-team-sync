import { useAuth } from '@/components/auth-provider'

export function usePermission() {
  const { userRole } = useAuth()

  return {
    isAdmin: userRole === 'admin',
    isEmployee: userRole === 'employee',
    canViewReports: userRole === 'admin',
    canManageUsers: userRole === 'admin',
    canAccessSettings: true, // semua role bisa akses settings, konten diatur di page
    // tambahkan permission lain sesuai kebutuhan
  }
}
