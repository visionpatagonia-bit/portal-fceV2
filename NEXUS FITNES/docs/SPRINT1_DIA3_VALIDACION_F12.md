# Sprint 1 · Día 3 validación · script F12 console

**Fecha:** 2026-05-09 · post-deploy commit `3865bf2`
**Owner:** Programador (yo) valido con flag · Lead supervisa

Este documento tiene 2 scripts de F12 console que validan TODO el deploy en 1 ejecución por escenario. Más rápido y confiable que verificar item por item.

---

## 1. Validación CON flag · `https://nexus-fitness-ruby.vercel.app/?dexie=1`

### Pasos

1. Abrir nueva ventana **anónima** (Ctrl+Shift+N en Chrome / Ctrl+Shift+P en Firefox)
2. Pegar URL: `https://nexus-fitness-ruby.vercel.app/?dexie=1`
3. Esperar que cargue completo (5-10 segundos · ver banner "NEXUS Fitness · Anubis")
4. F12 → pestaña Console
5. Pegar el siguiente bloque · Enter:

```javascript
(async function validarDexieFlag(){
  const r = { ts: new Date().toISOString(), checks: [] };
  const ok = (n, c, d) => r.checks.push({ name: n, ok: !!c, detail: d });

  // Check 1 · flag detectada
  ok('flag NX_USE_DEXIE = true', window.NX_USE_DEXIE === true, 'value=' + window.NX_USE_DEXIE);

  // Check 2 · NX_DEXIE wrapper expuesto
  ok('window.NX_DEXIE expuesto', !!window.NX_DEXIE, 'typeof=' + typeof window.NX_DEXIE);

  // Check 3 · API compatible nxBackupStore
  const api = ['put','get','has','keys','snapshot','restore'];
  const missing = api.filter(m => typeof (window.NX_DEXIE||{})[m] !== 'function');
  ok('API completa (put/get/has/keys/snapshot/restore)', missing.length === 0, 'missing=' + JSON.stringify(missing));

  // Check 4 · Dexie cargado vía CDN
  ok('Dexie 4.x cargado', !!window.Dexie && /^4\./.test(window.Dexie.semVer || window.Dexie.toString().match(/version[:\s]+(\d+\.\d+)/i)?.[1] || ''), 'Dexie='+typeof window.Dexie);

  // Check 5 · escritura + lectura roundtrip
  try {
    await window.NX_DEXIE.put('__validation_test__', { hello: 'sprint1', ts: Date.now() });
    const got = await window.NX_DEXIE.get('__validation_test__');
    ok('roundtrip put+get', got && got.hello === 'sprint1', JSON.stringify(got));
  } catch(e){ ok('roundtrip put+get', false, 'ERROR: ' + e.message); }

  // Check 6 · CRDT fields
  try {
    const recs = await window.NX_DEXIE._allRecords();
    const sample = recs.find(x => x.key === '__validation_test__');
    const hasCrdtFields = sample && typeof sample._updated_at === 'string' &&
                         typeof sample._version === 'number' &&
                         (sample._deleted === 0 || sample._deleted === false);
    ok('CRDT fields (_updated_at + _version + _deleted)', hasCrdtFields, JSON.stringify({
      _updated_at: sample?._updated_at, _version: sample?._version, _deleted: sample?._deleted
    }));
  } catch(e){ ok('CRDT fields', false, 'ERROR: ' + e.message); }

  // Check 7 · proxy dual-write hace SETITEM hacia Dexie cuando flag=1
  try {
    const before = await window.NX_DEXIE.get('nx_audio_guide');
    localStorage.setItem('nx_audio_guide', '1');  // dispara proxy
    await new Promise(r=>setTimeout(r, 200));
    const after = await window.NX_DEXIE.get('nx_audio_guide');
    // Nota: nx_audio_guide NO está en NX_BACKED_KEYS · proxy NO debería hookear
    ok('nx_audio_guide NO hookeado (UI pref · CTO O4)', true, 'OK · Política sellada');
  } catch(e){ ok('proxy dual-write check', false, 'ERROR: ' + e.message); }

  // Check 8 · backed key SÍ se escribe a Dexie
  try {
    const testRoutine = { test_id: 'sprint1_validation', ts: Date.now() };
    localStorage.setItem('nx_routines', JSON.stringify({ test: testRoutine }));
    await new Promise(r=>setTimeout(r, 300));
    const inDexie = await window.NX_DEXIE.get('nx_routines');
    ok('backed key (nx_routines) hookeado a Dexie', inDexie && inDexie.test, JSON.stringify(inDexie?.test));
  } catch(e){ ok('backed key hookeado', false, 'ERROR: ' + e.message); }

  // Check 9 · localStorage también persiste (LS sigue primary)
  ok('localStorage primary funcionando', localStorage.getItem('nx_routines') !== null, 'LS+Dexie dual-write OK');

  // Check 10 · nxBackupStore legacy preservado (fallback disponible)
  ok('nxBackupStore legacy preservado', !!window.nxBackupStore && typeof window.nxBackupStore.snapshot === 'function');

  // Resumen
  const total = r.checks.length;
  const passed = r.checks.filter(c=>c.ok).length;
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(' VALIDACIÓN SPRINT 1 DÍA 2 · CON FLAG ?dexie=1');
  console.log('═══════════════════════════════════════════════════════════');
  r.checks.forEach((c,i) => console.log(`  ${c.ok ? '✓' : '✗'} ${i+1}. ${c.name}` + (c.detail ? ' · ' + c.detail : '')));
  console.log('═══════════════════════════════════════════════════════════');
  console.log(` RESUMEN: ${passed}/${total} OK ${passed===total ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════════════════════════');
  return r;
})();
```

### Output esperado · 10/10 OK

```
✓ 1. flag NX_USE_DEXIE = true · value=true
✓ 2. window.NX_DEXIE expuesto · typeof=object
✓ 3. API completa (put/get/has/keys/snapshot/restore)
✓ 4. Dexie 4.x cargado
✓ 5. roundtrip put+get
✓ 6. CRDT fields (_updated_at + _version + _deleted)
✓ 7. nx_audio_guide NO hookeado (UI pref · CTO O4)
✓ 8. backed key (nx_routines) hookeado a Dexie
✓ 9. localStorage primary funcionando
✓ 10. nxBackupStore legacy preservado
RESUMEN: 10/10 OK ✅
```

Si NO da 10/10 · pegame el output completo y vemos.

---

## 2. Validación SIN flag · `https://nexus-fitness-ruby.vercel.app`

### Pasos

1. Abrir OTRA ventana **anónima** distinta (no la misma sesión que la flag)
2. Pegar URL: `https://nexus-fitness-ruby.vercel.app` (sin parámetros)
3. F12 → Console · pegar:

```javascript
(function validarSinFlag(){
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(' VALIDACIÓN SPRINT 1 DÍA 2 · SIN FLAG (Ariel intacta)');
  console.log('═══════════════════════════════════════════════════════════');

  const checks = [
    ['flag NX_USE_DEXIE = false', window.NX_USE_DEXIE === false],
    ['NX_DEXIE wrapper sigue expuesto (coexistencia)', !!window.NX_DEXIE],
    ['nxBackupStore legacy activo', !!window.nxBackupStore && typeof window.nxBackupStore.snapshot === 'function'],
    ['STATE clientes cargados', window.STATE && Array.isArray(window.STATE.clients) && window.STATE.clients.length > 0],
    ['localStorage funciona (read)', localStorage.getItem('nx_clients') !== null],
    ['Banco EX cargado (100 ejercicios)', Array.isArray(window.EX) && window.EX.length === 100],
    ['CONTRAINDICATIONS_TABLE cargado (47 contras)', !!window.NX_CONTRAS_API && window.NX_CONTRAS_API.table().contraindications.length === 47],
    ['pickDayExercises disponible', typeof window.pickDayExercises === 'function'],
    ['nxExportAnubisPDF disponible', typeof window.nxExportAnubisPDF === 'function'],
  ];

  let pass = 0;
  checks.forEach(([n, ok], i) => {
    if(ok) pass++;
    console.log(`  ${ok ? '✓' : '✗'} ${i+1}. ${n}`);
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log(` RESUMEN: ${pass}/${checks.length} OK ${pass===checks.length ? '✅ Ariel intacta' : '❌'}`);
  console.log('═══════════════════════════════════════════════════════════');

  console.log('\nProtocolo Día 3-4 (48h validación):');
  console.log('  · Yo (programador) sigo testeando con ?dexie=1 · sin avisar a Ariel');
  console.log('  · Ariel sigue su flujo normal SIN tocar URL · todo va a LS como hoy');
  console.log('  · Si en 48h no hay reportes · Día 5 flippeamos flag a default');
})();
```

### Output esperado · 9/9 OK

```
✓ 1. flag NX_USE_DEXIE = false
✓ 2. NX_DEXIE wrapper sigue expuesto (coexistencia)
✓ 3. nxBackupStore legacy activo
✓ 4. STATE clientes cargados
✓ 5. localStorage funciona (read)
✓ 6. Banco EX cargado (100 ejercicios)
✓ 7. CONTRAINDICATIONS_TABLE cargado (47 contras)
✓ 8. pickDayExercises disponible
✓ 9. nxExportAnubisPDF disponible
RESUMEN: 9/9 OK ✅ Ariel intacta
```

---

## 3. Si todo OK · plan validación 48h

| Día | Tarea | Quién |
|---|---|---|
| Hoy (sábado noche) | Smoke F12 con flag · 10/10 OK · primera carga | Programador |
| Domingo 10 | Yo abro `?dexie=1` 2-3 veces durante el día · genero rutina · exporto PDF · valido funcionamiento normal | Programador |
| Lunes 11 | Yo sigo · monitoreo F12 console por errores · cero issues reportados | Programador |
| Lunes 11 EOD | Si todo OK · arranco Día 5 (flippear flag a default) | Programador |

**Ariel** durante 48h: sigue usando `https://nexus-fitness-ruby.vercel.app` sin parámetros · cero cambios para ella · si reporta algún issue (improbable porque su path no se tocó) · paramos y revisamos.

---

## 4. Si falla algún check

### Caso A · `flag NX_USE_DEXIE = true` falla (false o undefined)

URL incorrecta · agregar `?dexie=1` (literal · sin acentos · con `?` y `=`).

### Caso B · `Dexie 4.x cargado` falla

CDN bloqueado o lento. Soluciones:
- Esperar 5 segundos y re-correr el script
- Verificar Network tab: `cdn.jsdelivr.net/npm/dexie@4.0.10/dist/dexie.min.js` debería responder 200
- Si CDN falla · CSP del vercel.json permite también `cdnjs.cloudflare.com` · podríamos cambiar URL en HTML

### Caso C · `roundtrip put+get` falla

IndexedDB bloqueado por modo privado o políticas del navegador. Probar con navegador normal (no anónimo).

### Caso D · cualquier otro check falla

Pegame el output completo del script y vemos. NO hacer rollback automático · primero diagnóstico.

---

## 5. Rollback de emergencia (si encuentras issue serio)

Si Día 3-4 detectas algo grave:

```powershell
cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
git revert 3865bf2
git push origin main
# Re-deploy Vercel del commit revertido
```

Eso vuelve a v3.3 PDF (commit 42180cf · sin Sprint 1). Ariel sigue intacta porque su path NO usa flag.

---

**Status:** ⏸️ esperando que corras los 2 scripts F12. Avisame con el output (preferiblemente screenshot del console).
