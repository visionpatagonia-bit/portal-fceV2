# CHECKLIST · DEMO ARIEL · 9-may-2026

**Cliente:** Ariel Díaz Campos · Anubis Athletic Center · Trelew
**Versión target:** `NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html`
**URL pública:** https://nexus-fitness-ruby.vercel.app
**Generado:** 2026-05-06 (post-cierre piloto sesión 16:45)

---

## 0. Pre-checks técnicos (5 min antes)

**Forma rápida · 1 comando ejecuta los 5 checks críticos:**

```powershell
cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0\NEXUS FITNES"
.\PRE_DEMO_CHECK.ps1
```

Salida esperada: `[1/5] OK · [2/5] OK · [3/5] OK · [4/5] OK · [5/5] OK · TODO OK · listo para demo`. Si algún check falla, el script te dice qué hacer. Exit code 0 = todo OK · 1 = al menos uno falló.

**Alternativa manual si querés validar cosa por cosa:**

| Check | Cómo | Si falla |
|---|---|---|
| Vercel deploy actualizado | `vercel ls` o navegador anónimo a la URL · ver banner versión `v2028.15+` | Re-correr `DEPLOY_NEXUS_FITNESS.ps1` |
| Persistencia funciona | F12 console → `Object.keys(window.NEXUS_STORAGE_API).length` → 17+ | Limpiar caché + Ctrl+Shift+R |
| pdfmake disponible | F12 → `nxExportAnubisPDF` → ver que cargó pdfmake CDN | Verificar conectividad |
| Toggle dark visible | Botón ☾ en topbar | Recargar página |
| Logo Anubis carga | Hero principal · escudo azul/ámbar | Verificar PNG en `clientes/anubis/brand/` |
| **Datos pre-demo cargados** (Susana/Lucía/Carlos) | F12 → `Object.keys(JSON.parse(localStorage.getItem('nx_clients'))).filter(k=>k.startsWith('demo_')).length === 3` | Cargar `imports/demo_pre_9may.json` (ver §0.5) |

### 0.5 · Cargar datos pre-demo de un solo paso (3 clientes con rutinas)

Antes de la demo, **F12 Console** en `nexus-fitness-ruby.vercel.app` y pegar:

```javascript
fetch('/clientes/anubis/imports/demo_pre_9may.json')
  .then(r => r.json())
  .then(p => {
    localStorage.setItem('nx_clients',  JSON.stringify(p.nx_clients));
    localStorage.setItem('nx_routines', JSON.stringify(p.nx_routines));
    localStorage.setItem('nx_history',  JSON.stringify(p.nx_history));
    location.reload();
  });
```

Quedan cargados los 3 clientes con sus rutinas pre-generadas (sin esperar generación en vivo):
- **Susana Pérez** (58F · rodilla) · 4 días · 27 ej · 0 contras forbidden
- **Lucía Fernández** (26F · sin contras) · 4 días · 27 ej · ideal para mostrar Edit reps
- **Carlos Mendoza** (67M · hipertensión + hombro) · 3 días · 17 ej

### 0.6 · Smoke automatizado (opcional · 1 min)

Si querés más certeza pre-demo, correr el smoke headless:

```powershell
cd "NEXUS FITNES\scripts"
npm install   # solo la primera vez
node smoke_headless.js
```

Salida esperada: `46 OK · 1 WARN · 0 FAIL`. El WARN es del refuse honesto (limitación jsdom · el form usa chips · validación manual con perfil Ana).

---

## 1. Orden sugerido de demo (10-15 min totales)

La demo apunta a **mostrar lo que Ariel pidió** post-demo del 28-abr y a **confirmar el ROI** ("ahorra 15 min por rutina").

### Bloque A · Plantillas + flujo nuevo de cliente (2 min)
1. **Mostrar el grid de presets de cliente** (parte superior del form). Decir: *"Acá agregué los 3 que pediste el otro día."*
2. **Click en "Tren (sup/inf/medio) ▾"** — desplegable se abre y muestra los 3 sub-presets nuevos. Decir: *"Tren superior, tren inferior, tren medio (core). Click en cualquiera y te llena el form."*
3. **Click en "Musculación ▾"** — mismo patrón, 3 sub-niveles (principiante/intermedio/avanzado). Decir: *"Y musculación quedó agrupado, así no tenés tantos botones sueltos."*

### Bloque B · Edit reps + preferencia persistente (3 min) ★ CLAVE
1. Click en preset **"Glúteo + femoral"** (carga form de Lucía 26F).
2. **Generar rutina.**
3. En el primer ejercicio, **click sobre el número de reps** (8). Cambiar a 12. Enter.
4. Toast verde aparece: *"Preferencia guardada: {ejercicio} → reps=12. Próximas generaciones lo respetan."*
5. **Decir el ancla del ROI:** *"Ari, esto es lo que te quita 15 minutos por rutina. Vos cambiás una vez, el sistema lo recuerda. Cuando regenero la rutina de Lucía la semana que viene, sale con 12 ya."*
6. Para mostrar la persistencia: regenerar la rutina (Generar de nuevo). El ejercicio aparece con un **badge ★** y reps=12 directo.

### Bloque C · Modo dark + Anotador pesos/reps (2 min)
1. Click en botón **☾** topbar → modo dark se activa, todo el dashboard cambia a paleta oscura. Decir: *"Quick win — el toggle está en la barra superior. Se persiste por sesión."*
2. (Opcional) Click en cualquier ejercicio → abrir **modal anotador** (Hevy-style). Mostrar los inputs de peso/reps por set. Decir: *"Esto es para que la alumna anote durante el entrenamiento. Mobile-first."*

### Bloque D · Asistencia + Progresión (2 min)
1. Volver a vista cliente · click en **"📅 Asistencia"** o calendar. Mostrar calendario marcable.
2. Click en un día → marcar "viene". Tasa de asistencia última semana se actualiza.
3. Mostrar **charts de progresión** (`renderProgressCharts`) — pesos × reps × ejercicio en el tiempo. Decir: *"Toda la data se acumula. Ariel ve el progreso real, no la sensación."*

### Bloque E · Export PDF Anubis (2 min) ★ CLAVE
1. Generar una rutina cualquiera con cliente asociado.
2. Click **"📄 PDF Anubis"** (botón naranja gradient).
3. Esperar 2-3 segundos (pdfmake CDN lazy-load).
4. PDF se descarga con identidad Anubis: logo + paleta + nombre del cliente.
5. Decir: *"Este es el PDF que mandás por WhatsApp a la alumna. Brand Anubis, listo para imprimir o pantalla."*

### Bloque F · PWA Alumna (1 min · si Ariel pregunta)
1. Mostrar la **vista alumna** simplificada (sin sidebar coach · solo rutina + asistencia + anotador).
2. Decir: *"Esto es lo que ve la alumna en su celular. Sin acceso a tu panel. Foco en su rutina."*

### Cierre (1 min)
- *"Ari, todo lo que pediste el 28 está adentro. Probalo esta semana, anotá los minutos que ahorrás real, y la próxima nos juntamos a ver métricas. ¿Queda algo más urgente que querías?"*

---

## 2. Features que SÍ mostrar en la demo

| # | Feature | ¿Por qué? |
|---|---|---|
| 1 | **Edit reps + preferencia persistente** | Lo primero que pidió Ariel post-demo · ROI directo |
| 2 | **Musculación dropdown + Tren x3 presets** | Lo segundo que pidió · UI más limpia |
| 3 | **Modo dark toggle** | Quick win UX · pidió expreso |
| 4 | **Anotador pesos/reps mobile** | Core PWA Alumna · impacto al alumno |
| 5 | **Asistencia (calendar + tasa)** | Pidió tracking de presencia |
| 6 | **Progresión charts longitudinales** | Pidió "medidor de progresión semanal en pesos y repes" |
| 7 | **Export PDF Anubis (gradient naranja)** | Diferenciador comercial · listo para WhatsApp |
| 8 | **Explain trace ("Lógica completa")** | Validado en demo del 28-abr · sigue siendo punto fuerte |
| 9 | **Refuse honesto en contraindicaciones** | Validado por auditor MVP · no degradar |
| 10 | **PWA Alumna (vista simplificada)** | Si Ariel pregunta cómo ve la alumna |

## 3. Features que NO mostrar (en estado intermedio o post-demo mes 5)

| Feature | Razón de no mostrar |
|---|---|
| 🚫 Videos de ejercicios | Bloqueada · Ariel debe grabar (1 ej/día) — recordarle |
| 🚫 Inventario 50+ máquinas Anubis | Bloqueada · Ariel debe enviar lista — recordarle |
| 🚫 Share progreso a redes sociales | Mes 5 según roadmap · NO comprometer |
| 🚫 Chat coach-alumno | Mes 5 · requiere backend Firebase · NO comprometer |
| 🚫 Reemplazo AccesoGym | Roadmap 16m archivado · pitch cambió a "asistente, no reemplazo" |
| ⚠ Templates editables (JSON) | Funciona pero feature avanzada · solo si Ariel pregunta por templates |
| ⚠ Backup/restore JSON | Funciona pero contexto técnico · solo si Ariel pregunta por seguridad de datos |

## 4. Q&A típicas que puede hacer Ariel

### Sobre features

| Pregunta | Respuesta sugerida |
|---|---|
| *"¿Cuánto guarda en el navegador?"* | "Todo localStorage. ~5MB techo. Hay backup automático cada 24h. Si querés, te muestro el botón ⬇ Backup que descarga toda tu data en un JSON." |
| *"¿Y si cierro el navegador?"* | "Persiste. Con cualquier celular o compu donde abras el link, **si es el mismo navegador**, está toda tu data." |
| *"¿La alumna puede ver lo de otras alumnas?"* | "No. La PWA Alumna es vista standalone, no accede al panel del coach. Solo ve su rutina y su asistencia." |
| *"¿Por qué no me genera rutina con Ana embarazada y lumbar?"* | "Refuse honesto del motor — la combinación 'embarazo + lumbar agudo' requiere clearance médico. Es decisión de seguridad. No improvisa." |
| *"¿Funciona offline?"* | "Sí, una vez cargado. La generación es local, no toca server. Solo el PDF requiere conexión la primera vez (carga la librería de CDN)." |
| *"¿Lo puedo usar desde mi celular?"* | "Sí, mobile-first. La V3 que estás viendo es la versión MOBILE_READY. Andá a la URL desde tu celu y se ve igual." |

### Sobre modelo comercial

| Pregunta | Respuesta sugerida |
|---|---|
| *"¿Cuánto sale?"* | "Hablamos de eso cuando me digas si lo usás todos los días. Mes 4 ya lo cubrimos. Si funciona, vemos modelo." |
| *"¿Cuándo está la lista de mis máquinas?"* | "Cuando vos me la pases. Lista con nombre + foto si podés. Apenas la tenga, en 2-3 días lo tenés mapeado." |
| *"¿Cuándo grabamos los videos?"* | "Cuando vos puedas. 1 ejercicio por día, formato vertical celular, 30-60 segundos. No tiene que ser pulido — es para tus alumnas." |
| *"¿Qué hago si quiero compartir el progreso a Instagram?"* | "Esa la tenemos para mes 5. Por ahora podés capturar pantalla. Cuando esté, va a ser un botón." |

### Sobre objeciones / dudas

| Pregunta | Respuesta sugerida |
|---|---|
| *"Pero AccesoGym tiene mil cosas más..."* | "Sí. Esto NO es reemplazo de AccesoGym. Es asistente para vos como entrenador, generación de rutinas adaptativas. AccesoGym sigue donde está — esto suma." |
| *"¿Y si quiero backend / nube / multi-usuario?"* | "Mes 5. Hoy es local + persistencia browser. Cuando valides que lo usás todos los días, escalamos a backend. **No al revés.**" |
| *"¿Qué pasa si me explota el navegador?"* | "Tenés el botón Backup que descarga tu data completa en JSON. Si pasa algo, restauración en 30 segundos. Y el modal de backup te lo recuerda automáticamente cada 24h." |

---

## 5. Pedidos para Ariel al cierre del 9-may

- [ ] Lista de las **50+ máquinas** de Anubis (nombre + foto si puede)
- [ ] Arrancar **grabaciones de videos** (1 ej/día · vertical · 30-60s)
- [ ] Acordar **fecha de revisión semanal** (recurrente · 30 min · revisar métricas de uso real)

---

## 6. Métricas a medir post-demo (5 días después · 14-may)

| Métrica | Meta mínima | Meta ideal |
|---|---|---|
| Veces que Ariel abrió NEXUS | 3 | 7+ |
| Rutinas generadas | 3 | 8+ |
| Rutinas guardadas en historial | 2 | 6+ |
| Edit reps usados (preferencias creadas) | 1 | 5+ |
| Asistencia marcada (días) | 5 | 15+ |
| PDFs Anubis exportados | 1 | 3+ |

**Mínima alcanzada** = momento de revisar feature-set para mes 5.
**Ideal alcanzada** = momentum fuerte · reabrir decisiones del informe auditor v1.
**Por debajo** = volver al lead con datos antes de agregar nada.

---

## 7. Riesgo conocido + plan de contingencia

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| LocalStorage 5MB techo · pierde data en incógnito | Media | Modal backup auto cada 24h ya implementado |
| Ariel no usa el sistema entre demos | Alta | Mensaje WhatsApp a los 3 días: "¿Pudiste abrir? ¿Necesitás que te muestre algo?" |
| Bug visual en mobile específico | Media | Hacer demo desde mobile real de Ariel · no desde tu compu |
| pdfmake falla por conectividad | Baja | El botón muestra spinner + retry · si falla, alternativa: print rutina HTML |
| Vercel-GitHub link se rompe (pasó 2026-05-03) | Baja | Verificar deploy_qa/ post-push antes de demo |

---

## 8. Lo que NO comprometer en la demo

- ❌ Backend cloud / Firebase / Supabase
- ❌ Multi-usuario / multi-tenant
- ❌ MercadoPago / AFIP / facturación electrónica
- ❌ Reemplazo AccesoGym
- ❌ Plazos de mes 5 más cortos que "cuando validamos uso real"
- ❌ Precios SaaS antes de que Ariel los pida específicamente

---

**Generado para:** demo Ariel 9-may
**Autor:** Claude (programador) · sesión 2026-05-06 · validado por inventario sobre HTML actual
**Última verificación features:** todas las pedidas post-demo 28-abr presentes en código + smoke programático JS sin errores parser
