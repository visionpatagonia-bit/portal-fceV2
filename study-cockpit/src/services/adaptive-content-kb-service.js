'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function slug(value) {
  return String(value || 'unknown')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

function cleanText(value, max = 220) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function normalizeMisses(value) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item, 180).toLowerCase()).filter(Boolean).sort()
    : [];
}

class AdaptiveContentKbService {
  constructor({ root }) {
    this.root = root;
    this.kbDir = path.join(root, 'data', 'kb', 'adaptive-content');
    this.entriesDir = path.join(this.kbDir, 'entries');
    this.indexFile = path.join(this.kbDir, 'index.json');
  }

  async ensureReady() {
    await fs.mkdir(this.entriesDir, { recursive: true });
    if (!fsSync.existsSync(this.indexFile)) {
      await fs.writeFile(this.indexFile, JSON.stringify({
        schemaVersion: '1.0.0',
        kind: 'adaptive_content_kb',
        entries: []
      }, null, 2), 'utf8');
    }
  }

  async readIndex() {
    await this.ensureReady();
    return JSON.parse(await fs.readFile(this.indexFile, 'utf8'));
  }

  async writeIndex(index) {
    await this.ensureReady();
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf8');
  }

  fingerprint({ subjectId, blockId, mode, targetMisses }) {
    const payload = {
      subjectId: slug(subjectId),
      blockId: slug(blockId),
      mode: slug(mode || 'retrain'),
      targetMisses: normalizeMisses(targetMisses)
    };
    return crypto.createHash('sha256').update(stableJson(payload)).digest('hex').slice(0, 20);
  }

  entryPath(entryId) {
    return path.join(this.entriesDir, `${entryId}.json`);
  }

  async findReusable({ subjectId, blockId, mode, targetMisses }) {
    const index = await this.readIndex();
    const fingerprint = this.fingerprint({ subjectId, blockId, mode, targetMisses });
    const entry = index.entries.find((item) => item.fingerprint === fingerprint);
    if (!entry) return null;

    await this.touch(entry.entryId);
    const full = await this.get(entry.entryId);
    if (!full) return null;

    return {
      ...full,
      reuse: {
        reused: true,
        fingerprint,
        matchedBy: 'exact_pedagogic_fingerprint'
      }
    };
  }

  async touch(entryId) {
    const index = await this.readIndex();
    const now = new Date().toISOString();
    const entry = index.entries.find((item) => item.entryId === entryId);
    if (!entry) return null;

    entry.reuseCount = Number(entry.reuseCount || 0) + 1;
    entry.lastUsedAt = now;
    await this.writeIndex(index);

    const full = await this.get(entryId);
    if (full) {
      full.reuseCount = entry.reuseCount;
      full.lastUsedAt = now;
      await fs.writeFile(this.entryPath(entryId), JSON.stringify(full, null, 2), 'utf8');
    }
    return entry;
  }

  async save({ subjectId, blockId, mode, targetMisses, generated, studyBlock }) {
    if (!generated?.content) return null;

    await this.ensureReady();
    const now = new Date().toISOString();
    const fingerprint = this.fingerprint({ subjectId, blockId, mode, targetMisses });
    const index = await this.readIndex();
    const existing = index.entries.find((item) => item.fingerprint === fingerprint);
    const entryId = existing?.entryId || `akc_${slug(subjectId)}_${slug(blockId)}_${fingerprint}`;

    const record = {
      schemaVersion: '1.0.0',
      entryId,
      fingerprint,
      subjectId,
      blockId,
      blockLabel: studyBlock?.label || null,
      mode: mode || 'retrain',
      targetMisses: normalizeMisses(targetMisses),
      content: generated.content,
      source: {
        provider: generated.provider || null,
        status: generated.status || null,
        model: generated.model || null,
        llmUsed: Boolean(generated.content?.audit?.llm_used),
        finalScoreAuthority: generated.content?.audit?.final_score_authority || 'deterministic_core'
      },
      quality: {
        reviewStatus: generated.provider === 'gemini' ? 'generated_unreviewed' : 'deterministic_fallback',
        reusable: true,
        canonical: false,
        requiredBeforeCanonical: ['subject_matter_review', 'exam_contract_alignment']
      },
      audit: {
        storedAsReusableKnowledge: true,
        excludesStudentAnswer: true,
        excludesApiKey: true,
        derivedFromBlockContract: studyBlock?.id || blockId,
        reusePolicy: 'exact_pedagogic_fingerprint'
      },
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      lastUsedAt: now,
      reuseCount: existing?.reuseCount || 0
    };

    await fs.writeFile(this.entryPath(entryId), JSON.stringify(record, null, 2), 'utf8');

    const summary = {
      entryId,
      fingerprint,
      subjectId,
      blockId,
      blockLabel: record.blockLabel,
      mode: record.mode,
      targetMisses: record.targetMisses,
      title: record.content.lesson_title,
      provider: record.source.provider,
      status: record.source.status,
      model: record.source.model,
      llmUsed: record.source.llmUsed,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastUsedAt: record.lastUsedAt,
      reuseCount: record.reuseCount
    };

    if (existing) {
      Object.assign(existing, summary);
    } else {
      index.entries.push(summary);
    }
    index.entries.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    await this.writeIndex(index);
    return record;
  }

  async get(entryId) {
    await this.ensureReady();
    const filePath = this.entryPath(entryId);
    if (!fsSync.existsSync(filePath)) return null;
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  }

  async list({ subjectId, blockId, mode, limit = 50 } = {}) {
    const index = await this.readIndex();
    return index.entries
      .filter((entry) => !subjectId || entry.subjectId === subjectId)
      .filter((entry) => !blockId || entry.blockId === blockId)
      .filter((entry) => !mode || entry.mode === mode)
      .slice(0, Number(limit) || 50);
  }
}

module.exports = {
  AdaptiveContentKbService
};
