# Cloudinary Unsigned Upload Preset Setup

## 🚨 **CRITICAL: Upload Preset Configuration Required**

The error **"Upload preset must be whitelisted for unsigned uploads"** means you need to create or configure an unsigned upload preset.

## 📋 **Step-by-Step Solution**

### **Option 1: Create New Unsigned Preset (Recommended)**

1. **Login to Cloudinary Dashboard**
   - Go to [https://cloudinary.com](https://cloudinary.com)
   - Login with your account

2. **Navigate to Upload Settings**
   - Click **Settings** (⚙️) → **Upload**
   - Find "Upload presets" section

3. **Create New Preset**
   - Click **"Add upload preset"**
   - **Preset name**: `team-sync-uploads`
   - **Signing mode**: **Unsigned** (CRITICAL!)
   - **Use filename**: Yes
   - **Unique filename**: Yes
   - **Resource type**: Auto
   - **Access mode**: Public
   - Click **"Save"**

4. **Update Environment Variable**
   ```env
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=team-sync-uploads
   ```

### **Option 2: Modify Existing ml_default Preset**

1. **Find ml_default Preset**
   - In Cloudinary dashboard → Settings → Upload
   - Find `ml_default` in the list

2. **Edit the Preset**
   - Click on `ml_default`
   - Change **Signing mode** to **Unsigned**
   - Click **"Save"**

3. **Keep Current Environment Variable**
   ```env
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
   ```

## 🔍 **Understanding the Error**

According to Cloudinary documentation:

- **Signed uploads**: Require API secret, used for server-side uploads
- **Unsigned uploads**: Use upload presets, used for client-side uploads
- **Our case**: Client-side upload from browser requires unsigned preset

## ✅ **Verification Steps**

After creating/updating the preset:

1. **Test Configuration**
   ```bash
   node scripts/test-cloudinary-config.js
   ```

2. **Expected Output**
   ```
   ✅ image endpoint accessible (missing file expected)
   ✅ raw endpoint accessible (missing file expected)
   ✅ auto endpoint accessible (missing file expected)
   ```

3. **Test in Application**
   ```bash
   npm run dev
   # Try uploading a file in task sidebar
   ```

## 🛠️ **Preset Configuration Details**

### **Required Settings:**
- **Signing mode**: Unsigned
- **Resource type**: Auto (allows all file types)
- **Access mode**: Public

### **Recommended Settings:**
- **Use filename**: Yes
- **Unique filename**: Yes
- **Max file size**: 10485760 (10MB)
- **Allowed formats**: Leave empty (allow all)

### **Optional Settings:**
- **Folder**: Leave empty (we set this programmatically)
- **Tags**: Leave empty
- **Transformations**: Leave empty

## 🔄 **Alternative: Use Cloudinary's Default Unsigned Preset**

Some Cloudinary accounts have a default unsigned preset. Check your dashboard for:
- `unsigned_preset`
- `ml_default` (if already unsigned)
- Any preset with "Unsigned" signing mode

## 📞 **If Still Having Issues**

1. **Double-check signing mode** - Must be "Unsigned"
2. **Verify preset name** - Must match environment variable exactly
3. **Check account limits** - Free accounts have upload limits
4. **Contact Cloudinary support** - If preset creation fails

## 🎯 **Expected Result**

After proper setup, uploads should work with:
```
✅ Using Cloudinary storage service
✅ Uploading to Cloudinary: { url: "...", folder: "..." }
✅ Cloudinary response status: 200
✅ Cloudinary upload success: { url: "...", public_id: "..." }
```

The key is ensuring the upload preset is configured for **unsigned uploads**!
