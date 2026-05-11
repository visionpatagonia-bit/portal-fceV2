// =====================================================================
// build_ex_from_yuhonas.js · Sprint 1.7 D1 · 2026-05-10 noche
// Pipeline de mapping deterministic yuhonas → schema NEXUS EX.
// Input: exercises_extended.json (873 ej yuhonas)
// Output: EX_yuhonas_mapped.json (entries en schema NEXUS · sin LLM)
// =====================================================================

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'deploy_qa', 'public', 'exercises_extended.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_mapped.json');
const STATS_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_mapped_stats.json');

// ============================================================
// MAPPING TABLES (deterministic)
// ============================================================

// nivel string → level int
const NIVEL_TO_LEVEL = {
  'inicial': 2,      // mapea a level 2 (consistente con curados existentes)
  'intermedio': 3,
  'avanzado': 4,
  'principiante': 1, // si aparece
  'experto': 5       // si aparece
};

// musculo primario → group NEXUS
const MUSCULO_TO_GROUP = {
  'abdominales': 'Core',
  'cuádriceps': 'Cuádriceps',
  'cuadriceps': 'Cuádriceps',
  'isquiotibiales': 'Glúteos',
  'glúteos': 'Glúteos',
  'gluteos': 'Glúteos',
  'aductores': 'Glúteos',
  'abductores': 'Glúteos',
  'pecho': 'Pecho',
  'dorsales': 'Espalda',
  'espalda media': 'Espalda',
  'trapecios': 'Hombros',  // trapecios superior va a Hombros · medio/inferior a Espalda
  'lumbares': 'Espalda',
  'hombros': 'Hombros',
  'tríceps': 'Brazos',
  'triceps': 'Brazos',
  'bíceps': 'Brazos',
  'biceps': 'Brazos',
  'antebrazos': 'Brazos',
  'gemelos': 'Pantorrillas',
  'pantorrillas': 'Pantorrillas',
  'cuello': 'Hombros',
  'cardiovascular': 'Cardio',
};

// mecanica + fuerza_tipo → pattern NEXUS
function derivePattern(ex){
  const cat = (ex.categoria || '').toLowerCase();
  const mec = (ex.mecanica || '').toLowerCase();
  const fz = (ex.fuerza_tipo || '').toLowerCase();
  const nombre = ((ex.nombre_es || ex.nombre || '') + ' ' + (ex.nombre || '')).toLowerCase();

  // Cardio · derivar de keywords
  if(cat === 'cardio'){
    return /interval|hiit|sprint|burpee|jump/.test(nombre) ? 'cardio_hiit' : 'cardio_liss';
  }
  // Estiramiento
  if(cat === 'estiramiento'){
    return 'stretch';
  }
  // Pliometría
  if(cat === 'pliometría' || cat === 'pliometria'){
    return 'plyometric';
  }
  // Estático
  if(fz === 'estático' || fz === 'estatico' || mec === 'aislamiento' && fz === 'estático'){
    return 'isometric';
  }
  // Hinge (cadena posterior · peso muerto · buenos días)
  if(/peso muerto|deadlift|good morning|buenos días|hip thrust|hinge|rdl/.test(nombre)){
    return 'hinge';
  }
  // Squat (sentadilla · prensa)
  if(/squat|sentadilla|prensa de pierna|leg press|lunge|estocada/.test(nombre)){
    return 'squat';
  }
  // Compuesto + empuje
  if(mec === 'compuesto' && fz === 'empuje'){
    // overhead → push_vertical · else push_horizontal
    if(/overhead|press militar|shoulder press|jerk|push press/.test(nombre)) return 'push_vertical';
    if(/dip|fondo|paralela/.test(nombre)) return 'push_vertical';
    return 'push_horizontal';
  }
  // Compuesto + tracción
  if(mec === 'compuesto' && fz === 'tracción'){
    if(/dominada|pull-up|chin-up|lat pulldown|jalón al pecho|polea alta/.test(nombre)) return 'pull_vertical';
    return 'pull_horizontal';
  }
  // Aislamiento + empuje
  if(mec === 'aislamiento' && fz === 'empuje'){
    return 'isolation_push';
  }
  // Aislamiento + tracción
  if(mec === 'aislamiento' && fz === 'tracción'){
    return 'isolation_pull';
  }
  // Fallback
  return 'other';
}

// equipamiento yuhonas → equipment NEXUS
function deriveEquipment(ex){
  const eq = (ex.equipamiento || '').toLowerCase();
  if(!eq || eq === 'null') return 'Ninguno';
  if(/peso corporal|body|bodyweight/.test(eq)) return 'Ninguno';
  if(/mancuerna/.test(eq)) return 'Mancuernas';
  if(/barra/.test(eq)) return 'Barra olímpica + banco';
  if(/banda/.test(eq)) return 'Banda elástica';
  if(/máquina|machine/.test(eq)) return 'Máquina';
  if(/cable|polea/.test(eq)) return 'Polea';
  if(/kettlebell|pesa rusa/.test(eq)) return 'Mancuernas';
  if(/medicine ball|pelota medicinal/.test(eq)) return 'Colchoneta';
  if(/foam roller/.test(eq)) return 'Foam roller';
  if(/colchoneta|mat/.test(eq)) return 'Colchoneta';
  return 'Otro';
}

// ============================================================
// HEURÍSTICA DE CONTRAINDICACIONES (D3 preview · conservadora)
// ============================================================
function deriveContraindications(pattern, group, level){
  const contras = [];
  if(pattern === 'hinge'){
    contras.push('dolor lumbar agudo');
    contras.push('hernia de disco');
  }
  if(pattern === 'squat' && level >= 3){
    contras.push('dolor de rodilla agudo');
    contras.push('lesión meniscal');
  }
  if(pattern === 'push_vertical'){
    contras.push('dolor de hombro agudo');
    contras.push('manguito rotador');
  }
  if(pattern === 'cardio_hiit' || pattern === 'plyometric'){
    contras.push('embarazo trimestre 3');
    contras.push('cardiopatía no estabilizada');
  }
  if(level >= 4){
    contras.push('principiante absoluto'); // ejercicios L4+ no para nivel 1
  }
  return contras;
}

// ============================================================
// HELPER: capitalizar primer letra
// ============================================================
function cap(s){ if(!s) return s; return s.charAt(0).toUpperCase() + s.slice(1); }

// ============================================================
// MAIN MAPPING
// ============================================================
function mapEntry(ex){
  const primaryRaw = (ex.musculos_primarios || [])[0] || '';
  const group = MUSCULO_TO_GROUP[primaryRaw.toLowerCase()] || null;
  if(!group) return null; // skip si no podemos mapear group

  const level = NIVEL_TO_LEVEL[ex.nivel] || 2;
  const pattern = derivePattern(ex);
  const equipment = deriveEquipment(ex);
  const name = ex.nombre_es || (ex.nombre + ' (EN)');
  const contras = deriveContraindications(pattern, group, level);

  return {
    id: ex.id,
    origen: 'yuhonas',
    name,
    group,
    level,
    pattern,
    equipment,
    primary_muscles: (ex.musculos_primarios || []).map(cap),
    secondary_muscles: (ex.musculos_secundarios || []).map(cap),
    instructions: ex.instrucciones_es || ex.instrucciones || [], // EN crudo hasta D2 LLM
    instructions_pending_translation: !ex.instrucciones_es,
    contraindications: contras,
    contras_source: 'heuristic_v1',
    regression_chain: [], // se llena en D3 post-mapping
    imagen_thumb: (ex.imagenes || [])[0] || null,
    imagen_full: (ex.imagenes || [])[1] || (ex.imagenes || [])[0] || null,
    citation: 'Banco yuhonas (free-exercise-db MIT) · mapeado a schema NEXUS',
    _yuhonas_meta: {
      categoria: ex.categoria,
      mecanica: ex.mecanica,
      fuerza_tipo: ex.fuerza_tipo,
      es_dict: !!ex.nombre_es
    }
  };
}

// ============================================================
// RUN
// ============================================================
function main(){
  const bundle = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const exes = bundle.exercises;
  console.log(`[D1] Input: ${exes.length} ejercicios yuhonas`);

  const mapped = [];
  const skipped = [];
  for(const ex of exes){
    const m = mapEntry(ex);
    if(m) mapped.push(m); else skipped.push({ id: ex.id, nombre: ex.nombre_es || ex.nombre, primary: ex.musculos_primarios?.[0] || 'null', reason: 'no group mapping' });
  }

  // Stats
  const stats = {
    total_input: exes.length,
    total_mapped: mapped.length,
    total_skipped: skipped.length,
    by_group: {},
    by_level: {},
    by_pattern: {},
    by_equipment: {},
    tiene_traduccion_nombre: mapped.filter(m => m._yuhonas_meta.es_dict).length,
    pending_translation_instructions: mapped.filter(m => m.instructions_pending_translation).length,
    contras_assigned: mapped.filter(m => m.contraindications.length > 0).length,
    skipped_sample: skipped.slice(0, 10)
  };
  mapped.forEach(m => {
    stats.by_group[m.group] = (stats.by_group[m.group] || 0) + 1;
    stats.by_level[m.level] = (stats.by_level[m.level] || 0) + 1;
    stats.by_pattern[m.pattern] = (stats.by_pattern[m.pattern] || 0) + 1;
    stats.by_equipment[m.equipment] = (stats.by_equipment[m.equipment] || 0) + 1;
  });

  // Ensure output dir
  const outDir = path.dirname(OUTPUT_PATH);
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapped, null, 2));
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));

  console.log('\n=== D1 MAPPING COMPLETO ===');
  console.log(`Mapeado: ${mapped.length}/${exes.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Stats: ${STATS_PATH}`);
  console.log();
  console.log('=== BY GROUP ===');
  Object.entries(stats.by_group).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(15)} ${v}`));
  console.log('\n=== BY LEVEL ===');
  Object.entries(stats.by_level).sort((a,b) => a[0]-b[0]).forEach(([k,v]) => console.log(`  L${k} ${v}`));
  console.log('\n=== BY PATTERN ===');
  Object.entries(stats.by_pattern).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(20)} ${v}`));
  console.log('\n=== BY EQUIPMENT ===');
  Object.entries(stats.by_equipment).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(30)} ${v}`));
  console.log('\n=== TRADUCCIÓN ===');
  console.log(`  nombre_es presente: ${stats.tiene_traduccion_nombre}/${mapped.length} (${(stats.tiene_traduccion_nombre/mapped.length*100).toFixed(1)}%)`);
  console.log(`  instrucciones_es pendiente (D2 LLM): ${stats.pending_translation_instructions}`);
  console.log(`  contras asignadas (heurística D3 preview): ${stats.contras_assigned}/${mapped.length}`);

  if(skipped.length > 0){
    console.log('\n=== SKIPPED · primeros 10 ===');
    skipped.slice(0, 10).forEach(s => console.log(`  ${s.id} · "${s.nombre}" · primary="${s.primary}"`));
  }
}

main();
