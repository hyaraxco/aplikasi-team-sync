# 🚨 URGENT: Fix Permission Errors

## Problem
Employee users getting "Missing or insufficient permissions" errors when accessing:
- Attendance page
- Balance/Earnings page
- Real-time listeners (onSnapshot)

## Root Cause
Firestore security rules are not deployed or are too restrictive.

## IMMEDIATE SOLUTION (5 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **team-sync-ede50**
3. Click: **Firestore Database** → **Rules** tab

### Step 2: Replace Rules
**DELETE** all existing rules and **PASTE** this:

```javascript
rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish
1. Click **"Publish"** button
2. Wait for "Rules published successfully" message

## Test After Deploy
1. Login as employee user
2. Go to Attendance page - should work
3. Go to Balance page - should work
4. Check browser console - no permission errors

## What This Does
- ✅ Allows all logged-in users to read/write all data
- ✅ Fixes permission errors immediately
- ⚠️ Not secure for production (temporary fix)

## Next Steps (After Testing)
1. Verify everything works
2. Replace with proper security rules from `firestore.rules` file
3. Test again with proper rules

## If Still Having Issues
1. Clear browser cache
2. Logout and login again
3. Check user document in Firestore has:
   - `role: "employee"`
   - `status: "active"`

## Production Rules (Use Later)
The proper secure rules are in the `firestore.rules` file in your project.
Deploy those after confirming the temporary rules work.

---
**This should fix the permission errors in under 5 minutes!**
