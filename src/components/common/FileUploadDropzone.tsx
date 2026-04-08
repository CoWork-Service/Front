import React, { useRef, useState } from 'react'
import { UploadCloud, File } from 'lucide-react'

interface FileUploadDropzoneProps {
  onFiles?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
}

export function FileUploadDropzone({
  onFiles,
  accept,
  multiple = false,
  label = '파일을 드래그하거나 클릭하여 업로드',
  hint,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    setUploadedFiles(arr)
    onFiles?.(arr)
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud size={32} className="text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {uploadedFiles.length > 0 && (
        <div className="space-y-1">
          {uploadedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              <File size={14} className="text-slate-400" />
              <span>{f.name}</span>
              <span className="text-xs text-slate-400 ml-auto">
                {(f.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
