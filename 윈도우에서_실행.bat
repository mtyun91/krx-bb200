@echo off
chcp 65001 >nul
rem 윈도우에서 파르티잔 인베스트먼트 켜기 — 이 파일을 더블클릭
rem 1) 화면을 로컬 웹서버(127.0.0.1:8792)로 브라우저에 열고  2) 중계기 실행기를 켬 (앱키·시크릿은 이 창에 직접 입력)
rem 가짜 시세로 시험: 윈도우에서_실행.bat --demo   ·   실계좌 주문까지: 윈도우에서_실행.bat --trade
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"

rem 파이썬 찾기 — py 실행기를 먼저 (설치 직전에 열린 창이나 스토어 바로가기에 속지 않게)
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY set "PY=python"
%PY% -c "import sys" >nul 2>nul
if errorlevel 1 goto nopy

rem 화면 서버 — 이미 켜져 있으면 그대로 씀 (작은 창으로 따로 뜸, 닫으면 화면 주소가 안 열림)
netstat -ano | findstr /r /c:"127.0.0.1:8792 .*LISTENING" >nul
if errorlevel 1 start "화면 서버 8792 - 닫지 마세요" /min %PY% -m http.server 8792 --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8792/partisan_investment.html"

echo.
echo 화면을 브라우저에 열었어요: http://127.0.0.1:8792/partisan_investment.html
echo 아래에서 중계기를 켭니다. 다 켜지면 나오는 '중계기 토큰'을 화면의 연결 창에 넣으세요.
echo 끌 때는 이 창에서 Ctrl+C 를 누르세요.
echo.
set "MODE=--ask"
echo %* | findstr /c:"--demo" >nul && set "MODE="
%PY% nh_bridge.py %MODE% %*
pause
exit /b 0

:nopy
echo.
echo 파이썬을 찾지 못했어요.
echo https://www.python.org 에서 파이썬을 설치하고, 설치 첫 화면의 "Add python.exe to PATH" 를 꼭 체크하세요.
echo 이미 설치했다면 컴퓨터를 한 번 다시 시작한 뒤 이 파일을 다시 더블클릭하세요.
echo.
pause
exit /b 1
