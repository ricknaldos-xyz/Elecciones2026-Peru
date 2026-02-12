async function testAPI() {
  const jneId = '248623'
  const url = `https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=${jneId}`
  console.log(`Testing: ${url}\n`)
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  console.log(`Status: ${response.status}`)
  const data = await response.json()
  console.log(`Top-level keys: ${Object.keys(data).join(', ')}`)
  console.log('\n=== FULL RESPONSE ===')
  console.log(JSON.stringify(data, null, 2).substring(0, 10000))

  console.log('\n\n=== TEST 2: Candidate 248140 ===')
  const r2 = await fetch(`https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=248140`, {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  console.log(JSON.stringify(await r2.json(), null, 2).substring(0, 10000))

  console.log('\n\n=== TEST 3: HVConsolidado ===')
  try {
    const r3 = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/HVConsolidado', {
      method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' },
      body: JSON.stringify({ idHojaVida: 248623 })
    })
    console.log(`Status: ${r3.status}`)
    console.log(JSON.stringify(await r3.json(), null, 2).substring(0, 5000))
  } catch (err) { console.log(`Error: ${(err as Error).message}`) }
}
testAPI().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
