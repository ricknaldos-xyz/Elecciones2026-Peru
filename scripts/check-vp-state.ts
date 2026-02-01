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
  const vps = await sql`
    SELECT c.full_name, c.is_active, c.list_position, c.party_id, c.photo_url,
           p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'vicepresidente'
    ORDER BY p.name, c.list_position, c.full_name
  `
  console.log('Total VPs:', vps.length)
  console.log('Active VPs:', vps.filter(v => v.is_active).length)
  console.log('Inactive VPs:', vps.filter(v => !v.is_active).length)

  const byParty: Record<string, any[]> = {}
  for (const v of vps) {
    const key = (v.party_name as string) || 'UNKNOWN'
    if (!byParty[key]) byParty[key] = []
    byParty[key].push({
      name: v.full_name,
      active: v.is_active,
      pos: v.list_position,
      photo: !!v.photo_url
    })
  }

  console.log('\nVPs by party:')
  for (const [party, vpList] of Object.entries(byParty).sort()) {
    console.log('  ' + party + ':')
    for (const vp of vpList) {
      const status = vp.active ? '[ACTIVE]' : '[INACTIVE]'
      console.log(`    ${status} pos:${vp.pos} ${vp.name}${vp.photo ? '' : ' NO_PHOTO'}`)
    }
  }

  // Check which active presidents have active VPs
  const presWithVps = await sql`
    SELECT p_cand.full_name as president,
           COUNT(vp_cand.id) as vp_count
    FROM candidates p_cand
    LEFT JOIN candidates vp_cand ON vp_cand.party_id = p_cand.party_id
      AND vp_cand.cargo = 'vicepresidente' AND vp_cand.is_active = true
    WHERE p_cand.cargo = 'presidente' AND p_cand.is_active = true
    GROUP BY p_cand.full_name
    ORDER BY vp_count, p_cand.full_name
  `

  const noVps = presWithVps.filter(p => Number(p.vp_count) === 0)
  const withVps = presWithVps.filter(p => Number(p.vp_count) > 0)

  console.log('\n--- ACTIVE PRESIDENTS WITHOUT ACTIVE VPs:', noVps.length, '---')
  noVps.forEach(p => console.log('  ' + p.president))

  console.log('\n--- ACTIVE PRESIDENTS WITH ACTIVE VPs:', withVps.length, '---')
  withVps.forEach(p => console.log('  ' + p.president + ': ' + p.vp_count + ' VPs'))
}

main().catch(console.error)
