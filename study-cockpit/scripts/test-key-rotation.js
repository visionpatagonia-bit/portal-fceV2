'use strict';

// Test deterministico de la rotacion de keys de Gemini ante cuota agotada.
// Mockea la red (_post) para no depender de cuotas reales. Cubre: rotar ante 429,
// no rotar ante error no-cuota, devolver la primera que funciona, y agotar todas.

const { GeminiAdaptiveLayer } = require('../src/services/gemini-adaptive-layer');

function assert(cond, msg) { if (!cond) throw new Error('FALLO: ' + msg); }
const QUOTA = () => new Error('You exceeded your current quota (429 RESOURCE_EXHAUSTED)');
const AUTH = () => new Error('Request had invalid authentication credentials (401)');
const BADREQ = () => new Error('Invalid JSON payload received (400 INVALID_ARGUMENT)');
const OKRESP = { candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] };

// Arma un layer con 3 keys fijas y un _post que decide por key segun `behavior`.
function makeLayer(behavior) {
  const g = new GeminiAdaptiveLayer({ root: process.cwd() });
  g.getApiKeys = async () => ['KEY_A_xxxxxxxxxxxxxxxxxx', 'KEY_B_xxxxxxxxxxxxxxxxxx', 'KEY_C_xxxxxxxxxxxxxxxxxx'];
  g.readStoredConfig = async () => ({ model: 'gemini-2.5-flash-lite' });
  const tried = [];
  g._post = async (url) => {
    const key = new URL(url).searchParams.get('key');
    const tag = key.slice(0, 5); // KEY_A / KEY_B / KEY_C
    tried.push(tag);
    const r = behavior[tag];
    if (r === 'ok') return OKRESP;
    if (r === 'quota') throw QUOTA();
    if (r === 'auth') throw AUTH();
    if (r === 'badreq') throw BADREQ();
    throw new Error('comportamiento no definido para ' + tag);
  };
  return { g, tried };
}

async function run() {
  // 1) A y B sin cuota, C funciona -> rota hasta C, prueba las 3 en orden.
  {
    const { g, tried } = makeLayer({ KEY_A: 'quota', KEY_B: 'quota', KEY_C: 'ok' });
    const resp = await g.generateContent({ contents: [] }, { tries: 1 });
    assert(resp === OKRESP, '1: deberia devolver la respuesta de C');
    assert(tried.join(',') === 'KEY_A,KEY_B,KEY_C', '1: deberia probar A,B,C en orden (fue ' + tried.join(',') + ')');
    assert(g.activeKeyIndex === 2, '1: la key activa deberia ser la 3ra (idx 2)');
  }

  // 2) A sin cuota, B funciona -> usa B, NO toca C.
  {
    const { g, tried } = makeLayer({ KEY_A: 'quota', KEY_B: 'ok', KEY_C: 'ok' });
    const resp = await g.generateContent({ contents: [] }, { tries: 1 });
    assert(resp === OKRESP, '2: deberia devolver la respuesta de B');
    assert(tried.join(',') === 'KEY_A,KEY_B', '2: deberia parar en B sin tocar C (fue ' + tried.join(',') + ')');
    assert(g.activeKeyIndex === 1, '2: la key activa deberia ser la 2da (idx 1)');
  }

  // 3) A invalida/auth (key mal pegada en el panel) -> rota a B (la key inutilizable se salta).
  {
    const { g, tried } = makeLayer({ KEY_A: 'auth', KEY_B: 'ok', KEY_C: 'ok' });
    const resp = await g.generateContent({ contents: [] }, { tries: 1 });
    assert(resp === OKRESP, '3: deberia rotar de A (auth) a B');
    assert(tried.join(',') === 'KEY_A,KEY_B', '3: deberia saltar la key invalida A y usar B (fue ' + tried.join(',') + ')');
  }

  // 3b) Mezcla real (prod): A agotada + B invalida + C anda -> usa C (salta cuota Y auth).
  {
    const { g, tried } = makeLayer({ KEY_A: 'quota', KEY_B: 'auth', KEY_C: 'ok' });
    const resp = await g.generateContent({ contents: [] }, { tries: 1 });
    assert(resp === OKRESP, '3b: deberia llegar hasta C saltando cuota(A) y auth(B)');
    assert(tried.join(',') === 'KEY_A,KEY_B,KEY_C', '3b: deberia probar A,B,C (fue ' + tried.join(',') + ')');
  }

  // 3c) Error NO ligado a la key (request 400) -> NO rota, lanza (no enmascara un bug).
  {
    const { g, tried } = makeLayer({ KEY_A: 'badreq', KEY_B: 'ok', KEY_C: 'ok' });
    let threw = false;
    try { await g.generateContent({ contents: [] }, { tries: 1 }); } catch (e) { threw = true; assert(/invalid_argument|400/i.test(e.message), '3c: deberia propagar el error de request'); }
    assert(threw, '3c: un error de request (no de key) no debe rotar');
    assert(tried.join(',') === 'KEY_A', '3c: solo deberia probar A (fue ' + tried.join(',') + ')');
  }

  // 4) Las 3 sin cuota -> lanza tras agotar todas.
  {
    const { g, tried } = makeLayer({ KEY_A: 'quota', KEY_B: 'quota', KEY_C: 'quota' });
    let threw = false;
    try { await g.generateContent({ contents: [] }, { tries: 1 }); } catch (e) { threw = true; assert(/quota/i.test(e.message), '4: deberia propagar el ultimo error de cuota'); }
    assert(threw, '4: con todas sin cuota debe lanzar');
    assert(tried.join(',') === 'KEY_A,KEY_B,KEY_C', '4: deberia haber intentado las 3 (fue ' + tried.join(',') + ')');
  }

  // 5) A funciona -> usa A, sin rotar.
  {
    const { g, tried } = makeLayer({ KEY_A: 'ok', KEY_B: 'ok', KEY_C: 'ok' });
    const resp = await g.generateContent({ contents: [] }, { tries: 1 });
    assert(resp === OKRESP, '5: deberia devolver la respuesta de A');
    assert(tried.join(',') === 'KEY_A', '5: deberia usar solo A (fue ' + tried.join(',') + ')');
    assert(g.activeKeyIndex === 0, '5: la key activa deberia ser la 1ra (idx 0)');
  }

  console.log(JSON.stringify({ ok: true, escenarios: 7, casos: ['rota A->B->C', 'para en B', 'auth rota a B', 'cuota+auth->C', 'request-error no rota', 'todas agotadas lanza', 'A directo'] }, null, 2));
}

run().catch((e) => { console.error(e.message); process.exit(1); });
