@echo off
setlocal enabledelayedexpansion

:: Construire le serveur
cmd /c "yarn run win:build:server"


echo start parallèle command...
:: Lancer plusieurs processus en parallèle avec `start`
start "Watch Shared JSON" cmd /c "yarn run -- onchange shared\*.json -- copy {{changed}} build\server\shared"
start "Watch Locale JSON" cmd /c  "yarn run -- onchange shared\locales\*.json -- copy {{changed}} build\server\shared\locales"
::  start "Watch Woob Python" cmd /c  "yarn run -- onchange server\providers\woob\**\*.py -- copy .\{{changed}} .\build\{{changed}}"
start "Run Vite" cmd /c  "yarn run -- vite"
:: start "Watch Kresus"  cmd /c "yarn run -- onchange -i -k build\server bin\kresus.js config.ini -- bin\kresus.js --config config.ini"


echo ended  parallèle command...

yarn win:tsdev

endlocal