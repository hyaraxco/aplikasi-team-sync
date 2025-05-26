// Create this new file to implement the getUsers function that's imported in attendance-content.tsx

import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import type { UserData } from "./firestore"

export async function getUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserData)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}
