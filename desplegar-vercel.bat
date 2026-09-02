@echo off
setlocal enabledelayedexpansion
title Desplegar Converter en Vercel (100% Gratis)

echo ===================================================
echo     Desplegando Converter en Vercel (100% Gratis)
echo ===================================================
echo.
echo  Subiendo y desplegando la aplicacion en Vercel...
echo ===================================================
echo.

call npx vercel --prod --yes

echo.
echo ===================================================
echo  Despliegue finalizado exitosamente!
echo  Revisa tu URL publica permanente arriba.
echo ===================================================
echo.
echo  Presiona cualquier tecla para cerrar esta ventana.
pause >nul