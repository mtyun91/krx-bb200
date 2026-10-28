@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
python tools\make_pack.py
if exist gemini_pack explorer gemini_pack
pause
