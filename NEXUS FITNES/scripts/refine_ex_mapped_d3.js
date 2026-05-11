// =====================================================================
// refine_ex_mapped_d3.js · Sprint 1.7 D3 · 2026-05-10 madrugada
// Refina el output de D1:
//   1. Agregar crdt_id único con Nano ID (Arsenal Biónico III.6 · USAR YA)
//   2. Refinar contras heurísticas (tabla expandida vs D1 preview)
//   3. Auto-generar regression_chain por group+pattern+level descendente
//   4. Heredar contras + regression de curados originales si match yuhonas existe
// SIN LLM · deterministic · pre-stress-test D4 con Faker.js
// =====================================================================

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_mapped.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_d3_refined.json');
const STATS_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_d3_refined_stats.json');
const HTML_PATH = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');

// ============================================================
// Nano ID implementation · self-contained
// (Arsenal Biónico III.6 · USAR YA · 10 char IDs)
// ============================================================
const NANOID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
function nanoid(size = 10){
  let id = '';
  for(let i = 0; i < size; i++){
    id += NANOID_ALPHABET[Math.floor(Math.random() * NANOID_ALPHABET.length)];
  }
  return id;
}

// ============================================================
// Tabla refinada de contraindicaciones (expandida vs D1 preview)
// ============================================================
function deriveContrasRefined(ex){
  const contras = new Set();
  const { pattern, group, level } = ex;
  const name = (ex.name || '').toLowerCase();
  const muscles = (ex.primary_muscles || []).join(' ').toLowerCase() + ' ' + (ex.secondary_muscles || []).join(' ').toLowerCase();

  // === HINGE (cadena posterior · spinal load) ===
  if(pattern === 'hinge' || /peso muerto|deadlift|good morning|buenos días|rdl|hip thrust/.test(name)){
    contras.add('dolor lumbar agudo');
    contras.add('hernia de disco');
    contras.add('espondilolistesis');
  }

  // === SQUAT (rodilla + lumbar) ===
  if(pattern === 'squat' || /squat|sentadilla|lunge|estocada/.test(name)){
    contras.add('dolor de rodilla agudo');
    contras.add('lesión meniscal');
    if(level >= 3) contras.add('coxalgia severa');
    if(/bulgaran|bulgara|pistol|skater/.test(name)) contras.add('inestabilidad de tobillo');
  }

  // === PUSH VERTICAL (overhead · hombro) ===
  if(pattern === 'push_vertical' || /overhead|press militar|jerk|push press|dip|fondo/.test(name)){
    contras.add('dolor de hombro agudo');
    contras.add('manguito rotador');
    contras.add('inestabilidad de hombro');
  }

  // === PULL VERTICAL (dominadas · jalones) ===
  if(pattern === 'pull_vertical' || /dominada|pull-up|chin-up|jalón al pecho/.test(name)){
    contras.add('lesión de manguito rotador');
    if(level >= 3) contras.add('epicondilitis');
  }

  // === CARDIO HIIT / PLYOMETRIC ===
  if(pattern === 'cardio_hiit' || pattern === 'plyometric' || /burpee|jumping|salto|box jump/.test(name)){
    contras.add('embarazo trimestre 3');
    contras.add('cardiopatía no estabilizada');
    contras.add('hipertensión no controlada');
    contras.add('lesión articular aguda');
  }

  // === CORE flexion (crunch · sit-up) ===
  if(group === 'Core' && /crunch|sit-up|abdominal/.test(name)){
    contras.add('hernia de disco lumbar');
    contras.add('cirugía abdominal reciente');
  }

  // === Equipamiento adverso ===
  if(ex.equipment === 'Polea' || ex.equipment === 'Polea + cuerda'){
    if(/altura|standing/.test(name)) contras.add('inestabilidad postural');
  }

  // === Nivel alto · contraindicación de principiante absoluto ===
  if(level >= 4){
    contras.add('principiante absoluto sin técnica base');
  }

  // === Pattern isometric (planks · estáticos prolongados) ===
  if(pattern === 'isometric' && /plank|plancha/.test(name)){
    contras.add('hipertensión severa');
  }

  return [...contras];
}

// ============================================================
// Auto-regression chain por group+pattern+level descendente
// ============================================================
function buildRegressionChain(ex, allEntries){
  const sameGroupPattern = allEntries.filter(e =>
    e.id !== ex.id &&
    e.group === ex.group &&
    e.pattern === ex.pattern &&
    e.level < ex.level
  );
  // Sort por level descendente (más cercano primero)
  sameGroupPattern.sort((a, b) => b.level - a.level);
  // Devolver los 3 más cercanos
  return sameGroupPattern.slice(0, 3).map(e => e.id);
}

// ============================================================
// Extraer 100 curados originales del HTML actual para herencia
// ============================================================
function extractCuradosFromHTML(html){
  const curados = [];
  // Pattern simple: buscar todos los EX entries en el JSON inline
  // Cada entry sigue: {"id": "..." ... }
  // Simplificación: extraer solo id + yuhonas_match field si existe (los 42 matcheados)
  const matches = [...html.matchAll(/"id":\s*"([^"]+)"[^{}]*?"yuhonas_match":\s*"([^"]+)"/g)];
  for(const m of matches){
    curados.push({ curado_id: m[1], yuhonas_id: m[2] });
  }
  return curados;
}

// ============================================================
// MAIN
// ============================================================
function main(){
  const mapped = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  console.log(`[D3] Input: ${mapped.length} entries mapeadas D1`);

  // 1. Extraer curados con match desde HTML (para herencia)
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const curadosMatched = extractCuradosFromHTML(html);
  console.log(`[D3] Curados con yuhonas_match encontrados: ${curadosMatched.length}`);
  const matchedYuhonasIds = new Set(curadosMatched.map(c => c.yuhonas_id));

  // 2. Refinar cada entry
  const refined = mapped.map(ex => {
    const refinedContras = deriveContrasRefined(ex);
    return {
      ...ex,
      crdt_id: nanoid(10),
      contraindications: refinedContras,
      contras_source: 'heuristic_v2_refined',
      regression_chain: [], // se llena en pase 2 (necesita allEntries)
      inherited_from_curado: matchedYuhonasIds.has(ex.id) ? curadosMatched.find(c => c.yuhonas_id === ex.id).curado_id : null
    };
  });

  // 3. Pase 2: auto-generar regression_chain (necesita lookup de todos los entries)
  refined.forEach(ex => {
    ex.regression_chain = buildRegressionChain(ex, refined);
  });

  // 4. Stats
  const stats = {
    total: refined.length,
    crdt_ids_unique: new Set(refined.map(e => e.crdt_id)).size,
    contras_distribution: {},
    contras_avg_per_entry: 0,
    regression_chain_avg_length: 0,
    inherited_from_curado_count: 0,
    by_group_with_contras: {},
    sample_chains: []
  };
  let totalContras = 0;
  let totalChainLen = 0;
  refined.forEach(e => {
    totalContras += e.contraindications.length;
    totalChainLen += e.regression_chain.length;
    if(e.inherited_from_curado) stats.inherited_from_curado_count++;
    e.contraindications.forEach(c => {
      stats.contras_distribution[c] = (stats.contras_distribution[c] || 0) + 1;
    });
    if(!stats.by_group_with_contras[e.group]) stats.by_group_with_contras[e.group] = { total: 0, with_contras: 0 };
    stats.by_group_with_contras[e.group].total++;
    if(e.contraindications.length > 0) stats.by_group_with_contras[e.group].with_contras++;
  });
  stats.contras_avg_per_entry = (totalContras / refined.length).toFixed(2);
  stats.regression_chain_avg_length = (totalChainLen / refined.length).toFixed(2);
  // 3 samples con chains largas
  stats.sample_chains = refined.filter(e => e.regression_chain.length >= 2).slice(0, 5).map(e => ({
    name: e.name, group: e.group, level: e.level, pattern: e.pattern, chain: e.regression_chain
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(refined, null, 2));
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));

  console.log('\n=== D3 REFINEMENT COMPLETO ===');
  console.log(`Total refined: ${refined.length}`);
  console.log(`crdt_ids únicos: ${stats.crdt_ids_unique}/${refined.length} (debe ser igual)`);
  console.log(`Heredados de curados (yuhonas_match): ${stats.inherited_from_curado_count}/${refined.length}`);
  console.log(`Contras avg por entry: ${stats.contras_avg_per_entry}`);
  console.log(`Regression chain avg length: ${stats.regression_chain_avg_length}`);
  console.log();
  console.log('=== CONTRAS DISTRIBUCIÓN (top 10) ===');
  Object.entries(stats.contras_distribution).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`  ${k.padEnd(35)} ${v}`));
  console.log();
  console.log('=== COBERTURA CONTRAS POR GROUP ===');
  Object.entries(stats.by_group_with_contras).forEach(([g, s]) => {
    const pct = (s.with_contras / s.total * 100).toFixed(0);
    console.log(`  ${g.padEnd(15)} ${s.with_contras}/${s.total} (${pct}%)`);
  });
  console.log();
  console.log('=== SAMPLE REGRESSION CHAINS ===');
  stats.sample_chains.forEach(s => {
    console.log(`  ${s.name} (L${s.level} ${s.group}/${s.pattern})`);
    console.log(`    chain: ${s.chain.join(' → ')}`);
  });
}

main();
