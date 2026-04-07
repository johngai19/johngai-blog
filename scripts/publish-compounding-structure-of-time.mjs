import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repo = resolve(__dirname, '..')
const envText = readFileSync(resolve(repo, '.env.local'), 'utf-8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}
const payload = JSON.parse(readFileSync('/Users/weizy0219/.openclaw/workspace/compounding-structure-of-time-article.json', 'utf-8'))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const now = new Date().toISOString()
payload.published_at = now
payload.updated_at = now
payload.reading_time_min = 6
const { data: existing } = await supabase.from('articles').select('id').eq('slug', payload.slug).single()
let result
if (existing?.id) {
  result = await supabase.from('articles').update(payload).eq('id', existing.id).select('id,slug,status,published_at').single()
} else {
  payload.created_at = now
  payload.view_count = 0
  result = await supabase.from('articles').insert(payload).select('id,slug,status,published_at').single()
}
if (result.error) {
  console.error(JSON.stringify(result.error, null, 2))
  process.exit(1)
}
console.log(JSON.stringify(result.data, null, 2))
