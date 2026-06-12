'use strict';

const crypto = require('crypto');
const { scoreAttempt } = require('../scoring');

function makeAttemptId() {
  return `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

class AttemptService {
  constructor({ contractService, telemetry, missionEngine }) {
    this.contractService = contractService;
    this.telemetry = telemetry;
    this.missionEngine = missionEngine;
  }

  async startAttempt({ subjectId, sessionId = 'local-demo', variantId = null }) {
    const resolved = await this.contractService.resolveSubject(subjectId);
    if (!resolved) {
      return { ok: false, error: 'unknown_subject' };
    }

    const { subject, contract } = resolved;
    const attemptId = makeAttemptId();
    const selectedVariant = variantId
      ? (contract.variants || []).find((variant) => variant.id === variantId)
      : (contract.variants || [])[0];

    const attempt = {
      attemptId,
      subjectId: subject.id,
      sessionId,
      variantId: selectedVariant?.id || null,
      mode: selectedVariant?.evidenceType || 'contract',
      contract: this.contractService.summarizeContract(contract),
      blocks: selectedVariant?.blocks || contract.blocks || []
    };

    const event = await this.telemetry.appendEvent({
      type: 'attempt_started',
      subjectId: subject.id,
      sessionId,
      attemptId,
      actor: 'student',
      payload: {
        variantId: attempt.variantId,
        mode: attempt.mode
      }
    });

    return { ok: true, attempt, event };
  }

  async score({ subjectId, sessionId = 'local-demo', attemptId = null, answers = {}, mode = 'practice', extraVariant = null, onlyBlocks = null }) {
    const resolved = await this.contractService.resolveSubject(subjectId);
    const resolvedSubjectId = resolved?.subject?.id || subjectId;
    // Variante generada por IA (gen_*): se inyecta en el contrato para que el grader determinista
    // la corrija como una variante mas. El grader sigue siendo la unica autoridad de score.
    const contract = (extraVariant && resolved?.contract)
      ? { ...resolved.contract, variants: [...(resolved.contract.variants || []), extraVariant] }
      : (resolved?.contract || null);

    const answerEvent = await this.telemetry.appendEvent({
      type: 'answer_submitted',
      subjectId: resolvedSubjectId,
      sessionId,
      attemptId,
      actor: 'student',
      payload: {
        answerKeys: Object.keys(answers || {}),
        answerSize: JSON.stringify(answers || {}).length
      }
    });

    const result = scoreAttempt({ subjectId: resolvedSubjectId, answers, contract, mode, onlyBlocks });
    const scoreEvent = await this.telemetry.appendEvent({
      type: 'attempt_scored',
      subjectId: resolvedSubjectId,
      sessionId,
      attemptId,
      actor: 'system',
      payload: {
        deterministic: true,
        llmUsed: false,
        total: result.total,
        status: result.status,
        weaknesses: result.weaknesses,
        result
      }
    });

    const mission = contract
      ? this.missionEngine.fromScore({
        subjectId: resolvedSubjectId,
        contract,
        scoreResult: result
      })
      : null;

    const missionEvent = mission
      ? await this.telemetry.appendEvent({
        type: 'mission_recommended',
        subjectId: resolvedSubjectId,
        sessionId,
        attemptId,
        actor: 'system',
        payload: { mission }
      })
      : null;

    return {
      result,
      nextMission: mission,
      events: {
        answerSubmitted: answerEvent,
        attemptScored: scoreEvent,
        missionRecommended: missionEvent
      }
    };
  }
}

module.exports = {
  AttemptService
};
