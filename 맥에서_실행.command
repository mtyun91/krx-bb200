#!/bin/bash
# 맥에서 파르티잔 인베스트먼트 켜기 — 이 파일을 더블클릭 (처음 한 번은 오른쪽 클릭 → 열기)
# 1) 화면을 로컬 웹서버(127.0.0.1:8792)로 브라우저에 열고  2) 중계기 실행기를 켬 (앱키·시크릿은 이 창에 직접 입력)
# 가짜 시세로 시험: bash 맥에서_실행.command --demo   ·   실계좌 주문까지: bash 맥에서_실행.command --trade
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "import sys" >/dev/null 2>&1; then
  echo "파이썬이 없어요. https://www.python.org 에서 macOS용 파이썬을 설치한 뒤 이 파일을 다시 더블클릭하세요."
  read -r -p "Enter 를 누르면 닫혀요" _
  exit 1
fi
# 화면 서버 — 이미 켜져 있으면 그대로 씀
if ! lsof -nP -iTCP:8792 -sTCP:LISTEN >/dev/null 2>&1; then
  python3 -m http.server 8792 --bind 127.0.0.1 >/dev/null 2>&1 &
  WEB=$!
  trap 'kill $WEB 2>/dev/null' EXIT
  sleep 1
fi
open "http://127.0.0.1:8792/partisan_investment.html"
echo
echo "화면을 브라우저에 열었어요: http://127.0.0.1:8792/partisan_investment.html"
echo "아래에서 중계기를 켭니다. 다 켜지면 나오는 '중계기 토큰'을 화면의 연결 창에 넣으세요."
echo "끌 때는 이 창에서 Ctrl+C 를 누르세요 (창을 닫아도 꺼져요)."
echo
MODE="--ask"
case " $* " in *" --demo "*) MODE="" ;; esac
# caffeinate: 중계기가 켜져 있는 동안 맥이 잠들지 않게 (덮개를 닫으면 전원 연결 없이는 잠들 수 있음)
caffeinate -i python3 nh_bridge.py $MODE "$@"
read -r -p "중계기가 멈췄어요. Enter 를 누르면 닫혀요" _
