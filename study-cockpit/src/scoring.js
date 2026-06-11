'use strict';

/*
 * Motor de scoring DATA-DRIVEN.
 *
 * No conoce materias: corrige leyendo la rubrica que vive en el contrato
 * (exam-profile.json), bloque por bloque, segun `block.grading.type`.
 * Agregar una materia = autoria de JSON, no codigo.
 *
 * Tipos de grader soportados:
 *   - "text"                  criterios de terminos con puntaje (definicion/desarrollo/caso)
 *   - "true_false_justified"  opcion V/F + justificacion tecnica por item
 *   - "calculation"           valores numericos esperados + tolerancia + balance
 *   - "choice"                opcion multiple contra la clave de la variante del contrato
 *   - "text_family"           terminos por conceptFamily (contract.gradingFamilies)
 *
 * Cada bloque declara `grading.input`: la clave que lee en `answers`.
 */

const DEFAULT_THRESHOLDS = { pass: 6, promotion: 8, weakBlock: 1.35 };

// Calibracion conservadora (auditoria 2026-06-08): el score tecnico NO es la nota.
// nota estimada = score tecnico - margen de seguridad, hasta calibrar contra parciales reales.
const CALIBRATION = {
  safetyMargin: 0.85,      // practica
  hardSafetyMargin: 1.0,   // modo examen duro
  hardWeakBlock: 1.5,      // ningun bloque debajo de 1.5/2 para promocion segura
  confidence: 'baja'       // sube cuando haya parciales reales held-out
};

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(text, terms) {
  const value = normalize(text);
  return (terms || []).some((term) => value.includes(normalize(term)));
}

// Parser tolerante a notacion es-AR: punto = separador de miles, coma = decimal.
// Un alumno que escribe "500.000" (notacion local) debe valer 500000, no 500.
// Conservador: el dominio son importes en pesos; "12.5"/"0,5" siguen siendo decimales.
function toNumber(value) {
  let s = String(value == null ? '' : value).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, ''); // descartar $, espacios, etc.
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.'); // "1.234.567,89" -> "1234567.89"
  } else if (hasComma) {
    s = s.replace(',', '.'); // "1234,89" -> "1234.89"
  } else if (hasDot) {
    const parts = s.split('.');
    // Grupos de 3 cifras = separador de miles ("500.000", "1.234.567"); si no, es decimal ("12.5").
    const looksThousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    if (looksThousands) s = parts.join('');
  }
  const parsed = Number.parseFloat(s);
  return Number.isFinite(parsed) ? parsed : 0;
}

function near(value, target) {
  return Math.abs(value - target) <= Math.max(2, Math.abs(target) * 0.005);
}

function clampPoints(value, max) {
  return Math.max(0, Math.min(max, round2(value)));
}

function findVariant(contract, variantId) {
  const variants = (contract && contract.variants) || [];
  return variants.find((variant) => variant.id === variantId) || variants[0] || null;
}

function firstItemForBlock(variant, blockId) {
  if (!variant) return null;
  const block = (variant.blocks || []).find((entry) => entry.blockId === blockId);
  return block?.items?.[0] || null;
}

function itemsForBlock(variant, blockId) {
  if (!variant) return [];
  const block = (variant.blocks || []).find((entry) => entry.blockId === blockId);
  return block?.items || [];
}

/* ───────────────────────── graders ───────────────────────── */

// Fraccion de palabras significativas (>3 letras) de la respuesta que ya estan en el enunciado.
// Sirve para detectar "copia del enunciado": una respuesta que repite la consigna sin aportar.
function copyRatio(answer, prompt) {
  if (!prompt) return 0;
  const promptWords = new Set(normalize(prompt).split(/\s+/).filter((w) => w.length > 3));
  if (!promptWords.size) return 0;
  const ansWords = normalize(answer).split(/\s+/).filter((w) => w.length > 3);
  if (ansWords.length < 4) return 0;
  const inPrompt = ansWords.filter((w) => promptWords.has(w)).length;
  return inPrompt / ansWords.length;
}

function gradeText(answer, grading, maxPoints, ctx) {
  const hits = [];
  const misses = [];
  let points = 0;

  for (const item of grading.criteria || []) {
    if (hasAny(answer, item.terms)) {
      hits.push(item.label);
      points += item.points;
    } else {
      misses.push(item.label);
    }
  }

  const critical = (grading.critical || [])
    .filter((item) => hasAny(answer, item.terms))
    .map((item) => item.label);

  if (critical.length) points = Math.max(0, points - (grading.criticalPenalty ?? 0.8));

  // Anti-relleno (determinista): una respuesta muy breve o casi copia del enunciado no puede sacar
  // TODO el puntaje aunque "pegue" keywords. Se capea a la mitad (conserva el parcial honesto).
  if (points > maxPoints * 0.5) {
    const ans = String(answer || '').trim();
    const words = ans.split(/\s+/).filter(Boolean);
    const prompt = ctx && ctx.variant ? (firstItemForBlock(ctx.variant, ctx.blockId)?.prompt || '') : '';
    const tooShort = words.length < 6;
    const isCopy = words.length >= 8 && copyRatio(ans, prompt) > 0.8;
    if (tooShort || isCopy) {
      points = maxPoints * 0.5;
      misses.push(tooShort ? 'respuesta breve: desarrolla mas para sumar todo el puntaje' : 'evita copiar el enunciado: aporta criterio tecnico propio');
    }
  }

  return { points: clampPoints(points, maxPoints), hits, misses, critical };
}

function gradeTrueFalseJustified(answer, grading, maxPoints) {
  const items = answer || {};
  const optionPoints = grading.optionPoints ?? 0.25;
  const justPoints = grading.justPoints ?? 0.25;
  const hits = [];
  const misses = [];
  const itemResults = []; // #1 psicometria: correctitud por afirmacion (no cambia la nota)
  let points = 0;

  // Regla pedagogica alineada a la consigna ("corregi las falsas"): las afirmaciones FALSAS hay
  // que CORREGIRLAS (marcar F + justificar con criterio); si no se justifica, el item no suma. Las
  // VERDADERAS, con marcarlas bien alcanza (la consigna no pide justificarlas).
  for (const item of grading.items || []) {
    const value = String(items[item.id]?.value || '').toUpperCase();
    const justification = String(items[item.id]?.justification || items[item.id]?.just || '').trim();
    const expected = String(item.expected || '').toUpperCase();
    const optionOk = value === expected;
    const justOk = justification.length > 0 && hasAny(justification, item.terms);
    const isFalse = expected === 'F';
    const earned = optionOk && (!isFalse || justOk);

    if (!optionOk) {
      misses.push(`${item.id}: opcion esperada ${item.expected}`);
    } else if (isFalse && !justOk) {
      misses.push(justification ? `${item.id}: justificacion no tecnica de la afirmacion falsa` : `${item.id}: falta corregir la afirmacion falsa (justifica por que es falsa)`);
    } else {
      points += optionPoints + justPoints;
      hits.push(`${item.id}: correcta${isFalse ? ' y justificada' : ''}`);
    }
    itemResults.push({ itemId: item.id, score01: earned ? 1 : 0, maxPoints: optionPoints + justPoints });
  }

  return { points: clampPoints(points, maxPoints), hits, misses, critical: [], itemResults };
}

function gradeCalculation(answer, grading, maxPoints) {
  const payload = answer || {};
  const hits = [];
  const misses = [];
  const itemResults = []; // #1 psicometria: correctitud por campo/celda
  let points = 0;

  for (const field of grading.fields || []) {
    const ok = near(toNumber(payload[field.key]), field.expected);
    if (ok) {
      points += field.weight;
      hits.push(field.label);
    } else {
      misses.push(`${field.label}: esperado ${field.expected}`);
    }
    itemResults.push({ itemId: field.key, score01: ok ? 1 : 0, maxPoints: field.weight });
  }

  if (grading.balance) {
    const sum = (keys) => (keys || []).reduce((acc, k) => acc + toNumber(payload[k]), 0);
    const debit = sum(grading.balance.debit);
    const credit = sum(grading.balance.credit);
    const balOk = near(debit, credit) && debit > 0;
    if (balOk) {
      points += grading.balance.weight;
      hits.push(grading.balance.label || 'Debe = Haber');
    } else {
      misses.push(grading.balance.missLabel || 'El asiento no balancea');
    }
    itemResults.push({ itemId: 'balance', score01: balOk ? 1 : 0, maxPoints: grading.balance.weight });
  }

  return { points: clampPoints(points, maxPoints), hits, misses, critical: [], itemResults };
}

function gradeChoice(answer, grading, maxPoints, ctx) {
  const item = firstItemForBlock(ctx.variant, ctx.blockId);
  if (!item || typeof item.answer !== 'number') {
    return { points: 0, hits: [], misses: ['sin clave de correccion para esta variante'], critical: [] };
  }
  const selected = Number.parseInt(String(answer), 10);
  if (Number.isNaN(selected)) {
    return { points: 0, hits: [], misses: ['sin respuesta seleccionada'], critical: [] };
  }
  if (selected === item.answer) {
    return { points: maxPoints, hits: ['opcion correcta'], misses: [], critical: [] };
  }
  const expected = (item.options || [])[item.answer];
  return { points: 0, hits: [], misses: [`opcion incorrecta${expected ? ` (esperado: ${expected})` : ''}`], critical: [] };
}

function gradeTextFamily(answer, grading, maxPoints, ctx) {
  const item = firstItemForBlock(ctx.variant, ctx.blockId);
  const family = item?.conceptFamily;
  const terms = (ctx.contract?.gradingFamilies || {})[family] || [];
  const perHit = grading.perHit ?? 0.55;
  const value = normalize(answer);

  if (!value) {
    return { points: 0, hits: [], misses: ['respuesta vacia'], critical: [] };
  }
  if (!terms.length) {
    const points = value.split(' ').length >= 12 ? 1 : 0.4;
    return { points: clampPoints(points, maxPoints), hits: [], misses: ['desarrollar con vocabulario tecnico'], critical: [] };
  }

  const hits = terms.filter((term) => value.includes(normalize(term)));
  const points = clampPoints(Math.min(maxPoints, hits.length * perHit), maxPoints);
  const misses = points >= DEFAULT_THRESHOLDS.weakBlock ? [] : [`faltan conceptos tecnicos (${family})`];

  return { points, hits: hits.map((t) => `usa "${t}"`), misses, critical: [] };
}

/* ── modo examen duro: bloque MULTI-item (parcial real) ── */
function studentBool(answer) {
  if (!answer) return null;
  const v = answer.value;
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  const s = String(v || '').toUpperCase();
  if (s === 'V' || s === 'VERDADERO') return true;
  if (s === 'F' || s === 'FALSO') return false;
  return null;
}

function gradeSubItem(item, answer, per, ctx) {
  const kind = item.kind || 'choice';

  if (kind === 'choice') {
    const sel = Number.parseInt(String(answer), 10);
    if (Number.isNaN(sel)) return { points: 0, miss: 'sin respuesta' };
    if (sel === item.answer) return { points: per, hit: 'ok' };
    const cross = (item.confusableTrap !== undefined && sel === item.confusableTrap);
    const exp = (item.options || [])[item.answer];
    return { points: 0, miss: `${item.axis || ''}: incorrecta${exp ? ` (esperado: ${exp})` : ''}`, confusableCross: cross };
  }

  if (kind === 'tf_justified') {
    const sb = studentBool(answer);
    if (sb === null) return { points: 0, miss: 'V/F sin marcar' };
    const half = per / 2;
    if (sb !== item.answer) return { points: 0, miss: `V/F: esperado ${item.answer ? 'V' : 'F'}` };
    let p = half; // booleano correcto
    if (item.answer === false) {
      const just = answer.justification || answer.just || '';
      if (hasAny(just, item.terms || [])) p += half;
      else if (!ctx.hard) p += half; // practica: tolerante
      else return { points: round2(p), miss: 'falta justificar la falsa' };
    } else {
      p += half; // verdadero: no hay falsa que justificar
    }
    return { points: round2(p), hit: 'ok' };
  }

  if (kind === 'text') {
    const value = normalize(answer);
    if (!value) return { points: 0, miss: 'respuesta vacia' };
    const terms = item.terms || [];
    const got = terms.filter((t) => value.includes(normalize(t))).length;
    const minHits = item.minHits || 1;
    if (ctx.hard && got < minHits) {
      return { points: round2(Math.min(per * 0.5, (got / minHits) * per)), miss: `enumeracion/cobertura incompleta (min ${minHits})` };
    }
    return { points: round2(per * Math.min(1, got / minHits)), hit: `${got} conceptos` };
  }

  return { points: 0, miss: 'sub-item desconocido' };
}

function gradeMulti(answerArray, grading, maxPoints, ctx) {
  const items = grading.items || [];
  const n = items.length || 1;
  const per = maxPoints / n;
  const arr = Array.isArray(answerArray) ? answerArray : [];
  const hits = [];
  const misses = [];
  const itemResults = []; // #1 psicometria: correctitud por sub-item (matching/V-F/corta)
  let points = 0;
  let penalty = 0;

  items.forEach((item, i) => {
    const sub = gradeSubItem(item, arr[i], per, ctx);
    points += sub.points;
    if (sub.hit) hits.push(sub.hit);
    if (sub.miss) misses.push(sub.miss);
    if (ctx.hard && sub.confusableCross) penalty += (grading.confusablePenalty ?? 0.5);
    itemResults.push({ itemId: item.id || `i${i}`, score01: per > 0 ? Math.max(0, Math.min(1, sub.points / per)) : 0, maxPoints: per });
  });

  if (penalty) points = Math.max(0, points - penalty);
  return { points: clampPoints(points, maxPoints), hits, misses, critical: [], itemResults };
}

// COMPLETAR ORACIONES (cloze): una oracion con huecos. Cada hueco se puntua INDEPENDIENTE por
// igualdad normalizada (o un set de sinonimos en gap.accept), y los numericos via toNumber/near es-AR.
// Subject-agnostic: gaps/accept/expected viven en el contrato; el grader no nombra ninguna materia.
function gradeCloze(answer, grading, maxPoints) {
  const payload = answer || {};
  const gaps = grading.gaps || [];
  const hits = [];
  const misses = [];
  let points = 0;
  const itemResults = []; // #1 psicometria: correctitud por hueco (cloze)
  const fallbackWeight = gaps.length ? maxPoints / gaps.length : 0;
  for (const gap of gaps) {
    const w = gap.points != null ? gap.points : fallbackWeight;
    const given = String(payload[gap.id] == null ? '' : payload[gap.id]).trim();
    let ok = false;
    if (gap.numeric) {
      const v = toNumber(given);
      ok = given !== '' && (gap.tolerance != null ? Math.abs(v - Number(gap.expected)) <= gap.tolerance : near(v, Number(gap.expected)));
    } else if (given !== '') {
      const accepts = (Array.isArray(gap.accept) && gap.accept.length) ? gap.accept : [gap.expected];
      ok = gap.contains ? hasAny(given, accepts) : accepts.some((a) => normalize(a) === normalize(given));
    }
    if (ok) { points += w; hits.push(`${gap.id}: correcto`); }
    else { misses.push(given ? `${gap.id}: esperado ${gap.expected}` : `${gap.id}: sin completar (esperado ${gap.expected})`); }
    itemResults.push({ itemId: gap.id, score01: ok ? 1 : 0, maxPoints: w });
  }
  return { points: clampPoints(points, maxPoints), hits, misses, critical: [], itemResults };
}

// COLOCAR MONTOS EN DEBE/HABER (registracion/asiento). Filas = cuentas, columnas Debe y Haber con el
// expected por celda (null = celda que debe quedar vacia). Puntua por CELDA + chequea que la suma del
// Debe = suma del Haber. Tolerante a notacion es-AR. Subject-agnostic (las cuentas viven en el contrato).
function gradeDebeHaber(answer, grading, maxPoints) {
  const rows = grading.rows || [];
  // answer acepta { rows:[{id,debit,credit}] } o plano { 'rowId.debit': monto }.
  const byId = {};
  if (answer && Array.isArray(answer.rows)) {
    answer.rows.forEach((r) => { if (r && r.id != null) byId[r.id] = r; });
  } else if (answer && typeof answer === 'object') {
    Object.keys(answer).forEach((k) => {
      const m = String(k).match(/^(.+?)[._](debit|credit)$/);
      if (m) { (byId[m[1]] = byId[m[1]] || { id: m[1] })[m[2]] = answer[k]; }
    });
  }
  const cellVal = (rid, side) => { const r = byId[rid]; return r ? r[side] : undefined; };
  const sideLabel = (s) => (s === 'debit' ? 'Debe' : 'Haber');
  const matches = (given, expected) => {
    const v = toNumber(given);
    return grading.tolerance != null ? Math.abs(v - Number(expected)) <= grading.tolerance : near(v, Number(expected));
  };

  const cells = [];
  for (const row of rows) {
    if (row.debit != null) cells.push({ rid: row.id, side: 'debit', account: row.account, expected: row.debit });
    if (row.credit != null) cells.push({ rid: row.id, side: 'credit', account: row.account, expected: row.credit });
  }
  const balanceWeight = grading.balanceWeight != null ? grading.balanceWeight : maxPoints * 0.1;
  const cellWeight = grading.cellWeight != null ? grading.cellWeight : (cells.length ? (maxPoints - balanceWeight) / cells.length : 0);

  const hits = [];
  const misses = [];
  let points = 0;

  for (const c of cells) {
    const given = cellVal(c.rid, c.side);
    if (given != null && String(given).trim() !== '' && matches(given, c.expected)) {
      points += cellWeight; hits.push(`${c.account} ${sideLabel(c.side)}: ${c.expected}`);
    } else {
      misses.push(`${c.account} ${sideLabel(c.side)}: esperado ${c.expected}`);
    }
  }
  // Monto en el lado que DEBE quedar vacio: se marca (y descuadra el balance).
  for (const row of rows) {
    ['debit', 'credit'].forEach((side) => {
      if (row[side] != null) return;
      const given = cellVal(row.id, side);
      if (given != null && String(given).trim() !== '' && toNumber(given) !== 0) {
        misses.push(`${row.account} ${sideLabel(side)}: no corresponde monto`);
      }
    });
  }
  // Balance: sumar Debe = sumar Haber (de lo que cargo el alumno).
  let sumD = 0, sumH = 0;
  for (const row of rows) { sumD += toNumber(cellVal(row.id, 'debit')); sumH += toNumber(cellVal(row.id, 'credit')); }
  if (near(sumD, sumH) && sumD > 0) { points += balanceWeight; hits.push(grading.balanceLabel || 'Debe = Haber'); }
  else { misses.push(grading.balanceMissLabel || 'El asiento no balancea'); }

  return { points: clampPoints(points, maxPoints), hits, misses, critical: [] };
}

const GRADERS = {
  text: gradeText,
  true_false_justified: gradeTrueFalseJustified,
  calculation: gradeCalculation,
  choice: gradeChoice,
  text_family: gradeTextFamily,
  multi: gradeMulti,
  cloze: gradeCloze,
  debe_haber: gradeDebeHaber,
  ledger_entry: gradeDebeHaber
};

/* ───────────────────────── engine ───────────────────────── */

function scoreAttempt({ subjectId, answers = {}, contract = null, mode = 'practice' }) {
  if (!contract || !Array.isArray(contract.blocks) || !contract.blocks.some((b) => b.grading)) {
    return {
      subjectId,
      total: 0,
      scoreTecnico: 0,
      notaEstimada: 0,
      status: 'unsupported_subject',
      estimatedStatus: 'unsupported_subject',
      blocks: {},
      weaknesses: [],
      nextMission: 'Crear rubrica (block.grading) en el contrato de la materia antes de corregir'
    };
  }

  const hard = mode === 'hard';
  // Modo duro: si el contrato tiene seccion `hard` (examen real multi-item), usarla.
  const activeBlocks = (hard && Array.isArray(contract.hard?.blocks)) ? contract.hard.blocks : contract.blocks;
  const variantPool = (hard && Array.isArray(contract.hard?.variants)) ? { variants: contract.hard.variants } : contract;
  const variant = findVariant(variantPool, answers.variantId);
  const assessment = contract.assessment || {};
  const pass = assessment.passPoints ?? DEFAULT_THRESHOLDS.pass;
  const promotion = assessment.promotionPoints ?? DEFAULT_THRESHOLDS.promotion;
  const margin = hard
    ? (assessment.hardSafetyMargin ?? CALIBRATION.hardSafetyMargin)
    : (assessment.safetyMargin ?? CALIBRATION.safetyMargin);
  // Umbral por bloque: en modo duro ningun bloque puede quedar < 1.5/2.
  const weakBlock = hard
    ? (assessment.hardWeakBlockPoints ?? CALIBRATION.hardWeakBlock)
    : (assessment.weakBlockPoints ?? DEFAULT_THRESHOLDS.weakBlock);

  const blocks = {};
  const order = [];

  for (const block of activeBlocks) {
    const baseGrading = block.grading;
    if (!baseGrading) continue;
    // Variante generada puede traer override de correccion para un bloque (ej: el calculo de
    // Contabilidad con un escenario nuevo). La clave del override la computa el backend, no Gemini.
    const override = variant && variant.gradingOverrides && variant.gradingOverrides[block.id];
    const grading = override ? { ...baseGrading, ...override } : baseGrading;
    const grader = GRADERS[grading.type];
    if (!grader) continue;

    const maxPoints = block.points ?? 2;
    const input = grading.input ?? block.id;
    const gctx = { variant, blockId: block.id, contract, hard };
    const result = grading.type === 'multi'
      ? gradeMulti(answers[input], { ...grading, items: itemsForBlock(variant, block.id) }, maxPoints, gctx)
      : grader(answers[input], grading, maxPoints, gctx);

    // #1 psicometria: si el grader no emite itemResults (text/text_family/choice/debe_haber),
    // el bloque cuenta como UN item con su score01 = points/maxPoints (granularidad de bloque).
    if (!Array.isArray(result.itemResults)) {
      result.itemResults = [{ itemId: block.id, score01: maxPoints > 0 ? Math.max(0, Math.min(1, (result.points || 0) / maxPoints)) : 0, maxPoints }];
    }

    blocks[block.id] = { label: block.label, ...result, maxPoints };
    order.push(block.id);
  }

  // Score TECNICO: dominio de contenido (lo que mide la rubrica).
  const total = round2(order.reduce((sum, id) => sum + (blocks[id]?.points || 0), 0));

  // NOTA ESTIMADA conservadora: score tecnico - margen de incertidumbre.
  const notaEstimada = Math.max(0, round2(total - margin));
  const allBlocksOk = order.every((id) => (blocks[id]?.points || 0) >= weakBlock);

  const weaknesses = order
    .filter((id) => (blocks[id]?.points || 0) < weakBlock)
    .map((id) => ({
      blockId: id,
      label: blocks[id].label,
      score: blocks[id].points,
      misses: (blocks[id].misses || []).slice(0, 4)
    }));

  // GAPS: TODO bloque que perdio puntos (tenga o no la marca de "debilidad" del umbral). Para que el
  // alumno vea y pueda recuperar CADA punto que dejo (ej un V/F en 1.5 que el umbral 1.35 ignoraba),
  // ordenados por cuanto se recupera. No reemplaza weaknesses (que sigue guiando misiones/SRS).
  const gaps = order
    .filter((id) => (blocks[id].misses || []).length > 0)
    .map((id) => {
      const mx = blocks[id].maxPoints != null ? blocks[id].maxPoints : 2;
      return {
        blockId: id,
        label: blocks[id].label,
        score: blocks[id].points,
        maxPoints: mx,
        pointsLost: round2(mx - (blocks[id].points || 0)),
        misses: (blocks[id].misses || []).slice(0, 6)
      };
    })
    .sort((a, b) => b.pointsLost - a.pointsLost);

  // Promocion SOLO si la nota conservadora promociona Y ningun bloque flojo.
  const estimatedStatus = (notaEstimada >= promotion && allBlocksOk)
    ? 'promotion_estimated'
    : notaEstimada >= pass ? 'pass_estimated' : 'risk';

  return {
    subjectId: contract.subject?.id || subjectId,
    variantId: variant?.id || null,
    mode,
    // score tecnico (no-regresion: identico al motor auditado)
    total,
    scoreTecnico: total,
    status: total >= promotion ? 'promotion_estimated' : total >= pass ? 'pass_estimated' : 'risk',
    // calibracion conservadora (auditoria 2026-06-08)
    notaEstimada,
    estimatedStatus,
    safetyMargin: margin,
    confidence: CALIBRATION.confidence,
    calibrationNote: 'Estimacion conservadora (score tecnico - margen). No es nota garantizada: falta calibracion contra parciales reales held-out.',
    blocks,
    weaknesses,
    gaps,
    pointsRecoverable: round2(gaps.reduce((s, g) => s + g.pointsLost, 0)),
    nextMission: weaknesses[0]
      ? `Reentrenar ${weaknesses[0].label}`
      : (estimatedStatus === 'promotion_estimated'
        ? 'Repetir simulacro cronometrado para confirmar promocion'
        : 'Consolidar bloques flojos antes del proximo simulacro')
  };
}

// Clave de correccion del Bloque C (liquidacion) computada DETERMINISTICAMENTE desde el escenario.
// Gemini propone {bruto, pctAportes, pctContrib}; esta funcion (backend) calcula los valores esperados.
// Misma formula auditada que el caso fijo 500000/17%/26% -> 85000/415000/130000/630000/asiento.
function computePayroll({ bruto, pctAportes, pctContrib }) {
  const b = Math.round(Number(bruto) || 0);
  const worker = Math.round(b * (Number(pctAportes) || 0) / 100);
  const employer = Math.round(b * (Number(pctContrib) || 0) / 100);
  const net = b - worker;
  const cost = b + employer;
  return {
    worker, net, employer, cost,
    debitWages: b,
    debitSocialCharges: employer,
    creditPayrollPayable: net,
    creditContributionsPayable: worker + employer
  };
}

module.exports = {
  scoreAttempt,
  computePayroll
};
