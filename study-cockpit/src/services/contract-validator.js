'use strict';

/*
 * contract-validator — valida ESTRUCTURALMENTE un exam-profile (contract) por TIPO de bloque.
 * Sirve para escalar a muchas materias sin romper: una materia mal armada se detecta temprano
 * (errores claros) en vez de puntuar 0 en silencio. Puro y determinista; no toca la nota.
 *
 * Cubre los footguns reales: grading.type sin corrector, claves/campos faltantes por tipo,
 * y la consistencia cloze (los gaps deben aparecer como {{gapId}} en el prompt de la variante).
 */

const KNOWN_TYPES = ['text', 'true_false_justified', 'calculation', 'choice', 'text_family', 'multi', 'cloze', 'debe_haber', 'ledger_entry'];

function validateContract(contract, { subjectId = '?' } = {}) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(`${subjectId}: ${m}`);
  const W = (m) => warnings.push(`${subjectId}: ${m}`);

  if (!contract || typeof contract !== 'object') return { ok: false, errors: [`${subjectId}: contract no es un objeto`], warnings: [] };
  const a = contract.assessment || {};
  if (a.passPoints == null || a.promotionPoints == null) W('assessment sin passPoints/promotionPoints (se usan defaults 6/8)');

  const sections = [{ key: 'blocks', blocks: contract.blocks, variants: contract.variants }];
  if (contract.hard) sections.push({ key: 'hard', blocks: contract.hard.blocks, variants: contract.hard.variants });

  for (const sec of sections) {
    const blocks = sec.blocks || [];
    const variants = sec.variants || [];
    if (!blocks.length) { E(`[${sec.key}] sin blocks`); continue; }
    if (!variants.length) W(`[${sec.key}] sin variants (choice/text_family/cloze/multi necesitan items de variante)`);
    const firstVariant = variants[0] || null;
    const itemFor = (blockId) => {
      const vb = firstVariant && (firstVariant.blocks || []).find((x) => x.blockId === blockId);
      return (vb && vb.items && vb.items[0]) || null;
    };

    for (const b of blocks) {
      const tag = `[${sec.key}] bloque ${b.id || '(sin id)'}`;
      if (!b.id) E(`${tag}: falta id`);
      if (b.points == null) W(`${tag}: sin points (se usa 2)`);
      if (!b.grading || !b.grading.type) { E(`${tag}: falta grading.type`); continue; }
      const g = b.grading;
      if (KNOWN_TYPES.indexOf(g.type) < 0) { E(`${tag}: grading.type '${g.type}' no tiene corrector (tipos validos: ${KNOWN_TYPES.join(', ')})`); continue; }
      const item = itemFor(b.id);

      if (g.type === 'text') {
        if (!Array.isArray(g.criteria) || !g.criteria.length) E(`${tag}: text sin grading.criteria`);
        else g.criteria.forEach((c, i) => { if (!Array.isArray(c.terms) || c.points == null) E(`${tag}: criteria[${i}] sin terms[] o points`); });
      } else if (g.type === 'true_false_justified') {
        if (!Array.isArray(g.items) || !g.items.length) E(`${tag}: true_false_justified sin grading.items`);
        else g.items.forEach((it, i) => { if (!it.id || !it.expected) E(`${tag}: items[${i}] sin id/expected`); });
      } else if (g.type === 'calculation') {
        if (!Array.isArray(g.fields) || !g.fields.length) E(`${tag}: calculation sin grading.fields`);
        else g.fields.forEach((f, i) => { if (!f.key || f.expected == null || f.weight == null) E(`${tag}: fields[${i}] sin key/expected/weight`); });
      } else if (g.type === 'text_family') {
        if (!item || !item.conceptFamily) W(`${tag}: text_family sin conceptFamily en la variante (puntua por fallback de longitud)`);
        else if (!(contract.gradingFamilies || {})[item.conceptFamily]) W(`${tag}: conceptFamily '${item.conceptFamily}' no esta en contract.gradingFamilies`);
      } else if (g.type === 'choice') {
        if (!item) E(`${tag}: choice sin item de variante (no hay clave)`);
        else { if (!Array.isArray(item.options) || !item.options.length) E(`${tag}: choice item sin options[]`); if (typeof item.answer !== 'number') E(`${tag}: choice item sin answer (indice numerico de la opcion correcta)`); }
      } else if (g.type === 'cloze') {
        if (!Array.isArray(g.gaps) || !g.gaps.length) { E(`${tag}: cloze sin grading.gaps`); }
        else {
          const gapIds = g.gaps.map((x) => x.id).filter(Boolean);
          g.gaps.forEach((gp, i) => {
            if (!gp.id) E(`${tag}: gaps[${i}] sin id`);
            const hasOpts = Array.isArray(gp.options) && gp.options.length;
            if (gp.expected == null && !hasOpts) E(`${tag}: gap ${gp.id || i} sin expected ni options`);
            if (hasOpts && gp.expected != null && gp.options.indexOf(gp.expected) < 0) W(`${tag}: gap ${gp.id} expected no esta entre sus options`);
          });
          const prompt = (item && item.prompt) || '';
          if (!item) E(`${tag}: cloze sin prompt de variante (no se renderizan los huecos)`);
          const markers = (prompt.match(/\{\{(\w+)\}\}/g) || []).map((m) => m.slice(2, -2));
          const markerSet = new Set(markers);
          gapIds.forEach((id) => { if (!markerSet.has(id)) E(`${tag}: el gap ${id} no aparece como {{${id}}} en el prompt`); });
          markers.forEach((m) => { if (gapIds.indexOf(m) < 0) E(`${tag}: el prompt usa {{${m}}} pero no hay un gap con id ${m}`); });
        }
      } else if (g.type === 'debe_haber' || g.type === 'ledger_entry') {
        if (!Array.isArray(g.rows) || !g.rows.length) E(`${tag}: debe_haber sin grading.rows`);
        else g.rows.forEach((r, i) => {
          if (!r.id) E(`${tag}: rows[${i}] sin id`);
          if (!r.account) W(`${tag}: rows[${r.id || i}] sin account (label visible)`);
          if (r.debit == null && r.credit == null) E(`${tag}: rows[${r.id || i}] sin debit ni credit esperado (al menos uno)`);
        });
      } else if (g.type === 'multi') {
        if (!item) W(`${tag}: multi sin items de variante`);
      }
    }
    variants.forEach((v, i) => { if (!v.id) E(`[${sec.key}] variants[${i}] sin id`); });
  }

  return { ok: errors.length === 0, errors, warnings };
}

module.exports = { validateContract, KNOWN_TYPES };
