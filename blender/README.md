# Blender 인물과 국무회의 입장 장면

- `cabinet-characters.blend`: 인물 8명의 메시·재질·12개 관절과 걷기·착석 동작. 인물별 외형을 수정하는 원본입니다.
- `cabinet-entrance.blend`: 공식 사진을 참고한 세종실 형태의 회의 공간과 입장 애니메이션. Blender에서 열고 Space를 누르면 순서대로 진행합니다. 타임라인에 인물별 시작 위치가 표시됩니다.
- `../assets/cabinet/*.glb`: 웹에서 사용하는 실제 스킨 메시 모델. 캐릭터별 한 개의 애니메이션을 `Idle`, `Walk`, `SitDown`, `Seated` 구간으로 나누어 재생합니다.
- `../cabinet-layout.json`: 공간 근거 링크와 학습용 좌석·탁자 영역·입구 좌표. 웹과 Blender 입장 장면이 함께 참조합니다.

Blender 4.2.3 LTS에서 생성했습니다. 모델은 직접 만든 가상의 인물이며 특정 현직자의 얼굴을 본뜨지 않았습니다. 기본 대기·걷기·착석·앉은 자세를 구현했습니다. 얼굴 표정 연기나 발언 립싱크는 포함하지 않습니다.

## 재생

`cabinet-characters.blend`는 30fps, 1–95프레임입니다.

| 구간 | 프레임 |
| --- | --- |
| 대기 | 1–31 |
| 걷기 한 주기 | 32–62 |
| 착석 | 63–93 |
| 앉은 자세 | 94–95 |

`cabinet-entrance.blend`는 공간 전체의 이동을 키프레임으로 저장했습니다. 웹은 같은 모델의 관절 동작에 경로 이동을 결합하여 학생의 선택에 따라 순차 입장합니다. 웹에서 단계 이동·재시작을 하면 진행 중인 이동을 취소합니다. ‘입장 다시 보기’로 허용한 인물의 이동을 반복할 수 있습니다. 시스템의 동작 줄이기 설정에서는 바로 해당 위치로 배치합니다.

## 다시 생성

프로젝트 폴더에서 실행합니다. 프로젝트 내부 설치본은 정리했습니다. 아래 명령의 `blender`는 별도로 설치한 Blender 4.2 실행 경로로 바꿉니다.

```sh
blender --background --factory-startup --python-exit-code 1 --python blender/build_characters.py
node blender/export_entrance_motion.mjs
blender --background --factory-startup --python-exit-code 1 --python blender/build_entrance.py
node --test cabinet-model.test.mjs cabinet-motion.test.mjs cabinet-assets.test.mjs
```

생성 스크립트를 다시 실행하면 해당 `.blend`·`.glb`와 에셋 목록을 덮어씁니다. 실행에 쓰지 않는 미리보기 PNG는 생성하지 않습니다. Blender에서 직접 수정한 파일은 별도 이름으로 저장한 뒤 다시 생성합니다.

## 공간의 확인 수준

[공간 조사 기록](../cabinet-room-research.md)을 참조하세요. 청와대 세종실의 공식 사진에서 확인한 탁자 형태, 벽면, 색과 주요 장비를 반영했습니다. 실측 치수·정확한 좌석표·실제 출입구 위치를 복원한 것은 아닙니다. 외부 대기 줄과 심사문은 학습용입니다. Blender 원본의 상징·벽화·화면은 웹과 마찬가지로 자체 도형으로 간략화했습니다.

공간 확장판은 같은 인물·의자 크기를 유지하며, 주 회의석 간격과 바닥을 넓히고 별도 배석 책상 14석을 추가했습니다. 웹과 Blender 입장 장면 모두 `cabinet-layout.json`의 새 좌석·입구·통로 좌표를 사용합니다.

## 픽셀·복셀 캐릭터

현재 8명은 활동 카드의 16×22 픽셀 그림(`../characters.mjs`)을 입체로 만든 복셀 모델입니다. 네모난 실루엣과 눈·볼터치, 스카프·안경·리본·모자·멜빵바지를 같은 원본에서 가져옵니다. 이전의 둥근 인물 형태를 대체했습니다. 관절 12개와 동작 구간은 유지하며, 짧은 팔다리와 의자에 맞는 착석 높이를 적용했습니다.

`pixel-reference.json`에 Blender가 사용하는 색 사각형을 저장합니다. 안경의 얇은 테두리도 남도록 원본의 4배 해상도로 샘플링합니다. 카드 그림을 바꾼 뒤에는 Node에서 `sharp`를 사용할 수 있게 준비하고(필요하면 패키지 경로를 `NODE_PATH`로 지정), 프로젝트 폴더에서 `node blender/export_pixel_reference.mjs`를 실행합니다. 이후 위의 Blender 명령 두 개로 원본과 GLB를 재생성합니다. 저장된 JSON을 그대로 쓰면 Blender 생성 과정에 Sharp가 필요하지 않습니다.

## 입장과 착석 동작

`cabinet-motion.mjs`에서 웹의 동선을 계산하고, `export_entrance_motion.mjs`가 같은 동작을 30fps로 `entrance-motion.json`에 저장합니다. Blender 입장 장면은 이 좌표·회전·동작 프레임을 사용합니다. 동선이나 속도를 바꾼 뒤에는 해당 JSON과 입장 장면을 함께 재생성합니다.

처음과 끝은 약 0.45초 동안 가속·감속하며 모서리에서는 둥글게 돌아갑니다. 이동 0.65 모형 단위에 걷기 한 주기를 연결해 속도가 줄면 발과 팔의 박자도 느려집니다. 의자 옆에서 멈춰 0.32초 동안 자리를 바라본 뒤, 1.15초 동안 몸을 낮추고 도약해 팔걸이 위로 이동한 다음 부드럽게 내려앉습니다. 모델의 몸 흔들림·팔 흔들림·발 들기를 짧은 팔다리에 맞췄습니다. 실사 보행이나 발 접지 IK를 구현한 것은 아니며 복셀 인물에 맞춘 과장된 동작입니다.
