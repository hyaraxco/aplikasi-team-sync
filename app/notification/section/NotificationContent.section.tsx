import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import { PageHeader } from '@/components/common/layout/PageHeader'
import { Alert, AlertDescription } from '@/components/molecules/Alert.molecule'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/lib/firebase'
import { type Activity, markAllActivitiesAsRead } from '@/lib/firestore'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { Check, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import AllNotifTab from './AllNotifTab.section'
import NotifFilterBar from './NotifFilterBar.section'
import UnreadNotifTab from './UnreadNotifTab.section'

// Fungsi getUnreadActivities dimodifikasi untuk RBAC
async function getUnreadActivitiesRBAC(
  userId: string | undefined,
  userRole: string | null,
  limitCount = 50
): Promise<Activity[]> {
  if (!userId && userRole !== 'admin') {
    // Jika bukan admin dan tidak ada userId, return empty
    return []
  }

  let firestoreQuery
  if (userRole === 'admin') {
    firestoreQuery = query(
      collection(db, 'activities'),
      where('status', '==', 'unread'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
  } else if (userId) {
    // Employee
    firestoreQuery = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      where('status', '==', 'unread'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
  } else {
    return [] // Fallback
  }

  const snap = await getDocs(firestoreQuery)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity)
}

// Fungsi untuk get All Activities dengan RBAC
async function getAllActivitiesRBAC(
  userId: string | undefined,
  userRole: string | null,
  limitCount = 50
): Promise<Activity[]> {
  if (!userId && userRole !== 'admin') {
    return []
  }

  let firestoreQuery
  if (userRole === 'admin') {
    firestoreQuery = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(limitCount) // Admin melihat semua, diurutkan terbaru
    )
  } else if (userId) {
    // Employee
    firestoreQuery = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount) // Employee melihat miliknya, diurutkan terbaru
    )
  } else {
    return [] // Fallback
  }

  const snap = await getDocs(firestoreQuery)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity)
}

export default function NotificationContent() {
  const [notifications, setNotifications] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({
    category: [],
  })
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // State untuk unread
  const [unreadNotifications, setUnreadNotifications] = useState<Activity[]>([])
  const [loadingUnread, setLoadingUnread] = useState(false)
  const [errorUnread, setErrorUnread] = useState<string | null>(null)
  const { user, userRole } = useAuth()

  // Date filter state (optional, implementasi date picker terpisah jika ingin)
  // const [fromDate, setFromDate] = useState<string>("");
  // const [toDate, setToDate] = useState<string>("");

  const fetchAllNotificationsForTab = async () => {
    if (!user && userRole !== 'admin') {
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const activities = await getAllActivitiesRBAC(user?.uid, userRole, 100) // Ambil lebih banyak untuk "All"
      setNotifications(activities)
    } catch (e: any) {
      setError(e.message || 'Failed to fetch all notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadNotificationsForTab = async () => {
    if (!user && userRole !== 'admin') {
      setUnreadNotifications([])
      setLoadingUnread(false)
      return
    }
    setLoadingUnread(true)
    setErrorUnread(null)
    try {
      const unread = await getUnreadActivitiesRBAC(user?.uid, userRole, 50)
      setUnreadNotifications(unread)
    } catch (e: any) {
      setErrorUnread(e.message || 'Failed to fetch unread notifications')
    } finally {
      setLoadingUnread(false)
    }
  }

  useEffect(() => {
    fetchAllNotificationsForTab()
    fetchUnreadNotificationsForTab()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole]) // Re-fetch jika user atau role berubah

  const handleMarkAllAsRead = async () => {
    if (!user && userRole !== 'admin') return

    setLoading(true) // Bisa juga setLoadingUnread dan setLoading
    setLoadingUnread(true)

    if (userRole === 'admin') {
      // Admin menandai semua notifikasi sistem yang unread
      const q = query(collection(db, 'activities'), where('status', '==', 'unread'))
      try {
        const snap = await getDocs(q)
        const batch = writeBatch(db)
        snap.forEach(docSnap => {
          batch.update(doc(db, 'activities', docSnap.id), { status: 'read' })
        })
        await batch.commit()
      } catch (error) {
        console.error('Error marking all system activities as read:', error)
        setError('Failed to mark all as read') // Tampilkan error jika gagal
      }
    } else if (user) {
      // Employee menandai notifikasi unread miliknya
      try {
        await markAllActivitiesAsRead(user.uid)
      } catch (error) {
        console.error('Error marking employee activities as read:', error)
        setError('Failed to mark all as read')
      }
    }
    // Refresh kedua tab
    await fetchAllNotificationsForTab()
    await fetchUnreadNotificationsForTab()
    setLoading(false)
    setLoadingUnread(false)
  }

  const handleRefresh = () => {
    fetchAllNotificationsForTab()
    fetchUnreadNotificationsForTab()
  }

  // Filter & sort logic HANYA untuk tab All
  let filteredForAllTab = notifications // Gunakan state 'notifications' untuk tab All
  if (activeTab === 'all') {
    // Hanya filter jika tab 'all' aktif
    if (searchTerm) {
      filteredForAllTab = filteredForAllTab.filter(
        n =>
          n.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.details?.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.targetName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filters.category && filters.category.length > 0) {
      filteredForAllTab = filteredForAllTab.filter(n => filters.category!.includes(n.type))
    }

    filteredForAllTab = [...filteredForAllTab].sort((a, b) => {
      if (sortField === 'timestamp') {
        const aTime = (a.timestamp as any)?.seconds || 0
        const bTime = (b.timestamp as any)?.seconds || 0
        return sortDirection === 'desc' ? bTime - aTime : aTime - bTime
      } else if (sortField === 'type') {
        return sortDirection === 'desc'
          ? b.type.localeCompare(a.type)
          : a.type.localeCompare(b.type)
      }
      return 0
    })
  }
  // Untuk tab Unread, kita gunakan state `unreadNotifications` langsung tanpa filter FE tambahan.

  const handleFilterChange = (type: string, value: string) => {
    setFilters(prev => {
      const values = prev[type] || []
      return {
        ...prev,
        [type]: values.includes(value) ? values.filter(v => v !== value) : [...values, value],
      }
    })
  }

  const handleClearFilters = () => {
    setFilters({ category: [] })
    setSearchTerm('')
    // setFromDate("");
    // setToDate("");
  }

  return (
    <div className='flex flex-col gap-4 mb-4'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <PageHeader
          title={
            userRole === 'admin' ? 'Manage all system notifications' : 'Your recent notifications'
          }
          description='All Notifications here'
        />
        <div className='flex flex-row justify-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleRefresh}>
            <RefreshCcw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button
            variant='default'
            size='sm'
            onClick={handleMarkAllAsRead}
            disabled={loading || loadingUnread}
          >
            <Check className='mr-2 h-4 w-4' />
            Mark All as Read
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {errorUnread && activeTab === 'unread' && (
        <Alert variant='destructive'>
          <AlertDescription>{errorUnread}</AlertDescription>
        </Alert>
      )}

      <NotifFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={setSortField}
        onSortDirectionChange={setSortDirection}
        onClearFilters={handleClearFilters}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='mb-4'>
          <TabsTrigger value='all'>All Notifications</TabsTrigger>
          <TabsTrigger value='unread'>Unread ({unreadNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value='all'>
          <AllNotifTab notifications={filteredForAllTab} loading={loading} />
        </TabsContent>
        <TabsContent value='unread'>
          <UnreadNotifTab notifications={unreadNotifications} loading={loadingUnread} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
