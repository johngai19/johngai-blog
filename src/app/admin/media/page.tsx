'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Copy, Check, FolderOpen, ArrowLeft, Image as ImageIcon } from 'lucide-react'

interface MediaFile {
  name: string
  url: string
  path: string
  created_at: string
  metadata?: { size?: number; mimetype?: string }
}

interface MediaFolder {
  name: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = async (folder = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/upload?folder=${encodeURIComponent(folder)}`)
      const data = await res.json()
      setFiles(data.files ?? [])
      setFolders(data.folders ?? [])
    } catch {
      setFiles([])
      setFolders([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadFiles(currentFolder)
  }, [currentFolder])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setUploading(true)

    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append('file', file)
      await fetch('/api/admin/upload', { method: 'POST', body: formData })
    }

    setUploading(false)
    loadFiles(currentFolder)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const deleteFile = async (path: string) => {
    if (!confirm('确定删除这个文件？')) return
    await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
    loadFiles(currentFolder)
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const navigateUp = () => {
    const parts = currentFolder.split('/')
    parts.pop()
    setCurrentFolder(parts.join('/'))
  }

  const isImage = (name: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(name)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
            媒体库
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {currentFolder || '根目录'} · {files.length} 个文件
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#D4830A' }}
          >
            <Upload size={14} />
            {uploading ? '上传中…' : '上传图片'}
          </button>
        </div>
      </div>

      {/* Breadcrumb / navigation */}
      {currentFolder && (
        <button
          onClick={navigateUp}
          className="flex items-center gap-1 text-sm"
          style={{ color: '#D4830A' }}
        >
          <ArrowLeft size={14} />
          返回上级
        </button>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {folders.map((f) => (
            <button
              key={f.name}
              onClick={() =>
                setCurrentFolder(
                  currentFolder ? `${currentFolder}/${f.name}` : f.name
                )
              }
              className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E3DF' }}
            >
              <FolderOpen size={16} style={{ color: '#D4830A' }} />
              <span className="text-sm" style={{ color: '#1A1A1A' }}>
                {f.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Files grid */}
      {loading ? (
        <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>
          加载中…
        </div>
      ) : files.length === 0 && folders.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl border"
          style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
        >
          <ImageIcon
            size={32}
            style={{ color: '#D1D5DB' }}
            className="mx-auto mb-3"
          />
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            暂无文件，点击上传按钮添加图片
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {files.map((file) => (
            <div
              key={file.path}
              className="group rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
              style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
            >
              {/* Image preview */}
              <div
                className="aspect-square flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                {isImage(file.name) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ImageIcon size={24} style={{ color: '#D1D5DB' }} />
                )}
              </div>

              {/* Info + actions */}
              <div className="p-2">
                <p
                  className="text-xs truncate"
                  style={{ color: '#1A1A1A' }}
                  title={file.name}
                >
                  {file.name}
                </p>
                <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyUrl(file.url)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
                    style={{ color: '#6B7280' }}
                    title="复制链接"
                  >
                    {copied === file.url ? (
                      <Check size={11} style={{ color: '#16A34A' }} />
                    ) : (
                      <Copy size={11} />
                    )}
                    {copied === file.url ? '已复制' : '复制'}
                  </button>
                  <button
                    onClick={() => deleteFile(file.path)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
                    style={{ color: '#EF4444' }}
                    title="删除"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
