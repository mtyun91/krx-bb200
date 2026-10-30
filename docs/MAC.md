# 맥에서 쓰기

화면(`partisan_investment.html`)과 중계기(`nh_bridge.py`)는 맥에서도 그대로 돌아간다. 중계기는 보안상 그 컴퓨터 안(127.0.0.1)에서만 받으므로, **맥에서 볼 때는 맥에서도 중계기를 켠다.**

## 처음 한 번

1. 파이썬 설치: https://www.python.org/downloads/ (설치 뒤 `응용 프로그램/Python 3.x/Install Certificates.command`를 한 번 더블클릭 — 안 하면 시세·뉴스 받기에서 인증서 오류가 날 수 있음)
2. 프로젝트 받기 (터미널):
   ```bash
   brew install gh && gh auth login
   gh repo clone mtyun91/krx-bb200 ~/partisan
   ```
3. `~/partisan/맥에서_실행.command`를 오른쪽 클릭 → 열기 (처음 한 번만 확인 창이 뜸)

## 매일

- `맥에서_실행.command` 더블클릭 → 브라우저에 화면이 열리고 터미널 창에서 중계기가 켜짐 → 앱키·시크릿 입력 → 화면의 '중계기 연결'에 터미널이 보여 준 토큰 입력
- 코드 최신으로: `cd ~/partisan && git pull`

## 윈도우와 같은 계좌 쓰기

모의 계좌·설정·결재 기록은 중계기 폴더의 `krx_state.json` 하나에 저장된다. 두 컴퓨터가 **같은 파일**을 보게 하면 이어서 쓸 수 있다.

- 구글 드라이브(또는 iCloud·원드라이브) 데스크톱 앱으로 같은 폴더를 두 컴퓨터에 동기화하고, 중계기를 켤 때 그 파일을 가리킨다:
  - 맥: `KRX_STATE=~/Google\ Drive/내\ 드라이브/파르티잔/krx_state.json python3 nh_bridge.py --ask`
  - 윈도우: `set KRX_STATE=G:\내 드라이브\파르티잔\krx_state.json` 후 `python nh_bridge.py --ask`
- 한 번만 옮기려면: 연결 창의 '기록 내보내기' → 다른 컴퓨터에서 '기록 불러오기'.
- 두 컴퓨터에서 동시에 켜 두면 나중에 저장한 쪽이 이기므로(충돌 시 알림), 한 번에 한 대만 쓰는 게 안전하다.

받아 둔 일봉 캐시는 브라우저 안에 저장되므로 맥에서는 처음에 '시세 불러오기'로 다시 받는다.
