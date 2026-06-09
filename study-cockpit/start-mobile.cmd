@echo off
setlocal
cd /d "%~dp0"
set HOST=0.0.0.0
set PORT=8788
echo.
echo NEXUS Study Cockpit - modo celular/tablet
echo.
echo 1. Deja esta ventana abierta.
echo 2. En tu celular/tablet usa la MISMA WiFi que esta PC.
echo 3. Busca la IP de esta PC en la salida del servidor o con ipconfig.
echo 4. Abri: http://IP_DE_ESTA_PC:8788/
echo.
node server.js
