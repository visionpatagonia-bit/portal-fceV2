'use strict';

/*
 * exam-variant-service — variantes de examen generadas por Gemini, VALIDADAS contra las
 * reglas de cada materia antes de ofrecerse. Regla de oro: Gemini PROPONE preguntas (y, en
 * las de opcion, la clave); el grader determinista sigue siendo la unica autoridad de score.
 *
 * El validador es PURO (sin IO ni red): se puede testear solo. Una variante que no cumple el
 * esquema del contrato se rechaza y el server cae a una variante existente del contrato.
 *
 * Materia soportada para generacion: administracion (bloques matching/true_false/short_answer/
 * development/case). El esquema sale del propio contrato (exam-profile.variants).
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

const CHOICE_BLOCKS = ['matching', 'true_false', 'case'];
const TEXT_BLOCKS = ['short_answer', 'development'];
const slug = (v) => String(v || 'x').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'x';

// Bloques esperados = los que tiene la primera variante del contrato (orden y tipos).
function expectedBlockIds(contract) {
  const v = (contract && contract.variants && contract.variants[0]) || null;
  return v ? (v.blocks || []).map((b) => b.blockId) : [];
}

// Valida estructura de un item segun el tipo de bloque. Devuelve string de error o null.
function validateItem(blockId, item) {
  if (!item || typeof item !== 'object') return 'item ausente';
  const prompt = String(item.prompt || '').trim();
  if (prompt.length < 8) return 'prompt vacio o muy corto';
  if (CHOICE_BLOCKS.includes(blockId)) {
    const options = Array.isArray(item.options) ? item.options.filter((o) => String(o || '').trim()) : [];
    if (options.length < 2) return 'opciones insuficientes (min 2)';
    if (options.length > 6) return 'demasiadas opciones (max 6)';
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= options.length) return 'answer fuera de rango';
  }
  return null;
}

// Valida una variante completa contra el esquema del contrato. { ok, errors[], variant }.
function validateVariant(contract, variant) {
  const errors = [];
  if (!variant || typeof variant !== 'object') return { ok: false, errors: ['variante no es objeto'] };
  const wantBlocks = expectedBlockIds(contract);
  if (!wantBlocks.length) return { ok: false, errors: ['contrato sin variantes de referencia'] };

  const byId = {};
  (Array.isArray(variant.blocks) ? variant.blocks : []).forEach((b) => { if (b && b.blockId) byId[b.blockId] = b; });

  for (const blockId of wantBlocks) {
    const block = byId[blockId];
    if (!block) { errors.push(`falta bloque ${blockId}`); continue; }
    const items = Array.isArray(block.items) ? block.items : [];
    if (!items.length) { errors.push(`bloque ${blockId} sin items`); continue; }
    items.forEach((it, i) => {
      const e = validateItem(blockId, it);
      if (e) errors.push(`${blockId}[${i}]: ${e}`);
    });
  }
  return { ok: errors.length === 0, errors };
}

// Normaliza la variante validada a la forma exacta que consume el grader/front del contrato.
function normalizeVariant(contract, raw, { id, label } = {}) {
  const wantBlocks = expectedBlockIds(contract);
  const byId = {};
  (Array.isArray(raw.blocks) ? raw.blocks : []).forEach((b) => { if (b && b.blockId) byId[b.blockId] = b; });
  const blocks = wantBlocks.map((blockId) => {
    const src = byId[blockId] || {};
    const items = (Array.isArray(src.items) ? src.items : []).map((it, i) => {
      const base = { id: `${id}-${blockId}-${i}`, prompt: String(it.prompt || '').trim(), conceptFamily: it.conceptFamily || null, generated: true };
      if (CHOICE_BLOCKS.includes(blockId)) {
        base.options = (it.options || []).map((o) => String(o || '').trim()).filter(Boolean);
        base.answer = Number(it.answer);
      }
      return base;
    });
    return { blockId, items };
  });
  return {
    id: id || ('gen_' + Date.now().toString(36)),
    label: label || 'Variante IA (no auditada)',
    evidenceType: 'gemini_generated_validated',
    generated: true,
    blocks
  };
}

class ExamVariantService {
  constructor({ root } = {}) {
    this.dir = root ? path.join(root, 'data', 'runtime', 'generated-variants') : null;
  }

  _file(subjectId, id) { return path.join(this.dir, `${slug(subjectId)}__${slug(id)}.json`); }

  async save(subjectId, variant) {
    if (!this.dir) return variant;
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(this._file(subjectId, variant.id), JSON.stringify({ subjectId, variant, savedAt: new Date().toISOString() }, null, 2), 'utf8');
    } catch (_) {}
    return variant;
  }

  async getById(subjectId, id) {
    if (!this.dir) return null;
    const f = this._file(subjectId, id);
    if (!fsSync.existsSync(f)) return null;
    try { return JSON.parse(await fs.readFile(f, 'utf8')).variant; } catch (_) { return null; }
  }

  async list(subjectId, limit = 20) {
    if (!this.dir || !fsSync.existsSync(this.dir)) return [];
    try {
      const pre = `${slug(subjectId)}__`;
      const files = (await fs.readdir(this.dir)).filter((f) => f.startsWith(pre) && f.endsWith('.json'));
      const out = [];
      for (const f of files.slice(0, limit)) {
        try { out.push(JSON.parse(await fs.readFile(path.join(this.dir, f), 'utf8')).variant); } catch (_) {}
      }
      return out;
    } catch (_) { return []; }
  }
}

module.exports = { ExamVariantService, validateVariant, normalizeVariant, expectedBlockIds, CHOICE_BLOCKS, TEXT_BLOCKS };
