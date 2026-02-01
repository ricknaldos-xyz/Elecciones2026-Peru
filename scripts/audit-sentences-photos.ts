import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return { db: dbMatch![1] }
}

const sql = neon(loadEnv().db)

async function main() {
  console.log('=== SENTENCES & PHOTOS AUDIT ===')
  console.log('')
  
  // 1. Sentence data
  const candidates = await sql`
    SELECT full_name, penal_sentences, civil_sentences, photo_url
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    ORDER BY full_name
  `
  
  console.log('SENTENCE DATA:')
  let withSentences = 0
  for (const c of candidates) {
    const penal = (c.penal_sentences as any[]) || []
    const civil = (c.civil_sentences as any[]) || []
    const count = penal.length + civil.length
    
    if (count > 0) {
      withSentences++
      console.log('  ' + c.full_name + ': ' + count + ' sentences (penal:' + penal.length + ' civil:' + civil.length + ')')
    }
  }
  console.log('  Candidates with sentences: ' + withSentences + '/' + candidates.length)
  
  // 2. Photo URLs
  console.log('')
  console.log('')
  console.log('PHOTO URLS:')
  let withPhotos = 0
  let noPhotos: string[] = []
  let brokenUrls: string[] = []
  
  for (const c of candidates) {
    if (!c.photo_url) {
      noPhotos.push(c.full_name)
      continue
    }
    
    const url = c.photo_url as string
    if (!url.startsWith('http')) {
      brokenUrls.push(c.full_name + ': ' + url)
      continue
    }
    
    withPhotos++
  }
  
  console.log('  With photos: ' + withPhotos + '/' + candidates.length)
  if (noPhotos.length > 0) {
    console.log('  NO PHOTO:')
    noPhotos.forEach(n => console.log('    - ' + n))
  }
  if (brokenUrls.length > 0) {
    console.log('  BROKEN URLS:')
    brokenUrls.forEach(b => console.log('    - ' + b))
  }
  
  // 3. Sentence details
  console.log('')
  console.log('')
  console.log('ALL SENTENCE DETAILS:')
  for (const c of candidates) {
    const penal = (c.penal_sentences as any[]) || []
    const civil = (c.civil_sentences as any[]) || []
    for (const s of penal) {
      console.log('  ' + c.full_name + ' | PENAL | ' + (s.type || 'N/A') + ' | ' + (s.status || 'N/A'))
    }
    for (const s of civil) {
      console.log('  ' + c.full_name + ' | CIVIL | ' + (s.type || s.materia || 'N/A') + ' | ' + (s.status || s.fallo || 'N/A'))
    }
  }
  
  // 4. Check inactive candidates
  const inactive = await sql`
    SELECT c.full_name, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = false
    ORDER BY c.full_name
  `
  if (inactive.length > 0) {
    console.log('')
    console.log('')
    console.log('INACTIVE PRESIDENTIAL CANDIDATES:')
    inactive.forEach(c => console.log('  ' + c.full_name + ' (' + c.party_name + ')'))
  }
}

main().catch(console.error)
