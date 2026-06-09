'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class TelemetryService {
  constructor({ root }) {
    this.runtimeDir = path.join(root, 'data', 'runtime');
    this.eventsFile = path.join(this.runtimeDir, 'events.jsonl');
  }

  async ensureReady() {
    await fs.mkdir(this.runtimeDir, { recursive: true });
  }

  async appendEvent(event) {
    await this.ensureReady();
    const stored = {
      eventId: event.eventId || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      type: event.type || 'unknown',
      subjectId: event.subjectId || null,
      sessionId: event.sessionId || 'local-demo',
      attemptId: event.attemptId || null,
      actor: event.actor || 'system',
      payload: event.payload || {},
      createdAt: event.createdAt || new Date().toISOString()
    };

    await fs.appendFile(this.eventsFile, `${JSON.stringify(stored)}\n`, 'utf8');
    return stored;
  }

  async readEvents({ limit = 80, subjectId, sessionId, type, attemptId } = {}) {
    if (!fsSync.existsSync(this.eventsFile)) return [];
    const lines = (await fs.readFile(this.eventsFile, 'utf8'))
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    const events = lines
      .map((line) => JSON.parse(line))
      .filter((event) => !subjectId || event.subjectId === subjectId)
      .filter((event) => !sessionId || event.sessionId === sessionId)
      .filter((event) => !type || event.type === type)
      .filter((event) => !attemptId || event.attemptId === attemptId);

    return events.slice(-limit);
  }

  async latestEvent({ subjectId, sessionId, type }) {
    const events = await this.readEvents({ limit: 500, subjectId, sessionId, type });
    return events.at(-1) || null;
  }
}

module.exports = {
  TelemetryService
};
