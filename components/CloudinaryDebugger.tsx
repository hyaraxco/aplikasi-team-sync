'use client'

import { useState } from 'react'

export default function CloudinaryDebugger() {
  const [logs, setLogs] = useState<string[]>([])
  const [isDebugging, setIsDebugging] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearLogs = () => setLogs([])

  // Test 1: Minimal request (exactly like working browser test)
  const testMinimalUpload = async () => {
    addLog('🧪 Testing minimal upload (like browser test)...')
    
    try {
      const formData = new FormData()
      formData.append('upload_preset', 'ml_default')
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/auto/upload', {
        method: 'POST',
        body: formData
      })
      
      addLog(`Response status: ${response.status}`)
      const text = await response.text()
      addLog(`Response: ${text.substring(0, 200)}...`)
      
      if (response.status === 400 && text.includes('Missing required parameter - file')) {
        addLog('✅ Minimal upload endpoint working!')
      } else {
        addLog('❌ Unexpected response')
      }
    } catch (error) {
      addLog(`❌ Minimal upload failed: ${error.message}`)
    }
  }

  // Test 2: With headers (current implementation)
  const testWithHeaders = async () => {
    addLog('🧪 Testing with headers...')
    
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
      
      addLog(`Response status: ${response.status}`)
      const text = await response.text()
      addLog(`Response: ${text.substring(0, 200)}...`)
    } catch (error) {
      addLog(`❌ Headers test failed: ${error.message}`)
    }
  }

  // Test 3: Resource type specific endpoint
  const testResourceEndpoint = async () => {
    addLog('🧪 Testing resource-specific endpoint...')
    
    try {
      const formData = new FormData()
      formData.append('upload_preset', 'ml_default')
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/raw/upload', {
        method: 'POST',
        body: formData
      })
      
      addLog(`Response status: ${response.status}`)
      const text = await response.text()
      addLog(`Response: ${text.substring(0, 200)}...`)
    } catch (error) {
      addLog(`❌ Resource endpoint test failed: ${error.message}`)
    }
  }

  // Test 4: With file upload
  const testFileUpload = async (file: File) => {
    addLog(`🧪 Testing actual file upload: ${file.name}`)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'ml_default')
      formData.append('folder', 'team-sync/debug-test')
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dieaxy1hg/auto/upload', {
        method: 'POST',
        body: formData
      })
      
      addLog(`Response status: ${response.status}`)
      
      if (response.ok) {
        const result = await response.json()
        addLog(`✅ Upload successful! URL: ${result.secure_url}`)
      } else {
        const text = await response.text()
        addLog(`❌ Upload failed: ${text}`)
      }
    } catch (error) {
      addLog(`❌ File upload failed: ${error.message}`)
    }
  }

  const runAllTests = async () => {
    setIsDebugging(true)
    clearLogs()
    
    addLog('🚀 Starting browser environment debugging...')
    addLog(`User Agent: ${navigator.userAgent}`)
    addLog(`Location: ${window.location.href}`)
    
    await testMinimalUpload()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testWithHeaders()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testResourceEndpoint()
    
    addLog('🏁 All tests completed!')
    setIsDebugging(false)
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-bold mb-4">Cloudinary Browser Debugger</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={runAllTests}
          disabled={isDebugging}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isDebugging ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear Logs
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test File Upload:</label>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) testFileUpload(file)
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Click "Run All Tests" to start debugging...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  )
}
