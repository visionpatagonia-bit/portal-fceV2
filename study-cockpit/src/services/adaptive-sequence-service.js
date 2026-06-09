'use strict';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

class AdaptiveSequenceService {
  constructor({ studyContentService }) {
    this.studyContentService = studyContentService;
  }

  resolveBlockFromWeakness(plan, weakness) {
    if (!weakness) return null;
    return plan.blocks.find((block) => (
      block.id === weakness.blockId ||
      block.code === weakness.blockId
    )) || null;
  }

  chooseTargetBlock(plan, { blockId, deterministicResult }) {
    const firstWeakness = asArray(deterministicResult?.weaknesses)[0] || null;
    const weaknessBlock = this.resolveBlockFromWeakness(plan, firstWeakness);
    if (weaknessBlock) {
      return {
        block: weaknessBlock,
        reason: 'weakness_priority',
        weakness: firstWeakness
      };
    }

    const requested = blockId
      ? plan.blocks.find((block) => block.id === blockId || block.code === blockId)
      : null;
    if (requested) {
      return {
        block: requested,
        reason: 'selected_by_student',
        weakness: null
      };
    }

    const critical = plan.blocks.find((block) => block.priority === 'critical') || plan.blocks[0];
    return {
      block: critical,
      reason: 'exam_weight_priority',
      weakness: null
    };
  }

  currentStepFor({ deterministicResult, target }) {
    if (!deterministicResult) return 'minimum_viable_knowledge';
    if (target.weakness) return 'adaptive_retrain';
    if (deterministicResult.total >= 8) return 'simulation_variant';
    return 'exam_application';
  }

  buildSteps({ target, deterministicResult }) {
    const score = deterministicResult?.total ?? null;
    const misses = asArray(target.weakness?.misses);

    return [
      {
        id: 'exam_map',
        label: 'Mapa del parcial',
        panel: 'contract',
        knowledgeLayer: 'orientacion',
        source: 'exam_contract',
        purpose: 'Ver que entra, cuanto pesa y que evidencia pide cada bloque.',
        adaptationRule: 'Ordena la atencion por peso de examen y debilidad detectada.',
        studentAction: 'Mirar el contrato antes de estudiar para no repasar de mas.'
      },
      {
        id: 'minimum_viable_knowledge',
        label: 'Minimo defendible',
        panel: 'study',
        blockId: target.block.id,
        knowledgeLayer: 'concepto_base',
        source: 'study_map',
        purpose: `Dominar ${target.block.label} con definicion, criterio y ejemplo.`,
        adaptationRule: misses.length
          ? 'Reduce ruido y muestra primero el concepto que fallo.'
          : 'Presenta el bloque por prioridad de examen.',
        studentAction: 'Leer teoria minima y errores que bajan puntos.'
      },
      {
        id: 'active_recall',
        label: 'Recall activo',
        panel: 'study',
        blockId: target.block.id,
        knowledgeLayer: 'recuperacion',
        source: 'study_map_plus_gemini',
        purpose: 'Convertir lectura en respuesta escrita recuperable bajo presion.',
        adaptationRule: 'Gemini genera preguntas nuevas, pero ancladas al bloque auditado.',
        studentAction: 'Responder sin mirar y comparar contra respuesta esperada.'
      },
      {
        id: 'exam_application',
        label: 'Aplicacion de examen',
        panel: 'attempt',
        blockId: target.block.id,
        knowledgeLayer: 'transferencia',
        source: 'deterministic_attempt_contract',
        purpose: 'Resolver como parcial: definicion, V/F, calculo, desarrollo o caso.',
        adaptationRule: score === null
          ? 'Primer intento para medir linea base.'
          : 'El proximo intento prioriza el bloque con mayor perdida de puntos.',
        studentAction: 'Hacer intento con calculo y justificacion.'
      },
      {
        id: 'deterministic_feedback',
        label: 'Correccion',
        panel: 'feedback',
        knowledgeLayer: 'metacognicion',
        source: 'deterministic_scoring',
        purpose: 'Separar lo dominado de lo que baja nota.',
        adaptationRule: 'El score por bloque decide la siguiente mision; Gemini no corrige nota final.',
        studentAction: 'Leer faltantes y aceptar el bloque recomendado.'
      },
      {
        id: 'adaptive_retrain',
        label: 'Reentreno Gemini',
        panel: 'study',
        blockId: target.block.id,
        action: 'generate_adaptive_content',
        knowledgeLayer: 'variacion_personalizada',
        source: 'gemini_backend_boundary',
        purpose: 'Generar microclase, recall y ejercicio nuevo para el hueco exacto.',
        adaptationRule: misses.length
          ? `Usa estos faltantes como objetivo: ${misses.slice(0, 3).join('; ')}.`
          : 'Genera variedad antes del simulacro.',
        studentAction: 'Generar entrenamiento adaptativo y resolver el ejercicio nuevo.'
      },
      {
        id: 'simulation_variant',
        label: 'Simulacro calibrable',
        panel: 'attempt',
        knowledgeLayer: 'prediccion',
        source: 'attempt_engine_and_calibration',
        purpose: 'Estimar nota antes del recuperatorio y comparar contra nota real.',
        adaptationRule: 'Si la nota real difiere, se ajusta la confianza del sistema.',
        studentAction: 'Resolver otro intento y registrar nota real cuando exista.'
      }
    ];
  }

  async build({ subjectId = 'contabilidad_2p', blockId = null, deterministicResult = null } = {}) {
    const plan = await this.studyContentService.buildPlan(subjectId);
    if (!plan) return null;

    const target = this.chooseTargetBlock(plan, { blockId, deterministicResult });
    const currentStep = this.currentStepFor({ deterministicResult, target });

    return {
      schemaVersion: '1.0.0',
      subjectId: plan.subjectId,
      title: 'Secuencia adaptativa NEXUS',
      currentStep,
      targetBlock: {
        id: target.block.id,
        code: target.block.code,
        label: target.block.label,
        reason: target.reason,
        examWeight: target.block.examWeight,
        studyMinutes: target.block.studyMinutes,
        weakness: target.weakness || null
      },
      displayModel: {
        principle: 'El conocimiento se muestra en capas: mapa, minimo defendible, recall, aplicacion, correccion, reentreno y simulacro.',
        chunkLimit: 'Maximo 7 pasos visibles para evitar sobrecarga.',
        adaptationBoundary: 'Gemini adapta explicaciones y ejercicios; el backend determinista decide secuencia, scoring y contrato.',
        emancipationGoal: 'El estudiante aprende a detectar sus huecos hasta depender menos del cockpit.'
      },
      signals: {
        deterministicScore: deterministicResult?.total ?? null,
        status: deterministicResult?.status || null,
        weaknessesCount: asArray(deterministicResult?.weaknesses).length,
        targetMisses: asArray(target.weakness?.misses)
      },
      steps: this.buildSteps({ target, deterministicResult })
    };
  }
}

module.exports = {
  AdaptiveSequenceService
};
