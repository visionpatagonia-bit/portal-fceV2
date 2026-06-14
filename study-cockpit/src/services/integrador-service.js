'use strict';

/*
 * integrador-service — ensambla un EXAMEN INTEGRADOR generico (subject-agnostic) fusionando bloques de
 * uno o varios contratos (companions) en un CONTRATO SINTETICO in-memory que el motor determinista
 * (scoring.js, la unica autoridad de nota) corrige en UNA pasada, SIN tocar el juez.
 *
 * Reglas de oro respetadas:
 *  - Clona TODO (JSON.parse(JSON.stringify)): nunca muta el contrato cacheado (si no, rompe 8.64).
 *  - Namespacing CONSISTENTE por source: block.id, grading.input, variant.blocks[].blockId,
 *    variant.gradingOverrides keys, gradingFamilies keys + item.conceptFamily, bugLibrary bug.blockId.
 *    NO se namespacean ids internos (gap.id, row.id, field.id, item.id): van prefijados por block.id.
 *  - Escala block.points Y los sub-pesos ABSOLUTOS por el mismo factor para que la suma sea EXACTA 10.
 *  - Guarda block.source { subjectId, folder, blockId } para cerrar el loop de repaso en la materia real.
 *
 * Config opcional en el contrato base (exam-profile.json):
 *   "integrador": { "enabled": true, "label": "...", "blocks": ["id",...],
 *                   "companions": [ { "subjectId": "...", "blocks": ["id",...] } ], "targetTotal": 10 }
 * Si falta: default = TODOS los bloques calificables de la propia materia, sin companions.
 */

const { validateContract } = require('./contract-validator');

function round2(v) { return Math.round(v * 100) / 100; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

// Escala los sub-pesos ABSOLUTOS de un grading por `factor` (los que se SUMAN y clampean a maxPoints).
// choice/multi reparten maxPoints/n internamente -> escalan solos con block.points (no se tocan aca).
function scaleGrading(g, factor) {
  if (!g) return g;
  if (Array.isArray(g.criteria)) g.criteria.forEach((c) => { if (c.points != null) c.points = round2(c.points * factor); });
  if (g.criticalPenalty != null) g.criticalPenalty = round2(g.criticalPenalty * factor);
  if (Array.isArray(g.fields)) g.fields.forEach((f) => { if (f.weight != null) f.weight = round2(f.weight * factor); });
  if (g.balance && g.balance.weight != null) g.balance.weight = round2(g.balance.weight * factor);
  if (g.optionPoints != null) g.optionPoints = round2(g.optionPoints * factor);
  if (g.justPoints != null) g.justPoints = round2(g.justPoints * factor);
  if (Array.isArray(g.gaps)) g.gaps.forEach((gp) => { if (gp.points != null) gp.points = round2(gp.points * factor); });
  if (g.balanceWeight != null) g.balanceWeight = round2(g.balanceWeight * factor);
  if (g.cellWeight != null) g.cellWeight = round2(g.cellWeight * factor);
  if (g.perHit != null) g.perHit = round2(g.perHit * factor);
  return g;
}

async function buildMergedContract({ contractService, subjectId }) {
  const baseResolved = await contractService.resolveSubject(subjectId);
  if (!baseResolved || !baseResolved.contract) throw new Error('subject_not_found:' + subjectId);
  const cfg = baseResolved.contract.integrador || {};

  // Lista de sources: base + companions (default: solo base).
  const sources = [{ subjectId: baseResolved.subject.id, folder: baseResolved.subject.folder, blocks: cfg.blocks || null, resolved: baseResolved }];
  for (const c of (cfg.companions || [])) {
    const r = await contractService.resolveSubject(c.subjectId);
    if (!r || !r.contract) throw new Error('companion_not_found:' + c.subjectId);
    sources.push({ subjectId: r.subject.id, folder: r.subject.folder, blocks: c.blocks || null, resolved: r });
  }

  const mergedBlocks = [];
  const mergedVariantBlocks = [];
  const mergedOverrides = {};
  const mergedFamilies = {};
  const mergedBugs = [];
  const blockMeta = {};
  let rawTotal = 0;

  for (const spec of sources) {
    const src = clone(spec.resolved.contract); // deep clone: nunca mutar el cache
    const sid = spec.subjectId;
    const variant0 = (src.variants && src.variants[0]) || null;
    const calif = (src.blocks || []).filter((b) => b.grading && b.grading.type);
    const chosen = spec.blocks ? calif.filter((b) => spec.blocks.includes(b.id)) : calif;
    if (!chosen.length) throw new Error('no_blocks_for_source:' + sid);
    const srcFamilies = src.gradingFamilies || {};

    for (const b of chosen) {
      const nsId = `${sid}__${b.id}`;
      const nb = clone(b);
      nb.id = nsId;
      nb.grading.input = nsId; // SIEMPRE namespacear input (evita colision de answers entre sources)
      nb.source = { subjectId: sid, folder: spec.folder, blockId: b.id, label: b.label || b.id };

      const vb = variant0 && (variant0.blocks || []).find((x) => x.blockId === b.id);
      const items = vb ? clone(vb.items || []) : [];
      items.forEach((it) => {
        if (it.conceptFamily) {
          const nsFam = `${sid}__${it.conceptFamily}`;
          if (srcFamilies[it.conceptFamily]) mergedFamilies[nsFam] = srcFamilies[it.conceptFamily];
          it.conceptFamily = nsFam;
        }
      });

      if (variant0 && variant0.gradingOverrides && variant0.gradingOverrides[b.id]) {
        mergedOverrides[nsId] = clone(variant0.gradingOverrides[b.id]);
      }

      mergedBlocks.push(nb);
      mergedVariantBlocks.push({ blockId: nsId, items });
      blockMeta[nsId] = { sourceSubjectId: sid, sourceFolder: spec.folder, originalBlockId: b.id, originalLabel: b.label || b.id };
      rawTotal += (b.points != null ? b.points : 2);
    }

    for (const bug of (src.bugLibrary || [])) {
      if (!spec.blocks || spec.blocks.includes(bug.blockId)) {
        const nb = clone(bug);
        nb.blockId = `${sid}__${bug.blockId}`;
        mergedBugs.push(nb);
      }
    }
  }

  // Escalado a la suma objetivo (10), con correccion de redondeo (largest-remainder en el bloque ancla).
  const target = cfg.targetTotal != null ? cfg.targetTotal : 10;
  const factor = rawTotal > 0 ? target / rawTotal : 1;
  let acc = 0;
  mergedBlocks.forEach((b) => {
    const orig = (b.points != null ? b.points : 2);
    b.points = round2(orig * factor);
    scaleGrading(b.grading, factor);
    acc += b.points;
  });
  const drift = round2(target - acc);
  if (Math.abs(drift) >= 0.01 && mergedBlocks.length) {
    const anchor = mergedBlocks.reduce((m, b) => (b.points > m.points ? b : m), mergedBlocks[0]);
    anchor.points = round2(anchor.points + drift);
  }
  // Los gradingOverrides namespaced TAMBIEN deben escalar sus sub-pesos absolutos por el mismo factor:
  // el override reemplaza los arrays del grading base, asi que sin escalar corregiria a la escala
  // ORIGINAL del source dentro de un bloque cuyo maxPoints ya fue escalado (distorsiona la nota parcial).
  Object.values(mergedOverrides).forEach((ov) => scaleGrading(ov, factor));

  const numBlocks = mergedBlocks.length;
  const weakBlockPoints = round2(0.6 * (target / numBlocks)); // relativo: 60% del peso "justo" por bloque

  const mergedVariant = { id: 'INT', label: cfg.label || 'Examen integrador', evidenceType: 'integrador', blocks: mergedVariantBlocks };
  if (Object.keys(mergedOverrides).length) mergedVariant.gradingOverrides = mergedOverrides;

  const baseName = baseResolved.contract.subject && baseResolved.contract.subject.name;
  const merged = {
    schemaVersion: '1.0.0',
    subject: {
      id: `integrador__${subjectId}`,
      name: cfg.label || `Examen integrador · ${baseName || subjectId}`,
      accentColor: (baseResolved.contract.subject && baseResolved.contract.subject.accentColor) || '#58a6ff'
    },
    assessment: {
      name: cfg.label || 'Examen integrador',
      totalPoints: target,
      passPoints: round2(target * 0.6),
      promotionPoints: round2(target * 0.8),
      weakBlockPoints,
      safetyMargin: 0.85
    },
    gradingFamilies: mergedFamilies,
    blocks: mergedBlocks,
    variants: [mergedVariant],
    bugLibrary: mergedBugs,
    integrador: { sources: sources.map((s) => ({ subjectId: s.subjectId, folder: s.folder })) },
    _blockMeta: blockMeta
  };

  const v = validateContract(merged, { subjectId: merged.subject.id });
  if (!v.ok) throw new Error('merged_invalid: ' + v.errors.join('; '));

  return { contract: merged, blockMeta, sources: merged.integrador.sources };
}

// Des-namespacea result.blocks de un intento integrador en sub-results por source (para learner-model
// por materia real). Devuelve { [sourceSubjectId]: { blocks: { [originalBlockId]: blockResult } } }.
function splitResultBySource(result, blockMeta) {
  const out = {};
  for (const [nsId, blk] of Object.entries(result.blocks || {})) {
    const meta = blockMeta[nsId] || null;
    const sid = meta ? meta.sourceSubjectId : (nsId.includes('__') ? nsId.split('__')[0] : nsId);
    const oid = meta ? meta.originalBlockId : (nsId.includes('__') ? nsId.split('__').slice(1).join('__') : nsId);
    (out[sid] = out[sid] || { blocks: {} }).blocks[oid] = blk;
  }
  return out;
}

module.exports = { buildMergedContract, splitResultBySource, scaleGrading };
