# 제미나이 주문용 문구 모음

[ASSET_ORDER.md](ASSET_ORDER.md)의 품목을 제미나이에 그대로 붙여 넣을 수 있게 정리한 문구다. 순서대로 대화에 넣으면 된다.

## 0. 먼저 알아 둘 것(제미나이에 맞춘 조정)

| 주문서 규칙 | 제미나이로 받을 때 | 나머지는 제가 처리 |
| --- | --- | --- |
| 투명 배경 PNG | 단색 **마젠타(#FF00FF)** 배경으로 받기 | 배경 지우기 |
| 정확한 픽셀 크기 | 크기는 신경 쓰지 않아도 됨 | 기준 칸에 맞춰 줄이고 자르기 |
| 선·마스크·명암 4층 | **완성본 한 장만** | 층 나누기 |
| SE·SW 2방향 | **SE 한 방향만** | 좌우 뒤집어 SW 만들기 |
| 뒷면 NE·NW | 등받이가 있는 가구만 따로 요청 | — |
| 한 장에 한 물체 | **한 장에 여러 개(격자 시트)** 가능 | 칸마다 잘라 이름 붙이기 |
| 이음매 없는 무늬 | 무늬는 1장씩 | 이음매 다듬기 |

- **첫 대화에 시안 이미지(승인된 그림체 기준 이미지)를 같이 올린다.** 그래야 같은 그림체가 유지된다.
- 한 대화에서 계속 이어서 주문한다. 새 대화로 바꾸면 그림체가 달라지기 쉽다.
- 그림체가 흔들리면 "첫 번째 결과와 같은 선 굵기·색감으로 다시"라고 말하면 된다.
- 결과물은 이 대화에 올려 주시거나 `games/morak-town/assets/incoming/` 폴더에 넣어 주시면 된다. 파일 이름은 아무렇게나 해도 된다. 번호(A1, B12…)만 알 수 있으면 된다.

---

## 1. 첫 메시지(그림체 고정) — 시안 이미지와 함께 붙여 넣기

```
I'm making game assets for a cozy Korean café-management game called "Morak Town".
The attached image is the APPROVED STYLE. Every asset you make in this chat must match it exactly.

STYLE RULES (apply to every image from now on):
- Fixed 2:1 isometric parallel projection (no perspective, no vanishing point), camera from the south-east, object front faces down-right (SE).
- Deep burgundy hand-ink outline #6B2427, outer contour thicker, inner details thinner, rounded line ends.
- Flat warm pastel colors (cream, coral, mustard, lavender, olive, soft teal). At most 2 flat tones per surface (light side / shaded side). No gradients, no glow, no bloom, no texture noise, no 3D render look.
- NO cast shadows on the ground, NO text, NO letters, NO logos, NO watermark.
- Solid flat magenta background #FF00FF filling the whole canvas, nothing else in the background.
- Objects must not touch each other or the image edge; leave clear magenta space around each one.
- Same scale for all furniture: a dining chair seat is about knee height of a slender adult.

Reply "OK" and wait for my lists.
```

## 2. 격자 시트 공통 문구

품목마다 아래 틀에 목록만 바꿔 넣는다.

```
Make ONE sprite sheet: a [COLS] x [ROWS] grid, one isolated object centered in each cell, all at the same scale and the same SE-facing isometric angle, solid magenta #FF00FF background, no grid lines drawn, no labels.
Objects (left to right, top to bottom):
1. ...
2. ...
```

- 한 장에 **6~12개**가 적당하다. 더 많으면 작아지고 흐려진다.
- 늘리는 가구(3조각)는 따로 3절 문구를 쓴다.

---

## 3. 주문 문구 — 1차(매장 짓기·꾸미기가 먼저 동작)

### 3-1. B 매장 가구 ★ (시트 3장)

**시트 B-가 (주방)**
```
Make ONE sprite sheet: a 4 x 2 grid ... (공통 문구)
Objects:
1. Home-style 2-burner gas stove on a short cabinet (small, simple)
2. Commercial 4-burner range with oven door below, stainless steel
3. High-power wok range with a big round flame ring, heavy steel
4. Small single-door under-counter fridge
5. Tall commercial double-door stainless fridge (taller than a person)
6. Tall glass-door aging fridge with visible shelves inside
7. Stainless double-bowl sink unit with faucet
8. Espresso machine with grinder on a short wooden cabinet
```

**시트 B-나 (홀 좌석)**
```
Make ONE sprite sheet: a 4 x 2 grid ... (공통 문구)
Objects:
1. Small round 2-seat café table, wooden top, single metal leg
2. Rectangular 4-seat dining table (2 cells long), wooden
3. Simple wooden dining chair, facing SE
4. Bistro café chair with curved metal back, facing SE
5. Cushioned armchair-style dining chair, facing SE
6. Round bar stool, tall
7. Coral upholstered booth bench section with high back, facing SE
8. Oven unit: compact countertop convection oven
```

**시트 B-다 (뒷모습)** — 등받이 가구는 뒷면도 필요
```
Same objects as items 3, 4, 5 and 7 of the previous sheet, but seen from behind (facing away from the camera, back side visible, facing NW). Same scale and style. 4 x 1 grid, magenta background.
```

### 3-2. 늘리는 가구(3조각) — 품목마다 1장

```
Make ONE sprite sheet, 4 x 1 grid, of a MODULAR [ITEM] made of interchangeable pieces that will be joined edge to edge in the game:
1. LEFT END piece
2. MIDDLE piece (repeatable: its left and right edges must join seamlessly to copies of itself)
3. RIGHT END piece
4. CORNER piece (L-shaped turn)
All pieces exactly the same height, depth and isometric angle, aligned on the same baseline, each one cell long. Magenta background, no labels.
```

[ITEM]에 넣을 것(1차): 
- B1 `order counter with wooden front panel and cream top`
- B2 `bakery glass display case with wooden base`
- B3 `pickup shelf, open wooden shelving for takeaway bags`
- B4 `kitchen base cabinet with flat stainless steel worktop`
- B7 `stainless steel sink counter`
- B15 `bar counter with footrest rail`
- B16 `coral upholstered sofa booth with high back`

### 3-3. A 짓기 재료

**벽(A1~A3)** — 왼쪽 벽면과 오른쪽 벽면을 한 장에
```
Make ONE sprite sheet, 4 x 3 grid, of MODULAR INTERIOR WALL pieces for a build mode, plain cream plaster, wall thickness visible on top edge, simple baseboard at the bottom:
Row 1 (wall running along the left/back-left side): 1 straight 1-cell wall, 2 outer corner, 3 inner corner, 4 wall end cap.
Row 2 (wall running along the right/back-right side): same 4 pieces mirrored.
Row 3: 1 low half-height partition wall (left), 2 same (right), 3 cut-down wall stub only knee-high (left), 4 same (right).
All full walls the same height (about 1.4 times an adult's height). Magenta background.
```

**문(A8)** — 한 장
```
Make ONE sprite sheet, 4 x 2 grid, of DOORS set into a short section of cream wall (wall on the left/back-left side, facing SE):
1 wooden front door, 2 glass door with wooden frame, 3 double door (2 cells wide), 4 shop entrance glass double door with transom window,
5 arched wooden door, 6 kitchen swing door with round window, 7 plain bathroom door, 8 sliding glass door (2 cells wide).
Magenta background.
```

**창문(A9)** — 한 장
```
Same as the door sheet, but WINDOWS set into a short section of cream wall:
1 small square window, 2 large 2-cell window, 3 floor-to-ceiling 3-cell window, 4 arched window,
5 shop display window (3 cells wide, low sill), 6 bay window, 7 small high vent window, 8 window with iron grille.
Daytime, glass pale blue-grey. Magenta background.
```
그다음 같은 대화에서:
```
Now the same 8 windows at night: identical shapes and positions, but the glass glows flat soft butter yellow (#FFE8A3) as if lights are on inside. No glow spilling outside the frame.
```

**계단(A10)**
```
Make ONE sprite sheet, 3 x 1 grid: 1 straight wooden staircase with railing, 2 L-shaped staircase with landing, 3 small spiral staircase with metal railing. SE-facing, magenta background.
```

**울타리(A13)** — 3-2의 3조각 문구로 `wooden picket fence`, `wrought iron fence`, `trimmed green hedge` 각각. 대문은:
```
One sheet, 3 x 1: a wooden garden gate, an iron gate, a hedge arch, each one cell wide. Magenta background.
```

### 3-4. 무늬(A4·A6·A7·A11) — 1장에 1개씩

무늬는 기울이지 않고 **위에서 똑바로 본 평면**으로 받는다(엔진이 벽·바닥 모양으로 기울임).

```
Seamless tileable texture, flat top-down view, square, no perspective, no shading, no lighting, fills the whole image edge to edge (no magenta).
Warm pastel palette, any lines in thin soft burgundy. Pattern: [PATTERN]
```

[PATTERN] 목록(1차 필수만, 나머지는 2차):
- 벽지: `plain cream plaster` · `soft coral plaster` · `thin vertical cream and sage stripes` · `small mustard flower print on cream` · `vertical light wood panels` · `white subway tiles` · `exposed warm red brick` · `lavender plaster`
- 바닥: `light oak wood planks` · `dark walnut herringbone parquet` · `cream and terracotta checkerboard tiles` · `white hexagon tiles` · `terrazzo with small colored chips` · `smooth grey concrete` · `soft woven beige carpet` · `cream marble with faint veins`
- 바깥: `short green grass` · `irregular stone flagstones` · `wooden deck boards` · `pale sand`
- 띠 무늬(가로로 긴 직사각형): `wooden wainscoting panel strip` · `white crown molding strip`

### 3-5. E UI 아이콘 — 제미나이보다 제가 만드는 게 낫다

아이콘은 선만 있는 SVG라 제가 코드로 그리는 편이 빠르고 깔끔하다(지금 게임 아이콘도 그렇게 만듦). 그림체를 바꾸고 싶으면 아래 문구로 **견본 1장**만 받아 주시면 그 느낌에 맞춰 전부 만든다.
```
A sheet of 12 simple line icons for a build-mode toolbar: wall, room, eraser, paint roller, wallpaper, door, window, stairs, roof, move arrows, rotate, color palette. Single-weight burgundy #6B2427 rounded lines, no fill, cream background, 4 x 3 grid.
```

---

## 4. 2차 주문(집 가구·나머지 매장 가구)

3-1 시트 문구에 ASSET_ORDER.md의 B 나머지·C 목록을 8개씩 나눠 넣는다. 예:

**거실 시트**
```
Make ONE sprite sheet: a 4 x 2 grid ... (공통 문구)
Objects: 1 two-seat sofa (facing SE), 2 single armchair, 3 round coffee table, 4 small side table, 5 low TV cabinet with a small TV, 6 tall bookshelf filled with books, 7 glass display cabinet, 8 rectangular woven rug (lying flat).
```
등받이가 있는 1·2번은 3-1의 "뒷모습" 문구로 한 번 더. 소파·책장·TV장은 3-2 3조각 문구로 따로.

같은 방식의 시트: 침실 · 부엌 · 욕실 · 서재·취미 · 아이 방 · 조명(낮 1장 + 밤 불빛 1장) · 커튼 · 벽 장식 · 작은 물건 · 마당·옥상 · 업종 장비(B10).

## 5. 3차 주문(사람 꾸미기)

사람은 층마다 프레임이 딱 맞아야 해서, 이 단계 전에 제가 **기준 틀 시트**를 먼저 만들어 드린다. 그때 이 파일에 문구를 추가한다.

## 6. 받은 뒤 순서
1. 결과물을 올려 주시면 제가 배경 지우기 → 칸 맞추기 → 좌우 뒤집기 → 층 나누기를 한다.
2. `assets/`에 정리하고 엔진에 불러오기를 붙인다(그림이 없는 물체는 지금 그림으로 대신 그림).
3. 1차가 들어오면 짓기 모드(벽 그리기·문 끼우기·바닥 칠하기)와 꾸미기 모드(늘리기·색 바꾸기)를 만든다.
