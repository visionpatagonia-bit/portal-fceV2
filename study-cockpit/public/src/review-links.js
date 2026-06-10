// Mapa DETERMINISTA correccion/miss -> accion de reestudio. Sin Gemini: el destino sale de
// blockId + missText + los titulos de coreTheory del bloque (study-map). El resultado es serializable
// y se guarda dentro de cada correccion del repaso, para que al tocar un error el alumno salte
// EXACTAMENTE a como reaprenderlo (teoria concreta, resolucion paso a paso, o practica nueva).
// Si no hay match, degrada a { block } (lleva al bloque, comportamiento de antes).

// slug ascii estable para usar como id de ancla y en querySelector (sin acentos ni espacios).
export function slug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Concepto (titulo EXACTO de coreTheory del bloque B en study-map.json) por afirmacion V/F.
// Con la regla "corregi las falsas", los miss provienen de las FALSAS: b2 (aportes/contribuciones)
// y b4 (auditoria/independencia). El resto cae a un concepto coherente del mismo bloque.
const VF_CONCEPT = {
  b1: 'Aportes y contribuciones',
  b2: 'Aportes y contribuciones',
  b3: 'Aportes y contribuciones',
  b4: 'Auditoria e independencia'
};

// Devuelve { block, concept?, worked?, label } — todo serializable.
export function reviewLinkFor(blockId, missText, studyBlock) {
  const mt = String(missText || '').toLowerCase();

  // Bloque de calculo: siempre a la resolucion paso a paso (worked-example).
  if (blockId === 'calculation_entry') {
    return { block: blockId, worked: true, concept: 'Asiento base y la cuenta a pagar a organismos', label: 'Ver resolucion paso a paso' };
  }

  // V/F: parsear bN del miss y mapear al concepto del bloque B.
  if (blockId === 'true_false_justified') {
    const m = mt.match(/\bb([1-4])\b/);
    const concept = m ? VF_CONCEPT['b' + m[1]] : null;
    return concept ? { block: blockId, concept, label: 'Ver teoria' } : { block: blockId, label: 'Ver teoria' };
  }

  // Misses genericos anti-relleno (extension/copia): no apuntan a un concepto puntual, asi que evitamos
  // un deep-link enganoso (ej "evita copiar..." colisionaba con el titulo "Criterio de devengado").
  if (/^respuesta breve/.test(mt) || /^evita copiar/.test(mt) || mt.indexOf('relleno') >= 0) {
    return { block: blockId, label: 'Estudiar el bloque' };
  }

  // Bloques de texto (A/D/E): match por palabra clave del miss contra los titulos de coreTheory.
  const titles = (studyBlock && Array.isArray(studyBlock.coreTheory)) ? studyBlock.coreTheory.map((t) => t.title) : [];
  const hit = titles.find((t) => {
    const words = slug(t).split('-').filter((w) => w.length > 4);
    return words.some((w) => mt.indexOf(w) >= 0);
  });
  return hit ? { block: blockId, concept: hit, label: 'Ver teoria' } : { block: blockId, label: 'Estudiar el bloque' };
}
