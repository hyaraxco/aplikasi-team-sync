import CloudinaryDebugger from '@/components/CloudinaryDebugger'
import React from 'react'

export default function CloudinaryDebugPage() {
  return React.createElement(
    'div',
    { className: 'container mx-auto p-8' },
    React.createElement(
      'h1',
      { className: 'text-2xl font-bold mb-6' },
      'Cloudinary Upload Debugging'
    ),
    React.createElement(CloudinaryDebugger)
  )
}
