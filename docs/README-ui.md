## UI Guide – InfoMapper (tokens, im-classes, base components)

### Tokens (CSS variables)
Zdefiniowane w `app/globals.css` (sekcja „InfoMapper UI tokens”):
- Typografia: `--font-size-base: 12px`, `--font-size-dataType: 10px`, `--font-size-appBarHeading: 14px`
- Rozmiary: `--size-button-height: 28px`, `--size-filter-height: 28px`, `--size-textarea-row: 28px`
- Drzewa: `--tree-padding-left`, `--tree-indent-step`, `--tree-left-panel-bg`, tooltip (maxWidth, delay)
- Diagram: `--diagram-canvas-bg`, `--diagram-title-*`

### Klasy bazowe (im-*)
- `im-filter`: kanon dla input/select (28 px, `text-xs`, focus-ring 1 px)
- `im-button` + warianty: `im-button--primary|--danger|--neutral|--success` (28 px, no wrap)
- Tabele: `im-table`, `im-thead`, `im-th`, `im-td`

### Komponenty bazowe (`components/ui/`)
- `ImButton`: `<ImButton variant="primary|danger|neutral|success">Save</ImButton>`
- `ImInput`: `<ImInput placeholder="Search…" />`
- `ImSelect`: `<ImSelect><option>…</option></ImSelect>`
- `ImBadge`: `<ImBadge variant="pk|fk|pii">PK</ImBadge>`

### Wzorce użycia
- Filtry: użyj `ImInput`/`ImSelect` (lub `className="im-filter"`)
- Przyciski: `ImButton` (+ warianty) w panelach i toolbarach
- Drzewa: truncation + tooltip, etykiety poziomu w `Sources`, panel 220–40vw
- Formularze Details: `Name`/`Stereotype` 28 px, `Description` 3×28 px
- Tabele: stosuj klasy `im-table/*` (sticky header, zebra, spójne paddingi)
- Diagramy: tło `bg-white`, panel tytułowy per spec

### A11y i QA
- Focus-ring wszędzie, nawigacja klawiaturą (Tab/Shift+Tab, strzałki w drzewach)
- Kontrast tekstu/ikon zgodny z WCAG AA
- Hit area ≥ 28×28 px dla interaktywnych elementów

### Dobre praktyki
- Używaj tokenów – unikaj wartości ad‑hoc (np. raw kolorów/paddingów)
- Preferuj `Im*` komponenty nad powtarzalnymi klasami
- Trzymaj panel lewy w granicach 220–40vw; zapisuj stan w localStorage













