import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Secondary app for admin operations (creating users without affecting current session)
let secondaryApp: any = null
let secondaryAuth: any = null

try {
  secondaryApp =
    getApps().find(app => app.name === 'secondary') || initializeApp(firebaseConfig, 'secondary')
  secondaryAuth = getAuth(secondaryApp)
} catch (error) {
  console.warn('Secondary Firebase app initialization failed:', error)
}

export { app, auth, db, secondaryAuth }
