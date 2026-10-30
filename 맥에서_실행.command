#!/bin/bash
# 맥에서 파르티잔 인베스트먼트 켜기 — 이 파일을 더블클릭 (처음 한 번은 오른쪽 클릭 → 열기)
# 1) 화면을 로컬 웹서버(127.0.0.1:8792)로 브라우저에 열고  2) 중계기 실행기를 켬 (앱키·시크릿은 이 창에 직접 입력)
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 이 없어요. https://www.python.org 에서 파이썬을 설치한 뒤 다시 실행하세요."
  read -r -p "Enter 를 누르면 닫혀요" _
  exit 1
fi
python3 -m http.server 8792 --bind 127.0.0.1 >/dev/null 2>&1 &
WEB=$!
trap 'kill $WEB 2>/dev/null' EXIT
sleep 1
open "http://127.0.0.1:8792/partisan_investment.html"
echo "화면을 열었어요. 아래에서 중계기를 켭니다 (가짜 시세로 보려면 이 창을 닫고 python3 nh_bridge.py --demo)."
python3 nh_bridge.py --ask
