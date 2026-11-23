@echo off
setlocal
title Servidor local Meta Quest 3S

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado.
  echo Instale a versao LTS em https://nodejs.org/
  echo Depois feche e abra novamente este arquivo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar dependencias. Verifique a internet e tente novamente.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando servidor Quest 3S...
echo Mantenha esta janela aberta durante o uso.
echo No celular, acesse http://IP-DO-NOTEBOOK:8080
echo.
call npm start
echo.
echo O servidor foi encerrado.
pause
