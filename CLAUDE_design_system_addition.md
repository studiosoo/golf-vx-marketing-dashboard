# CLAUDE.md — 디자인 시스템 섹션 (추가분)

> 이 섹션을 기존 CLAUDE.md 파일에 추가한다.
> 위치: 기존 "Layer 2: App-style dashboard implementation" 섹션 뒤에 삽입.
> 이 내용은 Claude Code, Genspark, 또는 다른 어떤 코드 작업 도구가 대시보드를 수정할 때도
> 반드시 준수해야 하는 **기준 문서**다.

---

## Design System — Golf VX App Reference (v1.0, March 2026)

> **권위 우선순위:** 2026 Style Guide > 2024 Brand Guidelines > 이 섹션
> 코드 작업 시 이 섹션의 디자인 토큰과 패턴을 반드시 따른다.
> 원본 참조 문서: `GolfVX_App_Design_System.md` (Studio Soo, March 2026)

---

### DS-1. 색상 시스템

#### Layer 1: 공식 브랜드 (Brand Guidelines 기준)
| 토큰 | 값 | 역할 |
|---|---|---|
| Brand Yellow | `#FFCD00` | 공식 브랜드 옐로우 (앱, 인쇄물) |
| Text Dark | `#1A1A1A` | 주요 텍스트 (라이트 배경) |

#### Layer 2: 대시보드 구현 (Dashboard Implementation)
| CSS 변수 | 값 | 역할 |
|---|---|---|
| `--gvx-yellow` | `#F5C72C` | CTA, active 탭, toggle ON, Max badge — 장식 금지 |
| `--gvx-yellow-muted` | `rgba(245,199,44,0.12)` | Key Insights 하이라이트 배경 |
| `--gvx-yellow-border` | `rgba(245,199,44,0.6)` | Key Insights 하이라이트 left-border |
| `--gvx-bg-page` | `#1A1A1A` | 페이지 최외곽 배경 |
| `--gvx-bg-surface` | `#242424` | 카드, 패널 |
| `--gvx-bg-elevated` | `#2E2E2E` | 호버, 드롭다운 |
| `--gvx-text-primary` | `#F0F0F0` | 제목, 숫자, 주요 텍스트 |
| `--gvx-text-secondary` | `#888888` | 서브라벨, 메타데이터 |
| `--gvx-text-tertiary` | `#555555` | 날짜, 단위, 비활성 |
| `--gvx-border` | `#2E2E2E` | 카드 테두리 |
| `--gvx-divider` | `#333333` | 행 구분선 |
| `--gvx-blue` | `#4A90E2` | 링크, In Progress, 선택 |
| `--gvx-green` | `#4ADE80` | 완료, 긍정 |
| `--gvx-purple` | `#A78BFA` | Monitoring |
| `--gvx-orange` | `#F5A623` | Awaiting, Individual badge |

#### 캠페인 색상
| CSS 변수 | 값 | 캠페인 |
|---|---|---|
| `--gvx-campaign-trial` | `#4ADE80` | Trial Conversion |
| `--gvx-campaign-membership` | `#60A5FA` | Membership Acquisition |
| `--gvx-campaign-retention` | `#A78BFA` | Member Retention |
| `--gvx-campaign-b2b` | `#FB923C` | B2B & Events |

#### ⚠️ Yellow 사용 규칙 (앱 디자인 시스템 7.1 준수)
- Yellow(`#F5C72C`)는 **CTA, active 탭 underline, toggle ON, Max badge**에만 사용
- **절대 금지:** 장식용 fill, 데이터 시각화 바, 일반 아이콘 색상, 텍스트 색상
- 화면 전체 surface 대비 yellow 면적 최대 20%
- Yellow 텍스트 사용 금지 — 강조는 underline 또는 `--gvx-yellow-muted` 배경으로

---

### DS-2. 타이포그래피

#### 폰트 패밀리
- **영어:** Inter (primary, 2026 Brand Guide 기준)
- **한국어:** Pretendard (secondary)

#### 사이즈 토큰
| CSS 변수 | 값 | 용도 |
|---|---|---|
| `--gvx-text-xs` | 11px | 타임스탬프, 배지, 각주, 축 레이블 |
| `--gvx-text-sm` | 13px | 바디, 테이블 행, 메타데이터, 서브라벨 |
| `--gvx-text-base` | 15px | 카드 바디, 설명, 폼 라벨 |
| `--gvx-text-lg` | 18px | 섹션 헤더, 카드 제목 |
| `--gvx-text-xl` | 22px | KPI 숫자 (카드 레벨) |
| `--gvx-text-2xl` | 28px | KPI 숫자 (페이지 레벨), 주요 통계 |
| `--gvx-text-page` | 20px | 페이지 타이틀 h1 |

#### 웨이트 토큰
| CSS 변수 | 값 |
|---|---|
| `--gvx-weight-regular` | 400 |
| `--gvx-weight-medium` | 500 |
| `--gvx-weight-semibold` | 600 |
| `--gvx-weight-bold` | 700 |

#### 숫자 + 단위 패턴 (앱 기준)
```html
<!-- 앱: bold 숫자 + 작은 lighter 단위 -->
<span class="kpi-number">206.0</span>
<span class="kpi-unit">yd</span>

/* kpi-number: --gvx-text-xl or 2xl, bold, --gvx-text-primary */
/* kpi-unit: --gvx-text-sm, regular, --gvx-text-secondary */
```

---

### DS-3. 컴포넌트 패턴

#### 카드
```css
background: var(--gvx-bg-surface);
border-radius: 10px;
border: 1px solid var(--gvx-border);
padding: 16–20px;
/* shadow OR border — 둘 다 사용하지 않는다 */
```

#### 탭 네비게이션 (앱 3.2 기준)
```css
/* active */
border-bottom: 2px solid var(--gvx-yellow);
color: var(--gvx-text-primary);

/* inactive */
color: var(--gvx-text-tertiary);
border: none;
```

#### 배지 (Status Pills)
| 배지 | 배경 | 텍스트 |
|---|---|---|
| In Progress | transparent | `#4A90E2` |
| Awaiting | transparent | `#F5A623` |
| Executed | transparent | `#4ADE80` |
| Ended / Archived | transparent | `#555555` |
| Trial | `rgba(74,222,128,0.15)` | `#4ADE80` |
| Membership | `rgba(96,165,250,0.15)` | `#60A5FA` |
| Retention | `rgba(167,139,250,0.15)` | `#A78BFA` |
| B2B | `rgba(251,146,60,0.15)` | `#FB923C` |

배지 스타일: `border-radius: 9999px; font-size: var(--gvx-text-xs); font-weight: 600;`
**outline-only 배지 사용 금지** — 항상 filled pill.

#### Key Insights 하이라이트 (앱 key phrase underline 대시보드 적용)
```css
/* 다크 배경이므로 underline 대신 하이라이트 카드 패턴 */
background: var(--gvx-yellow-muted);
border-left: 2px solid var(--gvx-yellow-border);
border-radius: 4px;
padding: 12px 16px;
```

#### 빈 상태 (Empty State, 앱 기준)
```tsx
// 모든 빈 상태는 icon + text 패턴
<div className="flex flex-col items-center gap-3 py-10 text-center">
  <div className="rounded-full border border-[var(--gvx-border)] p-3
                  text-[var(--gvx-text-tertiary)]">
    {icon}
  </div>
  <p style={{ fontSize: 'var(--gvx-text-sm)', color: 'var(--gvx-text-secondary)' }}>
    {message}
  </p>
</div>
```

#### 리스트 행
```
높이: 36–40px (테이블), 56px (설정/프로필 리스트)
레이아웃: 레이블 left / 값 right (chevron 있으면 값 왼쪽)
구분선: 1px solid var(--gvx-divider) bottom
```

#### CTA 버튼 계층
```
Primary:    bg var(--gvx-yellow), text #1A1A1A, semibold
Secondary:  bg transparent, border 1px var(--gvx-yellow), text var(--gvx-yellow)
Ghost:      bg transparent, border 1px var(--gvx-border), text var(--gvx-text-secondary)
Destructive: bg transparent, border 1px #F87171, text #F87171
```

#### 차트 색상
```
기본 데이터:  #60A5FA (blue), #4ADE80 (green), #A78BFA (purple) — 85% opacity
Max 표시:    var(--gvx-yellow) pill badge
Min 표시:    #3A3A3A dark pill badge
방향/음수:   #FFB3B3 (pink/salmon)
Reference:   dashed #555555
Yellow bar 사용 금지 — yellow는 MAX callout에만
```

---

### DS-4. 레이아웃 & 간격

```
기본 단위: 4px
권장 배수: 8 / 16 / 24 / 32 / 48px
카드 padding: 16–20px
섹션 gap: 24px
페이지 padding: 24–32px
```

---

### DS-5. 코드 작업 규칙

이 섹션은 Claude Code, Genspark, 또는 다른 어떤 도구가 대시보드를 수정할 때 반드시 따른다.

1. **색상 하드코딩 금지** — 반드시 CSS 변수(`--gvx-*`) 사용
2. **Yellow 장식 금지** — CTA, active 상태 외 yellow 사용 시 즉시 제거
3. **인라인 스타일 최소화** — 스타일은 CSS 변수 + Tailwind arbitrary value 사용
4. **타이포그래피 직접 px 금지** — 반드시 `--gvx-text-*` 토큰 사용
5. **`venueId` 필수** — 모든 DB 쿼리에 venueId 포함 (멀티테넌트 규칙)
6. **배지는 filled pill** — outline-only 배지 생성 금지
7. **빈 상태** — "No data" 단독 텍스트 금지, EmptyState 컴포넌트 사용
8. **숫자 + 단위** — 숫자 bold/large + 단위 regular/small 패턴 준수
9. **라우트 변경 금지** — UI 레이블 변경이 필요해도 route path는 유지
10. **프롬프트/지시문에 없는 수정 금지** — 명시된 범위 외 변경 없음

---

### DS-6. 참조 문서

| 문서 | 위치 | 역할 |
|---|---|---|
| GolfVX_App_Design_System.md | Studio Soo 프로젝트 | 앱 디자인 언어 원본 레퍼런스 (v1.0) |
| GolfVXBrandGuidelines202601201TK.pdf | 프로젝트 파일 | 2026 공식 브랜드 가이드 (Layer 1) |
| GolfVX_App_Design_System.docx | Studio Soo 프로젝트 | 위 md의 Word 버전 |
