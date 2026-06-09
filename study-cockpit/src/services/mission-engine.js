'use strict';

const BLOCK_CODE_TO_CONTRACT_ID = {
  A: 'written_definition',
  B: 'true_false_justified',
  C: 'calculation_entry',
  D: 'technical_development',
  E: 'integrated_case'
};

const DEFAULT_THRESHOLDS = {
  weakBlock: 1.35,
  pass: 6,
  promotion: 8
};

function blockCodeForContractId(blockId) {
  return Object.entries(BLOCK_CODE_TO_CONTRACT_ID).find(([, value]) => value === blockId)?.[0] || blockId;
}

function missionId(subjectId, purpose, blockId = 'general') {
  return `${subjectId}:${purpose}:${blockId}`.replace(/[^a-z0-9:_-]/gi, '_');
}

class MissionEngine {
  constructor({ telemetry }) {
    this.telemetry = telemetry;
  }

  async getNextMission({ subjectId, sessionId, contract }) {
    const latestScore = await this.telemetry.latestEvent({
      subjectId,
      sessionId,
      type: 'attempt_scored'
    });

    return this.fromScore({
      subjectId,
      contract,
      scoreResult: latestScore?.payload?.result || null
    });
  }

  fromScore({ subjectId, contract, scoreResult }) {
    const pass = contract?.assessment?.passPoints || DEFAULT_THRESHOLDS.pass;
    const promotion = contract?.assessment?.promotionPoints || DEFAULT_THRESHOLDS.promotion;
    const blocks = contract?.blocks || [];

    if (!scoreResult) {
      const firstBlock = blocks[0] || { id: 'diagnostic', label: 'Diagnostico inicial', points: 2 };
      return {
        missionId: missionId(subjectId, 'diagnostic', firstBlock.id),
        subjectId,
        purpose: 'diagnostic',
        blockId: firstBlock.id,
        blockCode: blockCodeForContractId(firstBlock.id),
        title: `Primer intento: ${firstBlock.label}`,
        rationale: 'Sin evidencia previa. El sistema necesita una respuesta inicial para detectar huecos.',
        target: {
          minimumScore: pass,
          promotionScore: promotion,
          blockScore: 1.35
        },
        actions: ['resolver_intento', 'corregir', 'registrar_debilidad'],
        estimatedMinutes: 12,
        source: 'deterministic'
      };
    }

    const weakness = (scoreResult.weaknesses || [])[0];
    if (weakness) {
      const contractBlockId = BLOCK_CODE_TO_CONTRACT_ID[weakness.blockId] || weakness.blockId;
      const contractBlock = blocks.find((block) => block.id === contractBlockId);
      return {
        missionId: missionId(subjectId, 'weakness', contractBlockId),
        subjectId,
        purpose: 'weakness_retraining',
        blockId: contractBlockId,
        blockCode: weakness.blockId,
        title: `Reentrenar ${weakness.label}`,
        rationale: `Bloque en ${weakness.score.toFixed(2)}/2. Recuperar este bloque sube la probabilidad de aprobacion.`,
        target: {
          minimumBlockScore: DEFAULT_THRESHOLDS.weakBlock,
          expectedGain: 1
        },
        misses: weakness.misses || [],
        actions: ['repasar_criterio', 'rehacer_bloque', 'comparar_misses'],
        estimatedMinutes: contractBlock?.kind === 'development' ? 18 : 10,
        source: 'deterministic'
      };
    }

    if (scoreResult.total >= promotion) {
      return {
        missionId: missionId(subjectId, 'simulation', 'full'),
        subjectId,
        purpose: 'full_simulation',
        blockId: 'full_exam',
        blockCode: 'ALL',
        title: 'Simulacro completo con variante nueva',
        rationale: 'El ultimo intento esta en zona de promocion. La siguiente evidencia debe probar estabilidad.',
        target: {
          minimumScore: promotion,
          calibrationReady: true
        },
        actions: ['resolver_simulacro', 'autopredecir_nota', 'comparar_resultado'],
        estimatedMinutes: 45,
        source: 'deterministic'
      };
    }

    return {
      missionId: missionId(subjectId, 'consolidation', 'pass_line'),
      subjectId,
      purpose: 'pass_line_consolidation',
      blockId: 'mixed',
      blockCode: 'MIX',
      title: 'Consolidar zona de aprobacion',
      rationale: `Score ${scoreResult.total.toFixed(2)}. El foco es sostener todos los bloques por encima de 1.35/2.`,
      target: {
        minimumScore: pass,
        promotionScore: promotion
      },
      actions: ['resolver_bloques_mixtos', 'revisar_misses', 'nuevo_intento'],
      estimatedMinutes: 25,
      source: 'deterministic'
    };
  }
}

module.exports = {
  MissionEngine
};
