@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
rem 파르티잔 인베스트먼트를 '뒤에서' 켜기 — 키를 한 번 넣으면 창을 닫아도 화면 서버·중계기가 계속 돎
rem 끄기: 윈도우_중계기_끄기.bat   ·   가짜 시세로 시험: 윈도우_뒤에서_켜기.bat --demo
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY set "PY=python"
%PY% -c "import sys" >nul 2>nul
if errorlevel 1 goto nopy

rem 화면 서버 — 창 없이 (pythonw). 이미 켜져 있으면 그대로
netstat -ano | findstr /r /c:"127.0.0.1:8792 .*LISTENING" >nul
if errorlevel 1 (
  for /f "delims=" %%P in ('%PY% -c "import sys,os;print(os.path.join(os.path.dirname(sys.executable),'pythonw.exe'))"') do set "PYW=%%P"
  if exist "!PYW!" (start "" "!PYW!" -m http.server 8792 --bind 127.0.0.1) else (start "화면 서버 8792" /min %PY% -m http.server 8792 --bind 127.0.0.1)
)

rem 중계기가 이미 켜져 있으면 화면만 엶
netstat -ano | findstr /r /c:"127.0.0.1:8766 .*LISTENING" >nul
if not errorlevel 1 (
  echo 중계기가 이미 켜져 있어요. 화면만 열게요.
  start "" "http://127.0.0.1:8792/partisan_investment.html"
  timeout /t 3 >nul
  exit /b 0
)

echo.
echo 앱키·시크릿을 넣으면 중계기가 뒤에서 돌기 시작해요. 그다음 이 창은 닫아도 돼요.
echo.
set "MODE=--ask"
echo %* | findstr /c:"--demo" >nul && set "MODE="
%PY% nh_bridge.py %MODE% --background %*
if errorlevel 1 (pause & exit /b 1)
start "" "http://127.0.0.1:8792/partisan_investment.html"
timeout /t 8
exit /b 0

:nopy
echo.
echo 파이썬을 찾지 못했어요. https://www.python.org 에서 설치하고 "Add python.exe to PATH" 를 체크하세요.
pause
exit /b 1
