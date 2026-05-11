// =====================================================================
// adapt_yuhonas_for_html_inject.js · Sprint 1.7 D4 (parcial) · 2026-05-11
// Adapta las 873 yuhonas refined (output D3) al schema HTML-compatible
// que el motor NEXUS espera (matching contras vía IDs de CONTRAINDICATIONS_TABLE).
//
// Cambios:
//   - contraindications (strings) → contraindication_ids (IDs tabla maestra)
//   - regression_chain (array) → regression (primer ID o null) + progression (null)
//   - Agregar default_sets/default_reps/default_rest_seconds por pattern
//   - Renombrar imagen_thumb → yuhonas_thumb (consistencia)
//   - Limpiar fields debug (_yuhonas_meta, contras_source, etc)
// =====================================================================

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_d3_refined.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_ready_for_inject.json');
const STATS_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_ready_stats.json');

// ============================================================
// Mapping contras strings → IDs CONTRAINDICATIONS_TABLE
// ============================================================
const CONTRA_STR_TO_ID = {
  'dolor lumbar agudo': 'lumbalgia_aguda',
  'lumbalgia aguda': 'lumbalgia_aguda',
  'lumbalgia': 'lumbalgia',
  'hernia de disco': 'hernia_discal',
  'hernia de disco lumbar': 'hernia_discal',
  'hernia discal': 'hernia_discal',
  'espondilolistesis': 'lumbalgia',  // mapeo conservador
  'dolor de rodilla agudo': 'lesion_rodilla_sin_alta',
  'lesión meniscal': 'lesion_rodilla',
  'lesion meniscal': 'lesion_rodilla',
  'coxalgia severa': 'lesion_rodilla',  // mapeo conservador (no hay coxalgia ID específico)
  'inestabilidad de tobillo': 'esguince_activo',
  'dolor de hombro agudo': 'lesion_hombro_sin_alta',
  'manguito rotador': 'lesion_hombro',
  'lesión de manguito rotador': 'lesion_hombro',
  'inestabilidad de hombro': 'lesion_hombro',
  'epicondilitis': 'lesion_hombro',  // mapeo conservador (no hay epicondilitis ID)
  'embarazo trimestre 3': 'embarazo',
  'embarazo': 'embarazo',
  'cardiopatía no estabilizada': 'cardiopatia_sin_alta',
  'cardiopatia no estabilizada': 'cardiopatia_sin_alta',
  'cardiopatía': 'cardiopatia',
  'hipertensión no controlada': 'hipertension_sin_control',
  'hipertension no controlada': 'hipertension_sin_control',
  'hipertensión severa': 'hipertension_descompensada',
  'lesión articular aguda': 'esguince_activo',
  'cirugía abdominal reciente': 'post_quirurgico_reciente',
  'cirugia abdominal reciente': 'post_quirurgico_reciente',
  // strings que NO son contras clínicas reales · skip
  'principiante absoluto sin técnica base': null,
  'inestabilidad postural': null
};

function mapContraToId(contraStr){
  const key = (contraStr || '').toLowerCase().trim();
  return CONTRA_STR_TO_ID[key] !== undefined ? CONTRA_STR_TO_ID[key] : null;
}

// ============================================================
// Default sets/reps/rest por pattern
// ============================================================
function getDefaults(pattern, level){
  // Compound mayor · 4 sets · pesos altos · descansos largos
  if(['hinge','squat','push_vertical','pull_vertical'].includes(pattern)){
    return { default_sets: 4, default_reps: level >= 3 ? '6-10' : '8-12', default_rest_seconds: 120 };
  }
  // Compound horizontal
  if(['push_horizontal','pull_horizontal'].includes(pattern)){
    return { default_sets: 4, default_reps: '8-12', default_rest_seconds: 90 };
  }
  // Aislamiento
  if(['isolation_push','isolation_pull'].includes(pattern)){
    return { default_sets: 3, default_reps: '10-15', default_rest_seconds: 60 };
  }
  // Estático/isométrico
  if(pattern === 'isometric'){
    return { default_sets: 3, default_reps: '30-60s', default_rest_seconds: 60 };
  }
  // Stretch
  if(pattern === 'stretch'){
    return { default_sets: 2, default_reps: '30-60s', default_rest_seconds: 30 };
  }
  // Cardio LISS
  if(pattern === 'cardio_liss'){
    return { default_sets: 1, default_reps: '15-30 min', default_rest_seconds: 0 };
  }
  // Cardio HIIT
  if(pattern === 'cardio_hiit'){
    return { default_sets: 6, default_reps: '30s on/30s off', default_rest_seconds: 30 };
  }
  // Plyometric
  if(pattern === 'plyometric'){
    return { default_sets: 4, default_reps: '8-12', default_rest_seconds: 90 };
  }
  // Other / default
  return { default_sets: 3, default_reps: '10-12', default_rest_seconds: 60 };
}

// ============================================================
// Adaptación de cada entry
// ============================================================
function adaptEntry(ex){
  // 1. Map contras strings → IDs (filter nulls)
  const contraIds = (ex.contraindications || [])
    .map(mapContraToId)
    .filter(id => id !== null);
  const uniqueContraIds = [...new Set(contraIds)];

  // 2. Regression: primer ID del chain · si chain vacío · null
  const regression = (ex.regression_chain && ex.regression_chain.length > 0) ? ex.regression_chain[0] : null;

  // 3. Defaults por pattern
  const defaults = getDefaults(ex.pattern, ex.level);

  // 4. Build new entry · schema HTML-compatible
  return {
    id: ex.id,
    name: ex.name,
    group: ex.group,
    level: ex.level,
    equipment: ex.equipment,
    primary_muscles: ex.primary_muscles,
    secondary_muscles: ex.secondary_muscles,
    pattern: ex.pattern,
    regression,
    progression: null,
    citation: ex.citation || 'Banco yuhonas',
    default_sets: defaults.default_sets,
    default_reps: defaults.default_reps,
    default_rest_seconds: defaults.default_rest_seconds,
    contraindication_ids: uniqueContraIds,
    yuhonas_match: ex.id,  // self-match
    yuhonas_thumb: ex.imagen_thumb || null,
    // Campos extra heredados de yuhonas
    crdt_id: ex.crdt_id,
    imagen_thumb: ex.imagen_thumb || null,  // duplicado · backwards compat
    imagen_full: ex.imagen_full || null,
    instrucciones_en: ex.instructions || [],  // EN crudo hasta D2 LLM
    origen: 'yuhonas',
    inherited_from_curado: ex.inherited_from_curado || null
  };
}

// ============================================================
// MAIN
// ============================================================
function main(){
  const refined = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  console.log(`[Adapt] Input: ${refined.length} entries refined D3`);

  const adapted = refined.map(adaptEntry);

  // Stats
  const stats = {
    total: adapted.length,
    with_contras: adapted.filter(e => e.contraindication_ids.length > 0).length,
    with_regression: adapted.filter(e => e.regression).length,
    inherited_from_curado: adapted.filter(e => e.inherited_from_curado).length,
    avg_contras_per_entry: (adapted.reduce((sum, e) => sum + e.contraindication_ids.length, 0) / adapted.length).toFixed(2),
    contra_id_distribution: {},
    by_pattern: {},
    bytes_estimate: JSON.stringify(adapted).length
  };
  adapted.forEach(e => {
    e.contraindication_ids.forEach(id => {
      stats.contra_id_distribution[id] = (stats.contra_id_distribution[id] || 0) + 1;
    });
    stats.by_pattern[e.pattern] = (stats.by_pattern[e.pattern] || 0) + 1;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(adapted, null, 2));
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));

  console.log('\n=== ADAPT COMPLETO ===');
  console.log(`Total adapted: ${adapted.length}`);
  console.log(`Con contraindication_ids (IDs mapeados): ${stats.with_contras}/${adapted.length}`);
  console.log(`Con regression: ${stats.with_regression}/${adapted.length}`);
  console.log(`Heredados de curados: ${stats.inherited_from_curado}/${adapted.length}`);
  console.log(`Avg contras por entry: ${stats.avg_contras_per_entry}`);
  console.log(`Tamaño estimado output JSON: ${(stats.bytes_estimate/1024).toFixed(1)} KB`);
  console.log();
  console.log('=== CONTRA ID DISTRIBUCIÓN ===');
  Object.entries(stats.contra_id_distribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(30)} ${v}`));
  console.log();
  console.log('=== POR PATTERN ===');
  Object.entries(stats.by_pattern).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));
}

main();
