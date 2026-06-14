// Minimal reactive store (subscribe / set), plus small caches.

export function createStore(initial = {}) {
  let state = { ...initial };
  const subs = new Set();

  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    }
  };
}

export const initialState = {
  health: null,
  user: null,                 // Firebase user (null = sesion local anonima)
  subjects: [],
  activeSubjectId: null,      // folder of the active subject
  contractsBySubject: {},     // folder -> contract
  plansBySubject: {},         // subjectId -> plan
  activeBlockId: null,
  sequence: null,
  lastScore: null,            // last attempt result (full)
  lastScoreSubject: null,     // subjectId the lastScore belongs to
  lastMergedContract: null,   // contrato fusionado del ultimo Examen integrador (para su devolucion)
  lastSessionId: null,        // sessionId of the last scored attempt
  lastAttemptId: null,        // attemptId of the last scored attempt
  kbEntries: [],
  events: []
};
