# NEXUS Study Cockpit - uso transportable

Esta version no es un HTML suelto. Usa backend local para:

- contratos de examen;
- plan de estudio;
- scoring;
- devolucion;
- telemetria;
- Gemini backend-only.

## Opcion recomendada para celular/tablet

Usar la PC como servidor y entrar desde el celular/tablet por WiFi.

### Pasos

1. En la PC, abrir la carpeta `SOVERINGBACKEND`.
2. Ejecutar:

```powershell
.\start-mobile.ps1
```

Si PowerShell bloquea scripts, ejecutar:

```cmd
start-mobile.cmd
```

3. Dejar esa ventana abierta.
4. En el celular/tablet, conectarse a la misma WiFi.
5. Abrir la URL que muestre el script, por ejemplo:

```text
http://192.168.0.25:8788/
```

6. Si Windows Firewall pregunta, permitir red privada.

## Gemini

Si Gemini ya esta configurado en esta PC, el celular/tablet lo usa entrando al backend de esta PC.

La clave no se guarda en el celular ni en el HTML.

Archivo local de clave:

```text
data/runtime/gemini.secrets.json
```

Ese archivo no debe compartirse ni subirse.

## Mover a otra PC

Copiar el ZIP portable, descomprimir y ejecutar:

```powershell
node server.js
```

Luego configurar Gemini de nuevo desde la pantalla `Gemini`.

## Usarlo sin PC

Para que funcione completamente sin PC en celular/tablet hay dos caminos:

1. Subir backend a un hosting/cloud.
2. Correr Node.js en Android con Termux.

Para este fin de semana, la opcion estable es PC como servidor + celular/tablet por WiFi.

