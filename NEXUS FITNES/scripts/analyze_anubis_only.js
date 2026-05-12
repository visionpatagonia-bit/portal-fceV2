// =====================================================================
// analyze_anubis_only.js · 2026-05-12 noche
// RE-DO con ÚNICAMENTE rutinas Anubis auténticas (excluye corpus Cejas)
// Fuentes válidas: clientes/anubis/rutinas/*.json
//   - Rutina_Pablo (M 32a post-op LCA · hipertrofia · 4d)
//   - Rutina_Rocio (mujer · Anubis 5+1d)
//   - Rutina_Definicion_avanzada
//   - Rutina_Martin_Rojo
// =====================================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'clientes', 'anubis', 'rutinas');
const files = ['Rutina_Pablo.json', 'Rutina_Rocio.json', 'Rutina_Definicion_avanzada.json', 'Rutina_Martin_Rojo.json'];

function classify(name){
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if(/\bcurl\b|biceps|martillo|predicador|scott\b|concentrad|alterna|hammer/.test(n)) return 'biceps';
  if(/triceps|frances|skull|extension.*triceps|patada.*tri\b|jalon.*triceps|push.?down|tate|copa/.test(n)) return 'triceps';
  if(/^fondos\b|fondos.*banco|fondos.*paralela|fondos.*maquina/.test(n)) return 'triceps';
  if(/gluteo|hip thrust|abducc|adducc|aductor|sumo|patada.*gluteo|kickback.*gl/.test(n)) return 'gluteos';
  if(/cuadr|sentadilla|prensa|sillon|hack|estocada|bulgar|extension.*pierna|step.?up|leg press|leg ext/.test(n)) return 'cuadriceps';
  if(/femoral|isquio|peso muerto|rumano|rdl|stiff|hamstring/.test(n)) return 'isquios';
  if(/gemelos|pantorr|talones|calf/.test(n)) return 'pantorrillas';
  if(/pecho|press.*plano|press.*inclinad|press.*declin|aperturas|peck.?deck|pectoral|fly|flexion|push.?up|cruce.*polea/.test(n)) return 'pecho';
  if(/espalda|jalon|jalones|remo|dominad|pullover|hiperexten|pull.?up|rowing|t.bar|trapecio|encogimientos.*hombr/.test(n)) return 'espalda';
  if(/hombro|press.*militar|arnold|vuelos|laterales|posteriores|deltoides|side raise|rear delt|pajaros|encogimientos\b|shrug/.test(n)) return 'hombros';
  if(/abdomen|abdominal|crunch|plancha|russian|ruso|dead.?bug|ab.?wheel|rueda|elevacion.*piernas|leg raise|sit.?up|hipopres/.test(n)) return 'core';
  if(/bici|eliptica|cinta|caminat|trote|running|treadmill|jogging|rope.*jump/.test(n)) return 'cardio';
  if(/estiramiento|movilidad|stretch|foam.?roller|elongac|relajaci/.test(n)) return 'movilidad';
  return 'otro';
}

console.log('=== ANUBIS-AUTÉNTICAS · 4 rutinas Ariel real ===\n');

let stats = { total_dias: 0, dias_con_brazos: 0, dias_mixto: 0, dias_solo_bi: 0, dias_solo_tri: 0 };
const pairings = { pecho_bi_solo: 0, pecho_tri_solo: 0, pecho_mixto: 0,
                   espalda_bi_solo: 0, espalda_tri_solo: 0, espalda_mixto: 0,
                   hombro_bi_solo: 0, hombro_tri_solo: 0, hombro_mixto: 0,
                   brazos_puro_mixto: 0, brazos_puro_solo_bi: 0, brazos_puro_solo_tri: 0 };
const ratios_mixto = []; // [{bi, tri, day, file}]

files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const clientName = (data.client && data.client.name) || f.replace('.json','');
  console.log(`── ${clientName} (${f})`);
  // El JSON Anubis tiene shape: { routines: [ { day_label, foco, exercises: [...] }, ... ] }
  let dayList = Array.isArray(data.routines) ? data.routines : [];
  if(!dayList.length){
    Object.keys(data).forEach(k => {
      if(Array.isArray(data[k]) && data[k].length && (data[k][0].exercises || data[k][0].day_label)){
        dayList = data[k];
      }
    });
  }
  if(!dayList.length){
    console.log(`   ⚠ No pude extraer días · keys: ${Object.keys(data).join(', ')}`);
    return;
  }
  dayList.forEach(d => {
    stats.total_dias++;
    const exes = d.exercises || d.ej || d.lifts || [];
    const counts = { biceps: 0, triceps: 0, pecho: 0, espalda: 0, hombros: 0, pierna: 0, core: 0, cardio: 0 };
    exes.forEach(ex => {
      const name = ex.display_name || ex.bank_name || ex.name || ex.nombre || ex.title || '';
      const cls = classify(name);
      if(cls === 'biceps') counts.biceps++;
      else if(cls === 'triceps') counts.triceps++;
      else if(cls === 'pecho') counts.pecho++;
      else if(cls === 'espalda') counts.espalda++;
      else if(cls === 'hombros') counts.hombros++;
      else if(['cuadriceps','isquios','gluteos','pantorrillas'].includes(cls)) counts.pierna++;
      else if(cls === 'core') counts.core++;
      else if(cls === 'cardio') counts.cardio++;
    });
    const tags = [];
    Object.entries(counts).forEach(([k,v]) => { if(v) tags.push(`${k}:${v}`); });
    const label = d.day_label || d.label || d.day || d.title || d.focus || '?';
    console.log(`  ${label} → ${tags.join(' · ')}`);

    const tieneBi = counts.biceps > 0;
    const tieneTri = counts.triceps > 0;
    if(tieneBi || tieneTri){
      stats.dias_con_brazos++;
      if(tieneBi && tieneTri){
        stats.dias_mixto++;
        ratios_mixto.push({bi: counts.biceps, tri: counts.triceps, day: label, file: clientName});
      }
      else if(tieneBi) stats.dias_solo_bi++;
      else if(tieneTri) stats.dias_solo_tri++;
    }
    // Pairings con grupos grandes
    const tienePecho = counts.pecho > 0;
    const tieneEspalda = counts.espalda > 0;
    const tieneHombros = counts.hombros > 0;
    const tienePierna = counts.pierna > 0;
    const grupoGrande = tienePecho || tieneEspalda || tieneHombros || tienePierna;

    if(tienePecho){
      if(tieneBi && tieneTri) pairings.pecho_mixto++;
      else if(tieneBi) pairings.pecho_bi_solo++;
      else if(tieneTri) pairings.pecho_tri_solo++;
    }
    if(tieneEspalda){
      if(tieneBi && tieneTri) pairings.espalda_mixto++;
      else if(tieneBi) pairings.espalda_bi_solo++;
      else if(tieneTri) pairings.espalda_tri_solo++;
    }
    if(tieneHombros){
      if(tieneBi && tieneTri) pairings.hombro_mixto++;
      else if(tieneBi) pairings.hombro_bi_solo++;
      else if(tieneTri) pairings.hombro_tri_solo++;
    }
    if(!grupoGrande && (tieneBi || tieneTri)){
      if(tieneBi && tieneTri) pairings.brazos_puro_mixto++;
      else if(tieneBi) pairings.brazos_puro_solo_bi++;
      else pairings.brazos_puro_solo_tri++;
    }
  });
  console.log('');
});

console.log('=== EVIDENCIA EMPÍRICA · SOLO Anubis-Ariel ===');
console.log(`Total días analizados: ${stats.total_dias}`);
console.log(`Días con bíceps o tríceps: ${stats.dias_con_brazos}`);
console.log('');
console.log('Distribución brazos:');
console.log(`  Mixto BI+TRI:  ${stats.dias_mixto}`);
console.log(`  Solo bíceps:   ${stats.dias_solo_bi}`);
console.log(`  Solo tríceps:  ${stats.dias_solo_tri}`);
console.log('');
console.log('Pairings con grupos grandes:');
Object.entries(pairings).forEach(([k,v]) => { if(v) console.log(`  ${k}: ${v}`); });
console.log('');
if(ratios_mixto.length){
  console.log('Ratios dentro de días mixtos:');
  let sumBi = 0, sumTri = 0;
  ratios_mixto.forEach(r => {
    console.log(`  ${r.file} · ${r.day} → ${r.bi}bi : ${r.tri}tri`);
    sumBi += r.bi; sumTri += r.tri;
  });
  console.log(`  PROMEDIO ponderado: ${sumBi}bi : ${sumTri}tri  (ratio ${(sumBi/Math.max(sumTri,1)).toFixed(2)})`);
}
