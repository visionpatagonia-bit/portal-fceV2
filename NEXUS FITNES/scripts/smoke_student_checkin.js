// =====================================================================
// smoke_student_checkin.js · Sprint 2 D3
// Valida check-in del día + sensaciones para alumna:
//   - SENSATIONS_KEY namespace (nx_sensations)
//   - getStudentSensations / setStudentSensation
//   - nxStudentCheckIn modal handler
//   - nxSelectMood / nxSubmitCheckIn flow
//   - CTA dual (Ver mi rutina + Hice mi rutina hoy)
//   - Detect alreadyDone via getAttendance
// Asserts: 11
// =====================================================================

const fs = require('fs');
const path = require('path');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_student_checkin] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: SENSATIONS_KEY definido ===
assert(html.includes('SENSATIONS_KEY = "nx_sensations"'), 'T1 SENSATIONS_KEY = nx_sensations', 'truthy', 'check');

// === T2-T3: getter + setter sensaciones ===
assert(html.includes('function getStudentSensations(clientId)'), 'T2 getStudentSensations definida', 'function', 'check');
assert(html.includes('function setStudentSensation(clientId, dateISO, mood, note)'), 'T3 setStudentSensation definida', 'function', 'check');

// === T4: setStudentSensation persiste a Dexie también ===
assert(/setStudentSensation[\s\S]*?NX_USE_DEXIE[\s\S]*?NX_DEXIE\.put\(SENSATIONS_KEY/.test(html), 'T4 setStudentSensation mirror a Dexie via NX_DEXIE proxy', 'truthy', 'check');

// === T5: setStudentSensation trunca note a 500 chars ===
assert(/note \|\| ""\)\.slice\(0, 500\)/.test(html), 'T5 note truncada a 500 chars (XSS/quota safety)', 'truthy', 'check');

// === T6: nxStudentCheckIn handler global ===
assert(html.includes('window.nxStudentCheckIn = function(clientId)'), 'T6 window.nxStudentCheckIn handler global', 'function', 'check');

// === T7: 5 emojis para mood (1-5) ===
const moodEmojis = ['😣', '😐', '🙂', '😊', '💪'];
const allEmojisPresent = moodEmojis.every(e => html.includes(e));
assert(allEmojisPresent, 'T7 5 emojis mood presentes (1=😣 ... 5=💪)', 'all 5', 'check');

// === T8: nxSelectMood + nxCloseCheckIn + nxSubmitCheckIn ===
assert(html.includes('window.nxSelectMood = function(mood)') &&
       html.includes('window.nxCloseCheckIn = function()') &&
       html.includes('window.nxSubmitCheckIn = function(clientId, dateISO)'),
  'T8 3 handlers globales: nxSelectMood + nxCloseCheckIn + nxSubmitCheckIn', 'all 3', 'check');

// === T9: nxSubmitCheckIn llama setAttendance + setStudentSensation + bumpStreak ===
assert(/nxSubmitCheckIn[\s\S]*?setAttendance[\s\S]*?setStudentSensation[\s\S]*?bumpStreak/.test(html), 'T9 nxSubmitCheckIn integra setAttendance + setStudentSensation + bumpStreak', 'all 3', 'check');

// === T10: CTA dual en nxRenderStudentEnhancements ===
assert(html.includes('Hice mi rutina hoy') && html.includes('Ver mi rutina'),
  'T10 CTA dual · "Ver mi rutina" + "Hice mi rutina hoy"', 'truthy', 'check');

// === T11: Detect alreadyDone via getAttendance ===
assert(/getAttendance\(client\.id\)[\s\S]*?att\[today\] === "present"/.test(html), 'T11 detect alreadyDone hoy via getAttendance', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
