@echo off
setlocal enabledelayedexpansion
title Desplegar MD to PDF en Vercel (100% Gratis)

echo ===================================================
echo     Desplegar en Vercel (100% Gratis y Permanente)
echo ===================================================
echo.
echo  Paso 1: Iniciando sesion en Vercel...
echo  (Se abrira una opcion para entrar con GitHub, Google o Email)
echo ===================================================
echo.

call npx vercel login

echo.
echo ===================================================
echo  Paso 2: Subiendo y desplegando la aplicacion...
echo ===================================================
echo.

call npx vercel --prod

echo.
echo ===================================================
echo  Despliegue finalizado!
echo  Revisa la URL publica entregada por Vercel arriba.
echo ===================================================
echo.
echo  Presiona cualquier tecla para cerrar esta ventana.
pause >nul