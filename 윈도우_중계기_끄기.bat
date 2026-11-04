@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
rem 뒤에서 돌던 중계기와 화면 서버를 끔
cd /d "%~dp0"
set "DONE="
if exist "logs\bridge.pid" (
  set /p BPID=<"logs\bridge.pid"
  taskkill /PID !BPID! /T /F >nul 2>nul && set "DONE=1"
  del "logs\bridge.pid" >nul 2>nul
)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:"127.0.0.1:8766 .*LISTENING"') do taskkill /PID %%P /T /F >nul 2>nul && set "DONE=1"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:"127.0.0.1:8792 .*LISTENING"') do taskkill /PID %%P /T /F >nul 2>nul
if defined DONE (echo 중계기와 화면 서버를 껐어요.) else (echo 켜져 있는 중계기가 없어요. 화면 서버는 껐어요.)
timeout /t 4
