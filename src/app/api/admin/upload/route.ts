import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email !== adminEmail) return null
  return user
}

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BUCKET = 'media'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

// POST — upload file to Supabase Storage
export async function POST(request: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']
  if (!allowed.includes(ext)) {
    return NextResponse.json(
      { error: `File type .${ext} not allowed` },
      { status: 415 }
    )
  }

  // Generate unique path: media/YYYY/MM/filename
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const safeName = file.name
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
  const path = `${year}/${month}/${Date.now()}-${safeName}`

  const supabase = getServiceClient()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    // If bucket doesn't exist, try to create it
    if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
      await supabase.storage.createBucket(BUCKET, { public: true })
      const { error: retry } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false })
      if (retry) {
        return NextResponse.json({ error: retry.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path })
}

// GET — list files in storage
export async function GET(request: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = request.nextUrl.searchParams.get('folder') || ''
  const supabase = getServiceClient()

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    // Bucket may not exist yet
    if (error.message?.includes('not found')) {
      return NextResponse.json({ files: [], folders: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const files = (data ?? []).filter((f) => f.name && !f.name.endsWith('/'))
  const folders = (data ?? []).filter(
    (f) => f.id === null && f.name && f.name !== '.emptyFolderPlaceholder'
  )

  // Build public URLs
  const filesWithUrl = files.map((f) => {
    const fullPath = folder ? `${folder}/${f.name}` : f.name
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(fullPath)
    return { ...f, url: publicUrl, path: fullPath }
  })

  return NextResponse.json({ files: filesWithUrl, folders })
}

// DELETE — remove file
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = request.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
