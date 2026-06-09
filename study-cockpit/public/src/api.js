// API client — single place that knows the backend endpoints.
// The frontend never scores or applies exam rules; it only calls the backend.

async function request(path, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  };
  if (Object.prototype.hasOwnProperty.call(options, 'body')) {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(path, config);
  } catch (networkError) {
    throw Object.assign(new Error('No se pudo conectar con el backend.'), { kind: 'network' });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error || `${response.status} ${response.statusText}`), {
      status: response.status,
      data
    });
  }
  return data;
}

const qs = (params = {}) => {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return usable.length ? '?' + usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
};

export const api = {
  health: () => request('/api/health'),
  subjects: () => request('/api/subjects'),
  contract: (folder) => request(`/api/subjects/${encodeURIComponent(folder)}/contract`),
  studyPlan: (subjectId) => request(`/api/study/plan${qs({ subjectId })}`),
  studyBlock: (subjectId, blockId) => request(`/api/study/block${qs({ subjectId, blockId })}`),
  adaptiveSequence: (body) => request('/api/study/adaptive-sequence', { method: 'POST', body }),
  adaptiveContent: (body) => request('/api/study/adaptive-content', { method: 'POST', body }),
  ask: (body) => request('/api/study/ask', { method: 'POST', body }),
  // Backend endpoint is /api/attempts/score (spec called it "correct").
  scoreAttempt: (body) => request('/api/attempts/score', { method: 'POST', body }),
  failExplanationsLookup: (body) => request('/api/fail-explanations/lookup', { method: 'POST', body }),
  realGrade: (body) => request('/api/grades/real', { method: 'POST', body }),
  calibration: (params) => request(`/api/calibration${qs(params)}`),
  kbList: (params) => request(`/api/kb/adaptive-content${qs(params)}`),
  kbGet: (entryId) => request(`/api/kb/adaptive-content/${encodeURIComponent(entryId)}`),
  llmReview: (body) => request('/api/llm/review', { method: 'POST', body }),
  llmConfig: (body) => request('/api/llm/config', { method: 'POST', body }),
  events: (params) => request(`/api/events${qs(params)}`),
  // Backend endpoint is /api/events (spec called it "/api/telemetry/events").
  appendEvent: (body) => request('/api/events', { method: 'POST', body }),
  prototypes: () => request('/api/prototypes')
};
