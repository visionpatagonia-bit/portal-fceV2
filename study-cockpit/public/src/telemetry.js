// Frontend telemetry — fire-and-forget events to the backend event store.
import { api } from './api.js';

export const FE = {
  SUBJECT_SELECTED: 'fe_subject_selected',
  STUDY_STARTED: 'fe_study_started',
  BLOCK_COMPLETED: 'fe_block_completed',
  ATTEMPT_STARTED: 'fe_attempt_started',
  ATTEMPT_CORRECTED: 'fe_attempt_corrected',
  WEAKNESS_DETECTED: 'fe_weakness_detected',
  STUDY_WEAKNESS_CLICK: 'fe_study_weakness_click',
  GEMINI_USED: 'fe_gemini_used',
  KB_REUSED: 'fe_kb_reused',
  MICRO_LESSON_CONFUSION: 'fe_micro_lesson_confusion'
};

const sessionId = 'cockpit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

export const getSessionId = () => sessionId;

export function track(type, payload = {}, subjectId = null) {
  // Never block the UI on telemetry.
  api.appendEvent({ type, subjectId, sessionId, actor: 'student', payload }).catch(() => {});
}
