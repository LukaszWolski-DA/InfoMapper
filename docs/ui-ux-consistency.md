## Spójność UI/UX w InfoMapper – analiza i wytyczne

### Cel dokumentu
- **Ujednolicenie wyglądu i zachowania** kluczowych elementów UI: filtry, przyciski, drzewa (Sources/Object/Requirements/Model), wskaźniki/badges i panele.
- **Wspólne style (one style, many contexts)**: jeden spójny styl bazowy i **warianty kontekstowe** bez zmiany metryki (wysokości, typografii, spacing).
- **Ułatwienie refaktoryzacji** i przyszłej rozbudowy (tokeny, warianty, checklisty jakości, roadmapa uporządkowania).

---

## Design tokens i fundamenty

### Typografia
- **Zasada ogólna**: 12px we wszystkich elementach aplikacji.
- **Wyjątki**:
  - **Typy danych / linie pomocnicze w drzewach**: 10px (muted kolor)
  - **Nagłówki belki głównej (app bar headings)**: 14px (średnia waga/bold wg kontekstu)
- **Drzewa (Object/Model/Sources/Requirements)**: nazwy (Koncept/Encja/Atrybut) – 12px; metadane po prawej – 10px
- **Kontrolki (filtry, przyciski, checkboxy, selecty)**: 12px
- **Badges/wskaźniki**: 10–11px (dopasowane do linii tekstu, preferowane 11px)

### Metryki i promienie
- **Wysokość kontrolek**: 28px (min target 28–32px), ikony wyśrodkowane pionowo
- **Odstępy poziome**: wewnątrz kontrolki 8–12px, między kontrolkami 8px
- **Promień zaokrągleń**: 6px (kontrolki, pola, badge: 4–6px)

### Kolorystyka (warianty bazowe)
- **Primary**: akcje główne (np. Save) – niebieski
- **Danger**: akcje destrukcyjne (Delete/Remove) – czerwony
- **Success**: powodzenie/zatwierdzenie (np. zielony przy Save jako alternatywa) – zielony
- **Neutral**: drugorzędne/anulowanie – szarości/biel z czarnym tekstem
- **Ghost/Icon**: ikonowe wierszowe (np. Expand/Collapse) – szarości, hover bez obwódek

### Ikony
- **Expand/Collapse**: „▶/▼” z tooltipe’em, rozmiar zgodny z linią tekstu 12–14px
- **Menu kontekstowe**: „…”, tylko w wierszach z akcjami dodatkowym

---

## Komponenty bazowe i ich warianty

-### Filtry (one style, many contexts)
- **Wariant kanoniczny (wg karty Model)**:
  - Klasy Tailwind: `w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`
  - Metryki: wysokość ~28px (z `py-1.5`), font 12px (`text-xs`), promień 6px (`rounded-md`)
- **Stany**: default, hover, focus (focus-ring 1px niebieski), disabled, loading
- **Elementy**:
  - **TextInput / Search**: placeholder w szarości; w drzewach auto‑expand dopasowanych gałęzi
  - **Select**: ten sam rozmiar co input; listy z max‑wysokością i przewijaniem
  - **Checkbox**: rozmiar klikalnego obszaru min 28px (nie tylko sama ikona)
  - **Toggle** (opcjonalnie): zgodny rozmiar i promień
- **Konteksty użycia** (przykłady):
  - **Model**: All / Keys (PK/FK)
  - **Mapping**: All / Mapped / Unmapped
  - **Object/Model**: Has PK, Has PII, Only issues
  - **Globalne**: wyszukiwarka po nazwach konceptów/encji/atrybutów
- **Zachowania**:
  - Wyszukiwarka dopasowuje po nazwach i atrybutach; **auto‑expand** dopasowanych gałęzi
  - Zachowanie stanu filtrów per panel w `localStorage` (nazwa‑klucza stabilna)

### Przyciski (one height, one font, contextual colors)
- **Wspólne**: wysokość 28px (globalnie, również na formularzach/modalach), font 12px, promień 6px, padding horyz. 8–12px
- **Warianty**:
  - **Primary** (niebieski): główne akcje (Save, Confirm, Apply)
  - **Danger** (czerwony): destrukcyjne (Delete, Remove)
  - **Success** (zielony): potwierdzające, pozytywne statusy
  - **Neutral** (szary/biały): drugorzędne (Cancel, Close)
  - **Ghost/Icon** (szary tekst): ikonowe wierszowe (Expand/Collapse „▶/▼”, menu „…”) – bez obwódek
- **Grupy przycisków**: spójne odstępy 8px; kolejność: Primary → Secondary/Neutral → Danger; po prawej strony paneli narzędziowych

### Drzewa (one display style, functional variants)
- **Wspólne zasady**:
  - Typografia jak w sekcji „Typografia” (Koncept/Encja/Atrybut)
  - **Brak hover‑tła i focus ring** dla wierszy encji/atrybutów (wyjątki zgodnie z funkcją)
  - **Expand/Collapse** po prawej: „▶/▼” (wariant Ghost/Icon)
  - **Wcięcia**: atrybuty z dodatkowym wcięciem (`ml-8` jako referencja wizualna)
  - **Wskaźniki**: PK/FK/PII badge’y za nazwą (grupa `gap-1`, przesunięcie `ml-2`)
  - **Panel lewy**: domyślnie 340px, resize 220–560px, stan w `localStorage`; tło delikatnie szare (`Neutral 50`), maksymalna szerokość do 40% szerokości ekranu.
  - **Wyrównanie do lewej**: lewa krawędź pierwszego poziomu drzewa = lewa krawędź obszaru treści pod toolbarem (taki sam `padding-left` panelu, np. 12–16px). Przyciski toolbara (np. „Expand all”) nie przesuwają treści drzewa.
  - **Wcięcia poziomów (krok)**: `tree.indent.step = 16px`.
    - Object/Model: Concept (L0 = 0), Entity (L1 = +16px), Attribute (L2 = +32px).
    - Sources: Source System (L0), Database (L1), Schema (L2), Table/View (L3), Column (L4).
    - Requirements: Requirement Name (L0), Description w linii podrzędnej (L1 = +16px, 10–11px muted).
  - **Truncation długich nazw**: nazwy węzłów jednolinijkowo z `truncate`; pełna treść dostępna w tooltipie (hover/focus). Tooltip pojawia się z niewielkim opóźnieniem, szerokość max 320px, łamanie słów.

- **Warianty funkcjonalne**:
  - **Object**:
    - Koncept: tło w kolorze konceptu z lekką przezroczystością (hex+alpha `26`), bez separatora
    - Encja: wiersz bez hover‑tła/focus‑ring; nazwa 12px bold; stereotype po prawej 11px szary
    - Atrybut: nazwa 12px; data type 10px szary po prawej; bez kropek/bullets
    - Akcje wierszowe: Expand/Collapse, menu „…”
    - DnD: dozwolony dla encji/atrybutów (zachowanie bez dodatkowych efektów hover)
  - **Model**:
    - Koncept: tło z przezroczystością, separator border‑b pozostawiony
    - Encja/Atrybut: jak wyżej; atrybuty startują dalej niż encja
  - **Sources**:
    - Hierarchia: Source System → Baza → Schemat → Tabela/Widok → Kolumna
    - Kolumna: właściwości po prawej (typ, precision) w linii pomocniczej 10px szary
  - **Requirements** (gdy dostępne): analogiczny układ, nazewnictwo i metryki

### Wskaźniki i badge’y
- **Typy**: PK, FK, PII, „No PK” (tekst czerwony na białym), dodatkowe statusy wg potrzeb
- **Rozmiar**: 10–11px; **Odstępy**: `gap-1`; **Pozycja**: za nazwą, grupa przesunięta `ml-2`
- **Kolory**: spójne z paletą statusów (Success/Warning/Danger/Info)

---

## Konteksty i use case’y

### Object
- **Drzewo**: jak w „Object” (tło konceptu, brak separatorów, menu „…”) 
- **Filtry**: Has PK, Has PII, Only issues; wyszukiwarka rozszerza dopasowane gałęzie
- **Przyciski**: Expand current only / Expand all / Collapse all (Primary/Neutral), ikonowe Expand/Collapse w wierszach
- **Panel Details (Entity)**:
  - `Name` (input): wysokość 28px (spójnie z `size.input.height`)
  - `Description` (textarea): domyślnie 3 wiersze = 84px (3 × 28px), min. 2 wiersze = 56px
  - `Stereotype` (dropdown/select): wysokość 28px, te same klasy co filtr (kanon Model), lista min‑width = szerokość kontrolki, max‑height 240px z przewijaniem

### Model
- **Diagram**: zoom, pan, relacje (Bezier, kardynalności), edycja relacji
- **Tło diagramu**: białe (`diagram.canvas.bg` = Neutral 0)
- **Panel tytułowy**: tytuł (14px), krótka instrukcja (12px, muted), przyciski: `Export JSON` (Neutral/Primary), `Import JSON` (Neutral/Primary), `Clear all` (Danger)
- **Filtry**: All / Keys (PK/FK)
- **Drzewo boczne**: jak „Model” (separator przy Koncepcie)
- **Przyciski**: narzędzia diagramu (Primary/Neutral), ikonowe dla akcji lokalnych

### Sources
- **Drzewo**: Source System → Baza → Schemat → Tabela/Widok → Kolumna; kolumna z typem danych po prawej (10px)
- **Filtry**: wyszukiwarka, ewentualnie typ obiektu (tabela/widok), zakres źródła
- **Przyciski**: Import/Export (Primary), odśwież (Neutral), ikonowe Expand/Collapse

### Requirements
- **Drzewo**: analogiczne metryki i wcięcia; etykiety statusu wymagania jako badge
- **Filtry**: status, właściciel, tagi; wyszukiwarka
- **Przyciski**: dodawanie/edycja wymagania (Primary), usuwanie (Danger)

### Mapping
- **Karty**: przeglądanie i łączenie elementów; linie konektorów
- **Tło diagramu**: białe (`diagram.canvas.bg` = Neutral 0)
- **Panel tytułowy**: tytuł (14px), krótka instrukcja (12px, muted), przyciski: `Export JSON`, `Import JSON`, `Clear all` (jak w istniejącym diagramie Mapping)
- **Filtry atrybutów**: All / Mapped / Unmapped
- **Przyciski**: zapisz mapowania (Primary/Success), usuń połączenie (Danger), narzędzia widoku (Neutral)

---

## Nazewnictwo i słowniczek (konwencja)
- **Koncept**: grupa logiczna encji
- **Encja**: logiczna tabela/widok w modelu
- **Atrybut**: kolumna encji
- **Stereotype**: dodatkowa etykieta roli encji
- **PK/FK**: klucze (Primary/Foreign Key)
- **PII**: dane osobowe; flaga na atrybucie propagowana przez mapowania
- **No PK**: encja bez klucza głównego (status problemowy)
- **Mapping**: połączenia atrybut→atrybut / obiekt→obiekt
- **Relationship**: relacja między encjami w modelu (kardynalności, kierunek)
- **Source System/Baza/Schemat/Tabela/Kolumna**: hierarchia metadanych źródła

Konwencje nazewnictwa UI (przykładowe): `Filter[Context]`, `Button[Variant]`, `Tree[Domain]`, `Badge[Type]` – spójne prefiksy ułatwiają wyszukiwanie i re‑use.

---

## Stany, dostępność i interakcje
- **Focus**: wyraźny focus-ring dla wszystkich interaktywnych elementów
- **Klawiatura**: Tab/Shift+Tab, Enter/Space (aktywacja), strzałki dla drzew (rozwiń/zwiń), F3/Enter dla wyszukiwania
- **Kontrast**: zgodność z WCAG AA dla tekstu i ikon
- **Hit area**: min 28×28px; także dla ikon Expand/Collapse
- **Tooltips**: dla ikon bez etykiety tekstowej (np. „▶/▼”, „…”) 

---

## Checklisty QA (przed releasem styli/komponentów)
- **Metryki**: wszystkie filtry i przyciski mają wysokość 28px, font 12px
- **Kolory**: warianty (Primary/Danger/Success/Neutral/Ghost) zgodne z paletą
- **Drzewa**: typografia i wcięcia spójne; brak zbędnych hoverów/focusów
- **Wyszukiwarka**: auto‑expand dopasowań w drzewach działa w każdym kontekście
- **Badge**: PK/FK/PII/No PK rozmiar 10–11px, pozycja `ml-2`, `gap-1`
- **Panele**: szerokości lewego panelu pamiętane w `localStorage`
- **A11y**: focus-ring, kontrast, nawigacja klawiaturą

---

## Roadmap refaktoryzacji (UI spójność)
1) **Tokenizacja**: wyprowadzić zmienne (typografia, wysokości, kolory, spacing, promienie)
2) **Komponenty bazowe**: `Filter*`, `Button*`, `Tree*`, `Badge*` z wariantami kontekstowymi
3) **Zastąpienie stylów ad‑hoc**: zamienić istniejące klasy na warianty komponentów
4) **Zapis stanu**: ujednolicić klucze `localStorage` dla paneli i filtrów
5) **Testy wizualne i a11y**: checklisty + snapshoty (przykładowe stany)
6) **Dokumentacja**: krótkie story/examples per komponent i wariant

---

## Załączniki referencyjne (stan obecny – skrót)
- **Przyciski**: Add/Expand/Collapse/Table/Details (niebieskie), Delete/Remove (czerwone), Save (zielone), Cancel (białe/czarne)
- **Czcionki w drzewach**: Koncept 12px, Encja 12px (bold), Atrybut 10px (linia pomocnicza)
- **Drzewa – Object/Model**: expand „▶/▼”, panel 340px z resize, badge PK/FK/PII, No PK (czerwony na białym)
- **Filtry – logika**: Has PK, Has PII, Only issues; All/Keys; All/Mapped/Unmapped; wyszukiwarka z auto‑expand

---

## Paleta i tokeny kolorów

### Paleta bazowa (hex)
- Primary (Blue): 50 `#EFF6FF`, 100 `#DBEAFE`, 200 `#BFDBFE`, 300 `#93C5FD`, 400 `#60A5FA`, 500 `#3B82F6`, 600 `#2563EB`, 700 `#1D4ED8`, 800 `#1E40AF`, 900 `#1E3A8A`
- Success (Green): 50 `#ECFDF5`, 100 `#D1FAE5`, 200 `#A7F3D0`, 300 `#6EE7B7`, 400 `#34D399`, 500 `#10B981`, 600 `#059669`, 700 `#047857`, 800 `#065F46`, 900 `#064E3B`
- Danger (Red): 50 `#FEF2F2`, 100 `#FEE2E2`, 200 `#FECACA`, 300 `#FCA5A5`, 400 `#F87171`, 500 `#EF4444`, 600 `#DC2626`, 700 `#B91C1C`, 800 `#991B1B`, 900 `#7F1D1D`
- Warning (Amber): 50 `#FFFBEB`, 100 `#FEF3C7`, 200 `#FDE68A`, 300 `#FCD34D`, 400 `#FBBF24`, 500 `#F59E0B`, 600 `#D97706`, 700 `#B45309`, 800 `#92400E`, 900 `#78350F`
- Info (Sky): 50 `#F0F9FF`, 100 `#E0F2FE`, 200 `#BAE6FD`, 300 `#7DD3FC`, 400 `#38BDF8`, 500 `#0EA5E9`, 600 `#0284C7`, 700 `#0369A1`, 800 `#075985`, 900 `#0C4A6E`
- Neutral (Gray): 50 `#F9FAFB`, 100 `#F3F4F6`, 200 `#E5E7EB`, 300 `#D1D5DB`, 400 `#9CA3AF`, 500 `#6B7280`, 600 `#4B5563`, 700 `#374151`, 800 `#1F2937`, 900 `#111827`

### Tokeny semantyczne
- `color.text.primary` = Neutral 800
- `color.text.muted` = Neutral 500
- `color.text.inverse` = Neutral 50
- `color.bg.canvas` = Neutral 50
- `color.bg.surface` = Neutral 100
- `color.border.default` = Neutral 200
- `color.border.emphasis` = Neutral 300
- `color.ring.focus` = Primary 500
- `opacity.focusRing` = 0.35

### Tokeny komponentowe (mapowanie na paletę)
- ### Tokeny typografii
- `font.size.base` = 12px
- `font.size.dataType` = 10px
- `font.size.appBarHeading` = 14px
- `font.weight.heading` = 600 (lub 700 w zależności od projektu)
- `font.weight.base` = 400–500

- Button Primary:
  - `button.primary.bg.default` = Primary 500
  - `button.primary.bg.hover` = Primary 600
  - `button.primary.bg.active` = Primary 700
  - `button.primary.text` = Neutral 50
  - `button.primary.border` = transparent
- Button Danger:
  - `button.danger.bg.default` = Danger 500
  - `button.danger.bg.hover` = Danger 600
  - `button.danger.bg.active` = Danger 700
  - `button.danger.text` = Neutral 50
- Button Success:
  - `button.success.bg.default` = Success 500
  - `button.success.bg.hover` = Success 600
  - `button.success.bg.active` = Success 700
  - `button.success.text` = Neutral 50
- Button Neutral:
  - `button.neutral.bg.default` = Neutral 0 (white)
  - `button.neutral.bg.hover` = Neutral 100
  - `button.neutral.bg.active` = Neutral 200
  - `button.neutral.text` = Neutral 900
  - `button.neutral.border` = Neutral 300
- Button Ghost/Icon:
  - `button.ghost.text.default` = Neutral 500
  - `button.ghost.text.hover` = Neutral 700
  - `button.ghost.bg.hover` = Neutral 100

- Rozmiary (globalne):
  - `size.button.height` = 28px
  - `size.filter.height` = 28px
  - `size.input.height` = 28px
  - `size.textarea.rowHeight` = 28px

- Filtry:
  - `filter.bg` = Neutral 0 (white)
  - `filter.border` = Neutral 300
  - `filter.text` = Neutral 900
  - `filter.placeholder` = Neutral 500
  - `select.bg` = Neutral 0 (white)
  - `select.border` = Neutral 300
  - `select.text` = Neutral 900
  - `select.placeholder` = Neutral 500
  - `select.menu.bg` = Neutral 0 (white)
  - `select.menu.border` = Neutral 200
  - `select.option.hover` = Neutral 100
  - `select.option.active` = Primary 50
  - `select.option.text` = Neutral 900

- Drzewa:
  - `tree.row.text` = Neutral 900
  - `tree.row.meta` = Neutral 500
  - `tree.concept.bg` = Primary 50 (z alpha 0.15 dla „paska” tła)
  - `tree.separator` = Neutral 200 (tylko w Model)
  - `tree.padding.left` = 12–16px (spójne z paddingiem treści panelu)
  - `tree.indent.step` = 16px
  - `tree.sources.row.altBg` = Neutral 50 (zebra stripes)
  - `tree.leftPanel.bg` = Neutral 50
  - `tree.leftPanel.maxWidthRatio` = 0.4 (40% szerokości ekranu)
  - `tree.node.tooltip.maxWidth` = 320px
  - `tree.node.tooltip.delay` = 150ms

- Diagram:
  - `diagram.canvas.bg` = Neutral 0 (white)
  - `diagram.title.bg` = Neutral 50
  - `diagram.title.text` = Neutral 900
  - `diagram.title.subtext` = Neutral 500
  - `diagram.title.border` = Neutral 200
  - `diagram.title.paddingX` = 16px
  - `diagram.title.paddingY` = 10px
  - `tree.sources.row.altBg` = Neutral 50 (zebra stripes)
  
- Badge:
  - `badge.pii.bg` = Info 100, `badge.pii.text` = Info 700
  - `badge.pk.bg` = Success 100, `badge.pk.text` = Success 700
  - `badge.fk.bg` = Primary 100, `badge.fk.text` = Primary 700
  - `badge.noPk.text` = Danger 700, `badge.noPk.bg` = Neutral 0

### Stany interakcji (mapowanie do tokenów)
- `state.default` → kolory `.bg.default` / `.text`
- `state.hover` → `.bg.hover` i podbicie `.text` o 1 poziom kontrastu
- `state.active` → `.bg.active` i zachowanie `.text`
- `state.disabled` → `opacity: 0.5`, kursor `not-allowed`, brak efektów hover/active
- `state.focus` → obrys `color.ring.focus` z `opacity.focusRing`

---

## Wireframes komponentów (ASCII)

### Filtry (28px height, font 12px)
```text
[ Search……….. ]  [ Select v ]  [ ] Has PK   [ ] Has PII   [ ] Only issues
└─ placeholder: muted; focus-ring on input/select; 8px gap między kontrolkami
```

Konfiguracje kontekstowe:
- Model: `Select: All | Keys (PK/FK)`
- Mapping: `Select: All | Mapped | Unmapped`
- Object/Model: checkboxy `Has PK`, `Has PII`, `Only issues`

### Przyciski (28px height, font 12px)
```text
[ Save ]  [ Cancel ]    [ Delete ]          [ ▶ ] [ ▼ ]
  P: primary             D: danger           ghost/icon (toolbar/row)
```

Zasady grupowania: 8px odstępy; kolejność: Primary → Neutral → Danger; ikonowe po prawej w wierszach.

### Drzewo – Object/Model (wspólny wygląd, różne funkcje)
```text
┌ Left Panel (width: 340px, resizable 220–560px) ──────────────────────────────┐
│ Toolbar: [ Expand all ] [ Collapse all ] [ Search…… ]                       │
│                                                                              │
│ ▶ Concept A───────────────────────────────────────────────────────────────── │
│   ▶ Entity A1   [PK][PII]        …                                           │
│     • attribute_a1_id            (int)                                      │
│     • attribute_a1_name          (varchar)                                  │
│   ▼ Entity A2   [No PK]          …                                           │
│     • attribute_a2_x             (date)                                     │
│                                                                              │
│ ▼ Concept B───────────────────────────────────────────────────────────────── │
│   ▶ Entity B1   [FK]             …                                           │
└──────────────────────────────────────────────────────────────────────────────┘
Notes:
- „…”: menu kontekstowe w wierszu encji; expand/collapse: „▶/▼” po prawej;
- Atrybuty z wcięciem; typ po prawej (10px, muted); brak hover‑tła/focus ring dla wierszy.
```

### Drzewo – Sources
```text
Source System
  └─ Database: HR
     └─ Schema: dbo
        └─ Table: employee_t
           ├─ empl_id         (numeric(5,4), not null)
           └─ empl_name       (varchar(50))
```
Zasady uzupełniające (poziom węzła):
- Po prawej stronie wiersza wyświetlaj **etykietę poziomu** w hierarchii (10px, muted – jak dataType): `Source System` / `Database` / `Schema` / `Table` / `View` / `Column`.
- Przykłady prezentacji: `CRM` … po prawej `Source System`; `HR` … po prawej `Database`; `dbo` … po prawej `Schema`; `employee_t` … po prawej `Table`; `empl_id` … po prawej `Column`.
- Etykieta poziomu i inne metadane (np. typ danych) **wyrównane do prawej** i nie kolidują z ikonami akcji.
- Zebra stripes: co drugi wiersz w drzewie otrzymuje delikatne tło `Neutral 50` (nie wpływa na wcięcia, nie koliduje z metadanymi po prawej).

Wireframe z etykietą poziomu (po prawej):
```text
Source System: CRM                                   [ Source System ]
  └─ Database: HR                                    [ Database ]
     └─ Schema: dbo                                  [ Schema ]
        └─ Table: employee_t                         [ Table ]
           ├─ empl_id         (numeric(5,4), not null)        [ Column ]
           └─ empl_name       (varchar(50))                    [ Column ]
```

### Drzewo – Requirements
```text
Requirements
  ├─ Requirement: SecurePasswords
  │    Description: Hasła muszą być hashowane (bcrypt, min cost 12)
  ├─ Requirement: GDPR-Anonymization
  │    Description: Anonimizować atrybuty PII w środ.
  └─ Requirement: Order-Idempotency
       Description: Operacje muszą być idemponentne dla Order
```
### Dropdown / Select (Stereotype)
```text
Field: Stereotype  [ Transactional v ]
                    ├─ Transactional
                    ├─ Master
                    ├─ Reference
                    └─ Aggregate
└─ control: 28px height; menu: min-width = control width; max-height 240px, scroll
```

### Panel tytułowy diagramu (Model/Mapping)
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Model diagram                                                             │
│ Use mouse to pan; scroll to zoom; double-click relation to edit.          │
│ [ Export JSON ]  [ Import JSON ]                         [ Clear all ]    │
└────────────────────────────────────────────────────────────────────────────┘
Notes: tytuł 14px, instrukcja 12px muted; tło Neutral 50; border-b Neutral 200;
przyciski zgodne z wariantami Button (Export/Import Neutral/Primary, Clear all Danger).
```

Zasady:
- Nazwa wymagania jako wiersz główny (12px, bold), opis w linii podrzędnej (10–11px, muted), ten sam schemat wcięć co w innych drzewach.
- Badge statusu (np. `Open`, `In Progress`, `Done`) po prawej jako wariant `badge`.
- Wyszukiwarka filtruje po nazwie i opisie; automatyczne rozwiniecie dopasowanych gałęzi.

## Tabele – styl kanoniczny (Object / Panel "Table")

### Zasady ogólne
- Typografia: 12px (`font.size.base`), nagłówki kolumn bold 12px; metadane/secondary 10–11px
- Wysokości: wiersz 32–36px (preferowane 36px), nagłówek 36px, toolbar 40px
- Odstępy: komórka horyz. 12–16px; pionowe 8–10px (w obrębie wysokości wiersza)
- Kolory: tło białe, napisy Neutral 900, linie `Neutral 200`
- Obramowania: poziome linie `border-b` (nagłówek i każdy wiersz), brak pionowych separatorów
- Selektory: checkbox w pierwszej kolumnie opcjonalny; rozmiar hit-area ≥ 28px
- Ikony: sortowanie (▲/▼) po prawej w nagłówku; tooltip z kierunkiem sortowania

### Tokeny tabel
- `table.header.bg` = Neutral 50
- `table.header.text` = Neutral 900
- `table.header.border` = Neutral 200
- `table.row.bg` = Neutral 0
- `table.row.altBg` = Neutral 50 (opcjonalne zebra)
- `table.row.border` = Neutral 200
- `table.row.hoverBg` = Neutral 50
- `table.row.selectedBg` = Primary 50
- `table.row.focusRing` = Primary 500 @ 0.35
- `table.cell.paddingX` = 12–16px
- `table.cell.paddingY` = 8–10px
- `table.pagination.bg` = Neutral 0
- `table.toolbar.bg` = Neutral 0

### Stany i zachowanie
- Hover wiersza: `table.row.hoverBg`
- Zaznaczenie wiersza: `table.row.selectedBg` + kontur focus przy nawigacji klawiaturą
- Focus w komórce: ring 1px (`color.ring.focus`)
- Sortowanie: ikona ▲/▼ przy aktywnym nagłówku, kolor tekstu nagłówka podbity o 1 poziom
- Puste dane: placeholder wiersz z ikoną/info (12px), brak linii siatki poza headerem

### Responsywność
- Minimalne szerokości kolumn; przy zawijaniu treści w komórce używać `truncate` z tooltipem pełnej wartości
- Na małych ekranach: opcjonalny tryb „cards” (label: value), ale stylistyka pozostaje spójna (12px)

### Wireframe (nagłówek, ciało, puste, paginacja)
```text
Toolbar: [ Search…… ]  [ Columns v ]                 [ Export ] [ Add ]

┌──────────────────────────────────────────────────────────────────────────┐
│  Name ▲         │  Type        │  Stereotype   │  Updated At            │
├──────────────────────────────────────────────────────────────────────────┤
│  Customer       │  table       │  Master       │  2025-10-12 14:33      │
│  Orders         │  table       │  Transactional│  2025-10-10 09:01      │
│  Address        │  view        │  Reference    │  2025-10-09 16:22      │
├──────────────────────────────────────────────────────────────────────────┤
│  No data to display                                                    │
└──────────────────────────────────────────────────────────────────────────┘

Pagination:  Rows per page: [ 25 v ]   1–25 of 132     [ ◀ ] [ ▶ ]
```

