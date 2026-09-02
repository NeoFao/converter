@echo off
setlocal enabledelayedexpansion
title Desplegar MD to PDF en Vercel (100% Gratis)

echo ===================================================
echo     Desplegar en Vercel (100% Gratis y Permanente)
echo ===================================================
echo.
echo  Subiendo y desplegando la aplicacion en Vercel...
echo ===================================================
echo.

:: Despliegue con nombre en minusculas y confirmacion automatica
call npx vercel --prod --yes --name md-to-pdf-converter

echo.
echo ===================================================
echo  Despliegue finalizado!
echo  Revisa la URL publica permanente arriba.
echo ===================================================
echo.
echo  Presiona cualquier tecla para cerrar esta ventana.
pause >nul