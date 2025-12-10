/**
 * Browser Console Debugging Commands for Cloudinary Upload Issues
 * 
 * Copy and paste these commands into your browser console (F12 → Console)
 * while on your application page to debug upload issues.
 */

// Command 1: Test minimal Cloudinary upload (like working browser test)
window.testCloudinaryMinimal = async () => {
  console.log('🧪 Testing minimal Cloudinary upload...')
  
  try {
    const formData = new FormData()
    formData.append('upload_preset', 'ml_default')
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/auto/upload', {
      method: 'POST',
      body: formData
    })
    
    console.log('📡 Response status:', response.status)
    const text = await response.text()
    console.log('📄 Response text:', text)
    
    if (response.status === 400 && text.includes('Missing required parameter - file')) {
      console.log('✅ Minimal upload working! Preset is configured correctly.')
    } else {
      console.log('❌ Unexpected response. Check preset configuration.')
    }
  } catch (error) {
    console.error('❌ Minimal upload failed:', error)
    console.log('🔍 This suggests a network/CORS issue')
  }
}

// Command 2: Test with headers (current app implementation)
window.testCloudinaryWithHeaders = async () => {
  console.log('🧪 Testing Cloudinary upload with headers...')
  
  try {
    const formData = new FormData()
    formData.append('upload_preset', 'ml_default')
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/auto/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    })
    
    console.log('📡 Response status:', response.status)
    const text = await response.text()
    console.log('📄 Response text:', text)
  } catch (error) {
    console.error('❌ Headers test failed:', error)
    console.log('🔍 Headers might be causing CORS issues')
  }
}

// Command 3: Test resource-specific endpoint
window.testCloudinaryResourceEndpoint = async () => {
  console.log('🧪 Testing resource-specific endpoint...')
  
  try {
    const formData = new FormData()
    formData.append('upload_preset', 'ml_default')
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/raw/upload', {
      method: 'POST',
      body: formData
    })
    
    console.log('📡 Response status:', response.status)
    const text = await response.text()
    console.log('📄 Response text:', text)
  } catch (error) {
    console.error('❌ Resource endpoint test failed:', error)
    console.log('🔍 Resource-specific endpoints might have issues')
  }
}

// Command 4: Test with file input
window.testCloudinaryFileUpload = () => {
  console.log('🧪 Creating file input for upload test...')
  
  const input = document.createElement('input')
  input.type = 'file'
  input.style.position = 'fixed'
  input.style.top = '10px'
  input.style.left = '10px'
  input.style.zIndex = '9999'
  input.style.background = 'white'
  input.style.border = '2px solid red'
  input.style.padding = '10px'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    console.log(`🧪 Testing file upload: ${file.name} (${file.size} bytes)`)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'ml_default')
      formData.append('folder', 'team-sync/debug-test')
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/auto/upload', {
        method: 'POST',
        body: formData
      })
      
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Upload successful!')
        console.log('🔗 URL:', result.secure_url)
        console.log('📄 Full result:', result)
      } else {
        const text = await response.text()
        console.error('❌ Upload failed:', text)
      }
    } catch (error) {
      console.error('❌ File upload failed:', error)
    } finally {
      document.body.removeChild(input)
    }
  }
  
  document.body.appendChild(input)
  console.log('📁 File input added to page. Select a file to test upload.')
}

// Command 5: Check network environment
window.checkNetworkEnvironment = () => {
  console.log('🌐 Checking network environment...')
  console.log('📍 Location:', window.location.href)
  console.log('🔒 Protocol:', window.location.protocol)
  console.log('🌍 User Agent:', navigator.userAgent)
  console.log('📡 Online:', navigator.onLine)
  console.log('🔧 Connection:', navigator.connection ? {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt
  } : 'Not available')
}

// Command 6: Run all tests
window.runAllCloudinaryTests = async () => {
  console.log('🚀 Running all Cloudinary tests...')
  
  checkNetworkEnvironment()
  console.log('\n' + '='.repeat(50))
  
  await testCloudinaryMinimal()
  console.log('\n' + '='.repeat(50))
  
  await testCloudinaryWithHeaders()
  console.log('\n' + '='.repeat(50))
  
  await testCloudinaryResourceEndpoint()
  console.log('\n' + '='.repeat(50))
  
  console.log('🏁 All tests completed!')
  console.log('📁 Run testCloudinaryFileUpload() to test with actual file')
}

// Instructions
console.log(`
🔧 Cloudinary Debug Commands Loaded!

Available commands:
• testCloudinaryMinimal() - Test basic upload (should work)
• testCloudinaryWithHeaders() - Test with Accept header
• testCloudinaryResourceEndpoint() - Test raw endpoint
• testCloudinaryFileUpload() - Test with actual file
• checkNetworkEnvironment() - Check network settings
• runAllCloudinaryTests() - Run all tests

Start with: runAllCloudinaryTests()
`)
