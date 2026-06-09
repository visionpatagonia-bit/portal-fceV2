// Hash-based router with optional query (#/aprender?block=...).
export const ROUTES = ['inicio', 'materias', 'aprender', 'evaluar', 'devolucion', 'gemini', 'kb', 'contrato'];

export function createRouter(onChange) {
  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    const key = ROUTES.includes(path) ? path : 'inicio';
    const params = Object.fromEntries(new URLSearchParams(query));
    return { key, params };
  }

  function go(key, params = {}) {
    const query = new URLSearchParams(params).toString();
    const target = `#/${key}${query ? '?' + query : ''}`;
    if (location.hash === target) {
      onChange(parse());
    } else {
      location.hash = target;
    }
  }

  window.addEventListener('hashchange', () => onChange(parse()));

  return { parse, go, start: () => onChange(parse()) };
}
