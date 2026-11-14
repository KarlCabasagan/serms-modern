@echo off
setlocal
set "ROOT=%~dp0"
set "ELECTRON=%ROOT%node_modules\electron\dist\electron.exe"
set "ASAR=%ROOT%release\win-unpacked\resources\app.asar"
if not exist "%ELECTRON%" (
  echo SERMS Modern needs the Electron runtime. Run npm install first.
  pause
  exit /b 1
)
if not exist "%ASAR%" (
  echo SERMS Modern has not been packaged yet. Run npm run electron:build.
  pause
  exit /b 1
)
set "ELECTRON_RUN_AS_NODE="
set "SERMS_DEV=0"
if exist "%ROOT%release\win-unpacked\resources\srgb.ini" (
  set "SERMS_INI=%ROOT%release\win-unpacked\resources\srgb.ini"
) else if exist "%ROOT%config\srgb.ini" (
  set "SERMS_INI=%ROOT%config\srgb.ini"
)
start "" "%ELECTRON%" "%ASAR%"
