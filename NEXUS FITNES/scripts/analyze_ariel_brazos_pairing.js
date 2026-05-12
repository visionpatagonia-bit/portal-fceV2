// =====================================================================
// analyze_ariel_brazos_pairing.js · 2026-05-12 noche
// Análisis empírico: ¿Cómo combina Ariel "Brazos" en sus rutinas históricas?
// Para cada día de cada rutina, identificar:
//   - Grupos predominantes (pecho/espalda/hombro/pierna/etc.)
//   - Cuántos ejercicios son bíceps vs tríceps
//   - Si el día tiene bi y tri mezclados, o solo uno (push/pull antagonist)
// =====================================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'clientes', 'anubis', 'rutinas_ariel');
const rutinas = JSON.parse(fs.readFileSync(path.join(ROOT, 'rutinas_normalized.json'), 'utf8'));

// Heurística de clasificación por nombre (sustantivo principal del ejercicio)
function classify(name){
  // Normalizar tildes para que "Tríceps" matchee /triceps/
  const n = name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  // BICEPS
  if(/\bcurl\b|biceps|martillo|predicador|scott\b|concentrad|alterna|hammer/.test(n)) return 'biceps';
  // TRICEPS
  if(/triceps|francés|frances|skull|extensi[oó]n.*tr[ií]ceps|patada.*tr[ií]|fondos.*banco|fondos.*paralela|polea.*cuerda.*tr|jal[oó]n.*tr|push.*down|tate|copa/.test(n)) return 'triceps';
  // Special: "fondos" alone → triceps
  if(/^fondos\b/.test(n)) return 'triceps';
  // GLUTE (importante para distinguir patadas de glúteo vs tríceps)
  if(/gl[uú]teo|hip thrust|abducc|aduccion|aductor|sumo|patada.*gl[uú]teo|kickback.*gl/.test(n)) return 'gluteos';
  // CUAD
  if(/cu[aá]dr|sentadilla|prensa|sill[oó]n|hack|estocada|bulgar|extensi[oó]n.*pierna|step.?up|leg press|leg ext/.test(n)) return 'cuadriceps';
  // ISQUIO
  if(/femoral|isquio|peso muerto|rumano|rdl|stiff|hamstring/.test(n)) return 'isquios';
  // PANTORRILLA
  if(/gemelos|pantorr|talones|calf/.test(n)) return 'pantorrillas';
  // PECHO
  if(/pecho|press.*plano|press.*inclinad|press.*declin|aperturas|peck.?deck|pectoral|fly|flexion|push.?up|cruce.*polea/.test(n)) return 'pecho';
  // ESPALDA
  if(/espalda|jal[oó]n|jalones|remo|dominad|pullover|hiperexten|pull.?up|rowing|t.bar|lat\b|trapecio|encogimientos.*hombr/.test(n)) return 'espalda';
  // HOMBROS
  if(/hombro|press.*militar|arnold|vuelos|laterales|posteriores|deltoides|side raise|rear delt|p[aá]jaros|encogimientos\b|shrug/.test(n)) return 'hombros';
  // CORE
  if(/abdomen|abdominal|crunch|plancha|russian|ruso|dead.?bug|ab.?wheel|rueda|elevaci[oó]n.*piernas|leg raise|sit.?up|hipopres/.test(n)) return 'core';
  // CARDIO
  if(/bici|elíptica|eliptica|cinta|caminat|trote|running|treadmill|jogging|rope.*jump/.test(n)) return 'cardio';
  // STRETCH/MOBILITY
  if(/estiramiento|movilidad|stretch|foam.?roller|elongac|relajaci/.test(n)) return 'movilidad';
  return 'otro';
}

// Para cada rutina · para cada día · clasificar ejercicios
console.log('=== ANÁLISIS BRAZOS PAIRING · 8 rutinas Ariel ===\n');

let stats = {
  total_dias: 0,
  dias_con_brazos: 0,        // día con ≥1 bi o ≥1 tri
  dias_brazos_mixto: 0,      // día con bi Y tri
  dias_brazos_solo_bi: 0,    // día con bi pero 0 tri
  dias_brazos_solo_tri: 0,   // día con tri pero 0 bi
  dias_pecho_tri: 0,
  dias_pecho_bi: 0,
  dias_espalda_bi: 0,
  dias_espalda_tri: 0,
  dias_hombro_tri: 0,
  dias_hombro_bi: 0,
  dias_pierna_bi: 0,
  dias_pierna_tri: 0,
  dias_brazos_puro: 0,       // día sin pecho/espalda/hombro/pierna · solo brazos
};

rutinas.forEach(r => {
  console.log(`\n── ${r.client_label || r.title} (${r.file})`);
  r.days.forEach(d => {
    stats.total_dias++;
    const counts = { biceps: 0, triceps: 0, pecho: 0, espalda: 0, hombros: 0, cuadriceps: 0, isquios: 0, gluteos: 0, pantorrillas: 0, core: 0, cardio: 0, movilidad: 0, otro: 0 };
    d.exercises.forEach(ex => {
      const cls = classify(ex.name);
      counts[cls]++;
    });
    const tieneBi = counts.biceps > 0;
    const tieneTri = counts.triceps > 0;
    const tienePecho = counts.pecho > 0;
    const tieneEspalda = counts.espalda > 0;
    const tieneHombros = counts.hombros > 0;
    const tienePierna = counts.cuadriceps + counts.isquios + counts.gluteos > 0;

    const tags = [];
    if(tienePecho) tags.push(`pecho:${counts.pecho}`);
    if(tieneEspalda) tags.push(`espalda:${counts.espalda}`);
    if(tieneHombros) tags.push(`hombros:${counts.hombros}`);
    if(tienePierna) tags.push(`pierna:${counts.cuadriceps + counts.isquios + counts.gluteos}`);
    if(tieneBi) tags.push(`BI:${counts.biceps}`);
    if(tieneTri) tags.push(`TRI:${counts.triceps}`);
    if(counts.core) tags.push(`core:${counts.core}`);
    if(counts.cardio) tags.push(`cardio:${counts.cardio}`);

    console.log(`  ${d.day_label || ''} [${d.focus || '?'}] · ${tags.join(' · ')}`);

    if(tieneBi || tieneTri){
      stats.dias_con_brazos++;
      if(tieneBi && tieneTri) stats.dias_brazos_mixto++;
      else if(tieneBi) stats.dias_brazos_solo_bi++;
      else if(tieneTri) stats.dias_brazos_solo_tri++;
    }
    if(tienePecho && tieneTri) stats.dias_pecho_tri++;
    if(tienePecho && tieneBi) stats.dias_pecho_bi++;
    if(tieneEspalda && tieneBi) stats.dias_espalda_bi++;
    if(tieneEspalda && tieneTri) stats.dias_espalda_tri++;
    if(tieneHombros && tieneTri) stats.dias_hombro_tri++;
    if(tieneHombros && tieneBi) stats.dias_hombro_bi++;
    if(tienePierna && tieneBi) stats.dias_pierna_bi++;
    if(tienePierna && tieneTri) stats.dias_pierna_tri++;
    // brazos puro: bi+tri sin otro músculo grande
    if((tieneBi || tieneTri) && !tienePecho && !tieneEspalda && !tieneHombros && !tienePierna){
      stats.dias_brazos_puro++;
    }
  });
});

console.log('\n=== EVIDENCIA EMPÍRICA · 8 rutinas Ariel ===\n');
console.log(`Total días analizados: ${stats.total_dias}`);
console.log(`Días con bíceps o tríceps: ${stats.dias_con_brazos}`);
console.log('');
console.log('Patrón mezclado vs antagonista:');
console.log(`  Días con BI y TRI mezclados:  ${stats.dias_brazos_mixto} (${pct(stats.dias_brazos_mixto, stats.dias_con_brazos)}%)`);
console.log(`  Días con SOLO bíceps:         ${stats.dias_brazos_solo_bi} (${pct(stats.dias_brazos_solo_bi, stats.dias_con_brazos)}%)`);
console.log(`  Días con SOLO tríceps:        ${stats.dias_brazos_solo_tri} (${pct(stats.dias_brazos_solo_tri, stats.dias_con_brazos)}%)`);
console.log('');
console.log('Pairing con grupos grandes:');
console.log(`  Pecho + TRÍCEPS:   ${stats.dias_pecho_tri}`);
console.log(`  Pecho + bíceps:    ${stats.dias_pecho_bi}`);
console.log(`  Espalda + BÍCEPS:  ${stats.dias_espalda_bi}`);
console.log(`  Espalda + tríceps: ${stats.dias_espalda_tri}`);
console.log(`  Hombro + TRÍCEPS:  ${stats.dias_hombro_tri}`);
console.log(`  Hombro + bíceps:   ${stats.dias_hombro_bi}`);
console.log(`  Pierna + bíceps:   ${stats.dias_pierna_bi}`);
console.log(`  Pierna + tríceps:  ${stats.dias_pierna_tri}`);
console.log(`  Brazos PURO (sin grupo grande): ${stats.dias_brazos_puro}`);

function pct(a, b){ return b ? Math.round(a/b*100) : 0; }

// =====================================================================
// DETALLE TRÍCEPS · ¿Cuándo y cómo lo combina Ariel?
// =====================================================================
console.log('\n\n=== DETALLE TRÍCEPS · análisis de los 9 días con tríceps ===\n');
rutinas.forEach(r => {
  r.days.forEach(d => {
    const counts = { biceps: 0, triceps: 0, pecho: 0, espalda: 0, hombros: 0, cuad: 0, isq: 0, gluteos: 0, pant: 0, core: 0, cardio: 0 };
    d.exercises.forEach(ex => {
      const cls = classify(ex.name);
      const key = cls === 'cuadriceps' ? 'cuad' : cls === 'isquios' ? 'isq' : cls === 'pantorrillas' ? 'pant' : cls;
      if(counts[key] !== undefined) counts[key]++;
    });
    if(counts.triceps > 0){
      const ctx = [];
      if(counts.pecho) ctx.push(`pecho×${counts.pecho}`);
      if(counts.espalda) ctx.push(`espalda×${counts.espalda}`);
      if(counts.hombros) ctx.push(`hombros×${counts.hombros}`);
      if(counts.cuad + counts.isq + counts.gluteos > 0) ctx.push(`pierna×${counts.cuad + counts.isq + counts.gluteos}`);
      console.log(`  ${r.client_label || r.title} · ${d.day_label || ''} [${d.focus || '?'}]`);
      console.log(`    Contexto: ${ctx.join(' + ') || '(brazos puro)'} · BI:${counts.biceps} · TRI:${counts.triceps}`);
      // Listar ejercicios tríceps específicos
      const triEx = d.exercises.filter(ex => classify(ex.name) === 'triceps').map(ex => ex.name);
      console.log(`    Tríceps: ${triEx.join(' · ')}`);
    }
  });
});

// =====================================================================
// "POR LA NEGATIVA" · qué COMBINACIONES con tríceps NO usa Ariel
// =====================================================================
console.log('\n\n=== POR LA NEGATIVA · combinaciones con TRÍCEPS que Ariel NO hace ===\n');
const triPairings = { 'pecho_solo': 0, 'espalda_solo': 0, 'hombro_solo': 0, 'pierna': 0, 'puro_tri_aislado': 0,
                       'con_bi_pecho': 0, 'con_bi_espalda': 0, 'con_bi_hombro': 0, 'con_bi_solo': 0 };

rutinas.forEach(r => {
  r.days.forEach(d => {
    const counts = { biceps: 0, triceps: 0, pecho: 0, espalda: 0, hombros: 0, pierna: 0 };
    d.exercises.forEach(ex => {
      const cls = classify(ex.name);
      if(cls === 'biceps') counts.biceps++;
      else if(cls === 'triceps') counts.triceps++;
      else if(cls === 'pecho') counts.pecho++;
      else if(cls === 'espalda') counts.espalda++;
      else if(cls === 'hombros') counts.hombros++;
      else if(['cuadriceps','isquios','gluteos','pantorrillas'].includes(cls)) counts.pierna++;
    });
    if(counts.triceps > 0){
      const tieneOtro = counts.pecho + counts.espalda + counts.hombros + counts.pierna > 0;
      if(!tieneOtro && counts.biceps === 0) triPairings.puro_tri_aislado++;
      if(counts.biceps > 0 && !counts.pecho && !counts.espalda && !counts.hombros) triPairings.con_bi_solo++;
      if(counts.biceps > 0 && counts.pecho > 0) triPairings.con_bi_pecho++;
      if(counts.biceps > 0 && counts.espalda > 0) triPairings.con_bi_espalda++;
      if(counts.biceps > 0 && counts.hombros > 0) triPairings.con_bi_hombro++;
      if(counts.biceps === 0 && counts.pecho > 0 && !counts.espalda && !counts.hombros) triPairings.pecho_solo++;
      if(counts.biceps === 0 && counts.espalda > 0 && !counts.pecho && !counts.hombros) triPairings.espalda_solo++;
      if(counts.biceps === 0 && counts.hombros > 0 && !counts.pecho && !counts.espalda) triPairings.hombro_solo++;
      if(counts.pierna > 0) triPairings.pierna++;
    }
  });
});

console.log('Frecuencia de combinaciones con tríceps:');
console.log(`  Tríceps + Pecho SOLO (push antagonista clásico):       ${triPairings.pecho_solo}`);
console.log(`  Tríceps + Espalda SOLO:                                 ${triPairings.espalda_solo}`);
console.log(`  Tríceps + Hombros SOLO:                                 ${triPairings.hombro_solo}`);
console.log(`  Tríceps + Pierna (cross-grupos):                        ${triPairings.pierna}`);
console.log(`  Tríceps + Pecho + Bíceps (mezcla):                     ${triPairings.con_bi_pecho}`);
console.log(`  Tríceps + Espalda + Bíceps (mezcla):                   ${triPairings.con_bi_espalda}`);
console.log(`  Tríceps + Hombros + Bíceps (mezcla):                   ${triPairings.con_bi_hombro}`);
console.log(`  Tríceps + Bíceps SOLO (brazos puro):                   ${triPairings.con_bi_solo}`);
console.log(`  Tríceps PURO aislado (sin nada más):                   ${triPairings.puro_tri_aislado}`);
