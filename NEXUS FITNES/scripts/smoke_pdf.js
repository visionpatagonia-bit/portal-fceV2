// =====================================================================
// smoke_pdf.js · v1 · valida PDF Anubis post-fixes 8-may noche
//
// Genera 3 PDFs (Luz · 5 días tonificación · 3 días mantenimiento) usando
// el código exacto de buildDocDef + enrichExercise extraídos del HTML.
// Después usa pdfmake server-side + pdf-parse para extraer texto y
// validar 4 problemas reportados por Ariel:
//   1. Layout · NO un día por página
//   2. Ligaduras fi/fl · "tonificación" completo, "flexiones" completo
//   3. Render diferenciado · warmup "5-10 min" · stretch "30-60s × 2-3"
//   4. Columna técnica · cite del banco completo (no "—")
// =====================================================================
const fs = require('fs');
const { JSDOM } = require('jsdom');
const PdfPrinter = require('pdfmake');
const { PDFParse } = require('pdf-parse');
async function pdfParse(buf){
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const pages = result.pages;
  const numpages = Array.isArray(pages) ? pages.length :
                   (typeof pages === 'number' ? pages : (result.numpages || 1));
  // Si pages es array de objetos con .text, concatenar; sino usar result.text
  let text = '';
  if (Array.isArray(pages) && pages[0] && typeof pages[0] === 'object'){
    text = pages.map(p => p.text || p.content || '').join('\n');
  } else {
    text = result.text || '';
  }
  return { text, numpages };
}
const path = require('path');

const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

// pdfmake 0.2.10 (igual que Anubis usa desde CDN) · vfs_fonts es { pdfMake: { vfs: {...} } }
const vfsModule = require('pdfmake/build/vfs_fonts.js');
const vfs = vfsModule.pdfMake.vfs;
const Roboto_Regular = Buffer.from(vfs['Roboto-Regular.ttf'], 'base64');
const Roboto_Medium = Buffer.from(vfs['Roboto-Medium.ttf'], 'base64');
const Roboto_Italic = Buffer.from(vfs['Roboto-Italic.ttf'], 'base64');
const Roboto_MediumItalic = Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64');

const fonts = {
  Roboto: {
    normal: Roboto_Regular,
    bold: Roboto_Medium,
    italics: Roboto_Italic,
    bolditalics: Roboto_MediumItalic,
  },
};
const printer = new PdfPrinter(fonts);

// Cargar HTML en jsdom para extraer EX, gp, buildDocDef, enrichExercise
const html = fs.readFileSync(HTML_PATH, 'utf8');
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  url: "http://localhost/"
});
const win = dom.window;
win.URL.createObjectURL = () => "blob:fake";
win.URL.revokeObjectURL = () => {};

async function generatePDF(profile) {
  // Generar rutina headless
  const goalProfileFn = win.getGoalProfile;
  const gp = (typeof goalProfileFn === "function") ? goalProfileFn(profile.goal) : { sets: 3, reps: '12-15' };

  const dayLabels = ["lun","mar","mie","jue","vie","sab","dom"];
  const selectedDays = dayLabels.slice(0, profile.days);
  const days = [];
  for (let d = 0; d < selectedDays.length; d++) {
    const dayEx = win.pickDayExercises(d, selectedDays.length, profile, gp);
    days.push({
      name: selectedDays[d],
      exercises: (dayEx || []).map(item => ({
        id: item.ex.id, name: item.ex.name, level: item.ex.level,
        group: item.ex.group, equipment: item.ex.equipment,
        pattern: item.ex.pattern,
        primary_muscles: item.ex.primary_muscles || [],
        role: item.role,
        trace: item.trace,
      })),
    });
  }

  const client = { id: profile.id || 'test', name: profile.name };
  const routinePayload = {
    days,
    gp_meta: gp,
    profile_snapshot: profile,
    generated_at: new Date().toISOString(),
  };

  // Llamar buildDocDef del módulo NX_ANUBIS_PDF (expuesto en window)
  // Nota: NX_ANUBIS_PDF no expone buildDocDef directo, pero podemos accederlo
  // vía exportRoutinePDF() interceptado · o reimplementarlo. Camino más directo:
  // capturar el docDefinition desde una versión modificada de exportRoutinePDF.
  // Usamos el truco de monkeypatching pdfMake.createPdf para capturar docDef:
  let capturedDocDef = null;
  win.pdfMake = {
    createPdf: function(docDef) {
      capturedDocDef = docDef;
      return {
        download: () => {},
        getBase64: (cb) => cb('mock'),
        getBuffer: (cb) => cb(Buffer.from('mock')),
      };
    },
  };
  // Setear "última rutina generada" para que resolveContext la encuentre
  win._lastGeneratedRoutine = { profile, days, gp };
  // Llamar exportRoutinePDF que internamente arma docDef y llama pdfMake.createPdf
  // Como pdfMake.createPdf está monkeypatched, capturamos el docDef sin generar PDF.
  await win.NX_ANUBIS_PDF.exportRoutinePDF();

  if (!capturedDocDef) throw new Error("docDef no fue capturado · revisar exportRoutinePDF");

  // Quitar la imagen del logo (base64) que rompe pdfmake server-side por encoding
  // y reemplazar por un placeholder para que el smoke pueda generar el PDF.
  function stripImages(node) {
    if (Array.isArray(node)) { node.forEach(stripImages); return; }
    if (node && typeof node === 'object') {
      if (node.image) { delete node.image; node.text = '[logo]'; node.fontSize = 8; }
      if (node.columns) stripImages(node.columns);
      if (node.stack) stripImages(node.stack);
      if (node.table && node.table.body) stripImages(node.table.body);
      if (node.content) stripImages(node.content);
      Object.keys(node).forEach(k => {
        if (typeof node[k] === 'object') stripImages(node[k]);
      });
    }
  }
  stripImages(capturedDocDef);

  const pdfDoc = printer.createPdfKitDocument(capturedDocDef);
  const chunks = [];
  return new Promise((resolve, reject) => {
    pdfDoc.on('data', (c) => chunks.push(c));
    pdfDoc.on('end', () => resolve({ buffer: Buffer.concat(chunks), docDef: capturedDocDef }));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

async function main() {
  await new Promise(r => setTimeout(r, 2500)); // esperar a que jsdom ejecute todo

  const profiles = [
    {
      id: 'luz', name: 'Luz', age: 28, sex: 'F', goal: 'tonificacion',
      level: 3, days: 5,
      modifiers: ['glute_focus', 'core_focus'],
      contras: ['Escoliosis', 'Coxalgia / dolor coccígeo'],
      equip: ['Mancuernas','Banco','Polea','Colchoneta'],
    },
    {
      id: 'tonif5', name: 'Tonif5d', age: 35, sex: 'F', goal: 'tonificacion',
      level: 3, days: 5,
      modifiers: ['chest_focus','back_focus'],
      contras: [],
      equip: ['Mancuernas','Banco','Polea','Colchoneta','Barra olímpica + soporte','Banco romano','Bicicleta','Cinta'],
    },
    {
      id: 'mant3', name: 'Mantenimiento3d', age: 50, sex: 'M', goal: 'salud_general',
      level: 2, days: 3,
      modifiers: [],
      contras: [],
      equip: ['Colchoneta'],
    },
  ];

  const results = [];
  for (const p of profiles) {
    try {
      console.log(`\n[${p.id}] generando PDF...`);
      const { buffer, docDef } = await generatePDF(p);
      const parsed = await pdfParse(buffer);
      const text = parsed.text;
      const pageCount = parsed.numpages;

      // Asserts
      const expectedMaxPages = 1 + Math.ceil(p.days / 2); // intro + ~días/2
      const fiBugs = (text.match(/(?<![a-záéíóúñ])(verifcaci|tonifcaci|fexion|fexibilidad)/gi) || []);
      const hasIntegrityFI = !text.match(/tonifcaci|verifcaci/i);
      const hasIntegrityFL = !text.match(/(?<![a-z])fexion|(?<![a-z])fexibilidad/i);

      const hasWarmupFmt = /5-10 min|entrada en calor/.test(text);
      const hasStretchFmt = /30-60s|estiramiento\s*$|estiramiento\s+/im.test(text);
      const dashOnlyRows = (text.match(/\n[^\n]+\n[^\n]*[—–-]\s*\n/g) || []).length;

      // Cite no vacía: contar cuántas líneas tienen guion solitario (—) en columna técnica
      const lines = text.split('\n');
      const cueLines = lines.filter(l => l.trim() === '—' || l.trim() === '-');
      const cueColumnHasContent = cueLines.length < 5; // tolerancia · pocos guiones es OK

      const r = {
        id: p.id,
        days: p.days,
        pageCount,
        expectedMaxPages,
        passLayout: pageCount <= expectedMaxPages,
        passLigatures: hasIntegrityFI && hasIntegrityFL,
        ligatureBugs: fiBugs,
        passWarmupFmt: hasWarmupFmt,
        passStretchFmt: hasStretchFmt,
        passCueColumn: cueColumnHasContent,
        cueDashOnly: cueLines.length,
        textPreview: text.slice(0, 400).replace(/\n/g, ' | '),
      };
      results.push(r);

      console.log(`  pageCount: ${pageCount} (target ≤ ${expectedMaxPages}) ${r.passLayout ? '✓' : '✗'}`);
      console.log(`  ligatures fi/fl OK: ${r.passLigatures ? '✓' : '✗ ' + JSON.stringify(fiBugs)}`);
      console.log(`  warmup format: ${r.passWarmupFmt ? '✓' : '✗'}`);
      console.log(`  stretch format: ${r.passStretchFmt ? '✓' : '✗'}`);
      console.log(`  cue column filled: ${r.passCueColumn ? '✓' : '✗ (' + cueLines.length + ' rows con —)'}`);

      // Save PDF for visual inspection
      const out = `/tmp/nexus_smoke/output_${p.id}.pdf`;
      fs.writeFileSync(out, buffer);
      console.log(`  PDF guardado en: ${out}`);
    } catch (e) {
      console.log(`[${p.id}] FAIL: ${e.message}`);
      console.log(e.stack ? e.stack.split('\n').slice(0,5).join('\n') : '');
      results.push({ id: p.id, error: e.message });
    }
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('RESUMEN SMOKE PDF v1');
  console.log('══════════════════════════════════════════════════════════');
  let totalPass = 0, totalFail = 0;
  for (const r of results) {
    if (r.error) { totalFail++; console.log(`✗ ${r.id} · ERROR: ${r.error}`); continue; }
    const ok = r.passLayout && r.passLigatures && r.passWarmupFmt && r.passStretchFmt && r.passCueColumn;
    if (ok) totalPass++; else totalFail++;
    console.log(`${ok ? '✓' : '✗'} ${r.id} · pages=${r.pageCount}/${r.expectedMaxPages} · ligatures=${r.passLigatures ? 'OK':'FAIL'} · warmup=${r.passWarmupFmt?'OK':'FAIL'} · stretch=${r.passStretchFmt?'OK':'FAIL'} · cue=${r.passCueColumn?'OK':'FAIL'}`);
  }
  console.log(`\n${totalPass}/${profiles.length} OK · ${totalFail}/${profiles.length} FAIL`);
  process.exit(totalFail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
