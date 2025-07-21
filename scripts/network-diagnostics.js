/**
 * Comprehensive Network Diagnostics for Cloudinary Upload Issues
 * Run in browser console to diagnose "Failed to fetch" errors
 */

// Network Environment Diagnostics
window.diagnoseNetworkEnvironment = async () => {
  console.log('🌐 NETWORK ENVIRONMENT DIAGNOSTICS')
  console.log('=' .repeat(50))
  
  // Basic environment info
  console.log('📍 Location:', window.location.href)
  console.log('🔒 Protocol:', window.location.protocol)
  console.log('🌍 User Agent:', navigator.userAgent)
  console.log('📡 Online Status:', navigator.onLine)
  
  // Connection info (if available)
  if (navigator.connection) {
    console.log('🔧 Connection Info:', {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    })
  }
  
  // Check for proxy/VPN indicators
  console.log('🔍 Checking for proxy/VPN indicators...')
  
  // Test basic DNS resolution
  try {
    const start = performance.now()
    await fetch('https://api.cloudinary.com', { method: 'HEAD', mode: 'no-cors' })
    const end = performance.now()
    console.log(`✅ DNS Resolution: ${(end - start).toFixed(2)}ms`)
  } catch (error) {
    console.log('❌ DNS Resolution failed:', error.message)
  }
  
  // Test HTTPS connectivity
  try {
    const start = performance.now()
    await fetch('https://httpbin.org/get', { method: 'HEAD' })
    const end = performance.now()
    console.log(`✅ HTTPS Connectivity: ${(end - start).toFixed(2)}ms`)
  } catch (error) {
    console.log('❌ HTTPS Connectivity failed:', error.message)
  }
  
  // Test CORS
  try {
    await fetch('https://httpbin.org/headers', { method: 'GET' })
    console.log('✅ CORS: Working')
  } catch (error) {
    console.log('❌ CORS: Failed -', error.message)
  }
}

// Cloudinary Specific Diagnostics
window.diagnoseCloudinaryAccess = async () => {
  console.log('\n☁️ CLOUDINARY ACCESS DIAGNOSTICS')
  console.log('=' .repeat(50))
  
  const cloudName = 'dieaxy1hg'
  const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}`
  
  // Test different endpoints
  const endpoints = [
    { name: 'Base API', url: `${baseUrl}` },
    { name: 'Auto Upload', url: `${baseUrl}/auto/upload` },
    { name: 'Image Upload', url: `${baseUrl}/image/upload` },
    { name: 'Raw Upload', url: `${baseUrl}/raw/upload` }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🧪 Testing ${endpoint.name}...`)
      
      const start = performance.now()
      const response = await fetch(endpoint.url, { 
        method: 'HEAD',
        mode: 'cors'
      })
      const end = performance.now()
      
      console.log(`  ✅ ${endpoint.name}: ${response.status} (${(end - start).toFixed(2)}ms)`)
    } catch (error) {
      console.log(`  ❌ ${endpoint.name}: ${error.message}`)
    }
  }
}

// Browser Security Diagnostics
window.diagnoseBrowserSecurity = () => {
  console.log('\n🔒 BROWSER SECURITY DIAGNOSTICS')
  console.log('=' .repeat(50))
  
  // Check for mixed content
  if (window.location.protocol === 'https:') {
    console.log('✅ HTTPS: Secure context')
  } else {
    console.log('⚠️ HTTP: Mixed content issues possible')
  }
  
  // Check for service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        console.log('⚠️ Service Workers active:', registrations.length)
        registrations.forEach((reg, i) => {
          console.log(`  ${i + 1}. ${reg.scope}`)
        })
      } else {
        console.log('✅ No Service Workers interfering')
      }
    })
  }
  
  // Check for ad blockers (common cause of fetch failures)
  const testAd = document.createElement('div')
  testAd.innerHTML = '&nbsp;'
  testAd.className = 'adsbox'
  testAd.style.position = 'absolute'
  testAd.style.left = '-9999px'
  document.body.appendChild(testAd)
  
  setTimeout(() => {
    if (testAd.offsetHeight === 0) {
      console.log('⚠️ Ad Blocker detected (may interfere with requests)')
    } else {
      console.log('✅ No Ad Blocker interference detected')
    }
    document.body.removeChild(testAd)
  }, 100)
  
  // Check Content Security Policy
  const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
  if (metaTags.length > 0) {
    console.log('⚠️ CSP detected:', metaTags[0].content)
  } else {
    console.log('✅ No restrictive CSP found')
  }
}

// Fetch vs XHR Comparison
window.compareFetchVsXHR = async () => {
  console.log('\n🔄 FETCH vs XHR COMPARISON')
  console.log('=' .repeat(50))
  
  const testUrl = 'https://httpbin.org/post'
  const testData = new FormData()
  testData.append('test', 'data')
  
  // Test Fetch
  console.log('🧪 Testing Fetch...')
  try {
    const start = performance.now()
    const response = await fetch(testUrl, {
      method: 'POST',
      body: testData,
      mode: 'cors'
    })
    const end = performance.now()
    console.log(`✅ Fetch: ${response.status} (${(end - start).toFixed(2)}ms)`)
  } catch (error) {
    console.log('❌ Fetch failed:', error.message)
  }
  
  // Test XHR
  console.log('🧪 Testing XMLHttpRequest...')
  try {
    const start = performance.now()
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', testUrl, true)
      xhr.onload = () => {
        const end = performance.now()
        console.log(`✅ XHR: ${xhr.status} (${(end - start).toFixed(2)}ms)`)
        resolve(xhr.response)
      }
      xhr.onerror = () => {
        console.log('❌ XHR failed: Network error')
        reject(new Error('XHR Network error'))
      }
      xhr.send(testData)
    })
  } catch (error) {
    console.log('❌ XHR failed:', error.message)
  }
}

// Cloudinary Upload Test with Diagnostics
window.testCloudinaryUploadWithDiagnostics = () => {
  console.log('\n📁 CLOUDINARY UPLOAD TEST')
  console.log('=' .repeat(50))
  
  const input = document.createElement('input')
  input.type = 'file'
  input.style.position = 'fixed'
  input.style.top = '10px'
  input.style.left = '10px'
  input.style.zIndex = '9999'
  input.style.background = 'yellow'
  input.style.border = '3px solid red'
  input.style.padding = '10px'
  input.style.fontSize = '16px'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    console.log(`📁 Testing upload: ${file.name} (${file.size} bytes)`)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default')
    formData.append('folder', 'team-sync/diagnostic-test')
    
    const uploadUrl = 'https://api.cloudinary.com/v1_1/dieaxy1hg/auto/upload'
    
    // Test with Fetch
    console.log('🧪 Testing with Fetch...')
    try {
      const start = performance.now()
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit'
      })
      const end = performance.now()
      
      console.log(`📡 Fetch Response: ${response.status} (${(end - start).toFixed(2)}ms)`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Fetch Upload Success:', result.secure_url)
      } else {
        const text = await response.text()
        console.log('❌ Fetch Upload Failed:', text)
      }
    } catch (error) {
      console.log('❌ Fetch Upload Error:', error.message)
      
      // Try XHR fallback
      console.log('🔄 Trying XHR fallback...')
      try {
        const result = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', uploadUrl, true)
          xhr.onload = () => {
            if (xhr.status === 200) {
              const result = JSON.parse(xhr.responseText)
              console.log('✅ XHR Upload Success:', result.secure_url)
              resolve(result)
            } else {
              console.log('❌ XHR Upload Failed:', xhr.responseText)
              reject(new Error(xhr.responseText))
            }
          }
          xhr.onerror = () => {
            console.log('❌ XHR Network Error')
            reject(new Error('XHR Network error'))
          }
          xhr.send(formData)
        })
      } catch (xhrError) {
        console.log('❌ XHR also failed:', xhrError.message)
      }
    }
    
    document.body.removeChild(input)
  }
  
  document.body.appendChild(input)
  console.log('📁 File input added. Select a file to test upload.')
}

// Run All Diagnostics
window.runFullNetworkDiagnostics = async () => {
  console.clear()
  console.log('🚀 COMPREHENSIVE NETWORK DIAGNOSTICS')
  console.log('=' .repeat(60))
  
  await diagnoseNetworkEnvironment()
  await diagnoseCloudinaryAccess()
  diagnoseBrowserSecurity()
  await compareFetchVsXHR()
  
  console.log('\n🎯 SUMMARY & RECOMMENDATIONS')
  console.log('=' .repeat(50))
  console.log('1. Check all ❌ failed tests above')
  console.log('2. If DNS/HTTPS fails: Check network/proxy settings')
  console.log('3. If Cloudinary fails: Check firewall/antivirus')
  console.log('4. If Fetch fails but XHR works: Browser/extension issue')
  console.log('5. Run testCloudinaryUploadWithDiagnostics() to test actual upload')
  
  console.log('\n📋 NEXT STEPS:')
  console.log('• testCloudinaryUploadWithDiagnostics() - Test file upload')
  console.log('• Try different browser (Chrome/Firefox/Edge)')
  console.log('• Disable browser extensions temporarily')
  console.log('• Check network proxy/VPN settings')
}

// Auto-load message
console.log(`
🔧 NETWORK DIAGNOSTICS LOADED!

Available commands:
• runFullNetworkDiagnostics() - Complete diagnostic suite
• diagnoseNetworkEnvironment() - Check network setup
• diagnoseCloudinaryAccess() - Test Cloudinary endpoints
• diagnoseBrowserSecurity() - Check browser restrictions
• compareFetchVsXHR() - Compare request methods
• testCloudinaryUploadWithDiagnostics() - Test actual upload

Start with: runFullNetworkDiagnostics()
`)
