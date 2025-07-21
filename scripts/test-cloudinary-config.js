/**
 * Test Cloudinary configuration with updated settings
 */

/* eslint-disable no-console */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testCloudinaryConfig() {
  console.log('🧪 Testing Updated Cloudinary Configuration...\n')

  // Check configuration
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  console.log('📋 Configuration Check:')
  console.log(`   Cloud Name: ${cloudName || '❌ Missing'}`)
  console.log(`   API Key: ${apiKey || '❌ Missing'}`)
  console.log(`   Upload Preset: ${uploadPreset || '❌ Missing'}`)
  console.log('')

  if (!cloudName || !apiKey || !uploadPreset) {
    console.log('❌ Configuration incomplete!')
    return
  }

  // Test different resource type endpoints
  const endpoints = [
    { type: 'image', url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` },
    { type: 'raw', url: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload` },
    { type: 'auto', url: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload` }
  ]

  for (const endpoint of endpoints) {
    console.log(`🔗 Testing ${endpoint.type} endpoint...`)
    console.log(`   URL: ${endpoint.url}`)

    try {
      const formData = new FormData()
      formData.append('upload_preset', uploadPreset)

      const response = await fetch(endpoint.url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log(`   Status: ${response.status}`)

      if (response.status === 400) {
        const errorText = await response.text()
        if (errorText.includes('Missing required parameter - file')) {
          console.log(`   ✅ ${endpoint.type} endpoint accessible (missing file expected)`)
        } else if (errorText.includes('upload_preset')) {
          console.log(`   ❌ Upload preset '${uploadPreset}' not found or invalid`)
          console.log(`   Please check your Cloudinary dashboard: Settings > Upload presets`)
        } else {
          console.log(`   ⚠️  Unexpected error: ${errorText.substring(0, 100)}...`)
        }
      } else if (response.status === 200) {
        console.log(`   ✅ ${endpoint.type} endpoint working perfectly!`)
      } else {
        const errorText = await response.text()
        console.log(`   ❌ Error ${response.status}: ${errorText.substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`)
      if (error.message.includes('fetch')) {
        console.log(`   This might be a CORS or network connectivity issue`)
      }
    }
    console.log('')
  }

  console.log('🎯 Summary:')
  console.log('✅ Configuration loaded from .env.local')
  console.log(`✅ Using upload preset: ${uploadPreset}`)
  console.log('✅ Testing complete')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. If endpoints are accessible, try uploading in the app')
  console.log('2. If upload preset errors, check Cloudinary dashboard')
  console.log('3. If network errors, check internet connection')
}

testCloudinaryConfig().catch(console.error)
