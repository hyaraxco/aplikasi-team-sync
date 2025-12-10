'use client'

import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  GanttChart,
} from 'lucide-react'

// Mapping of file extensions to icons and colors
const fileTypeConfig = {
  // Images
  jpg: { icon: FileImage, color: 'text-rose-500' },
  jpeg: { icon: FileImage, color: 'text-rose-500' },
  png: { icon: FileImage, color: 'text-rose-500' },
  gif: { icon: FileImage, color: 'text-rose-500' },
  svg: { icon: FileImage, color: 'text-rose-500' },

  // Documents
  pdf: { icon: FileText, color: 'text-red-600' },
  doc: { icon: FileText, color: 'text-blue-600' },
  docx: { icon: FileText, color: 'text-blue-600' },
  txt: { icon: FileText, color: 'text-gray-500' },
  rtf: { icon: FileText, color: 'text-gray-600' },

  // Spreadsheets
  xls: { icon: GanttChart, color: 'text-green-600' },
  xlsx: { icon: GanttChart, color: 'text-green-600' },
  csv: { icon: GanttChart, color: 'text-green-600' },

  // Audio/Video
  mp3: { icon: FileAudio, color: 'text-orange-500' },
  wav: { icon: FileAudio, color: 'text-orange-500' },
  mp4: { icon: FileVideo, color: 'text-purple-500' },
  mov: { icon: FileVideo, color: 'text-purple-500' },
  avi: { icon: FileVideo, color: 'text-purple-500' },

  // Archives
  zip: { icon: FileArchive, color: 'text-yellow-600' },
  rar: { icon: FileArchive, color: 'text-yellow-600' },
  '7z': { icon: FileArchive, color: 'text-yellow-600' },

  // Code
  js: { icon: FileCode, color: 'text-amber-500' },
  jsx: { icon: FileCode, color: 'text-amber-500' },
  ts: { icon: FileCode, color: 'text-blue-500' },
  tsx: { icon: FileCode, color: 'text-blue-500' },
  html: { icon: FileCode, color: 'text-orange-600' },
  css: { icon: FileCode, color: 'text-blue-400' },
  json: { icon: FileCode, color: 'text-green-500' },
  md: { icon: FileText, color: 'text-gray-600' },
  py: { icon: FileCode, color: 'text-yellow-500' },

  // Default
  default: { icon: File, color: 'text-gray-500' },
}

export const FileIcon = ({
  filename,
  className = 'w-6 h-6',
}: {
  filename: string
  className?: string
}) => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'default'
  const config = fileTypeConfig[extension as keyof typeof fileTypeConfig] || fileTypeConfig.default
  const IconComponent = config.icon

  return <IconComponent className={`${className} ${config.color}`} />
}
