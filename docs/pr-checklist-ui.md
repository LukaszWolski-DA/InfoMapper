## PR Checklist – Spójność UI/UX (InfoMapper)

Zaznacz, że spełniłeś wymagania dla zmian w tym PR. Jeśli punkt nie dotyczy – zaznacz N/A.

### Filtry (Inputs/Selects)
- [ ] Użyto `im-filter` (28 px, `text-xs`, `focus:ring-1` niebieski)
- [ ] Placeholder i kolor muted są spójne (szarość)
- [ ] Brak niestandardowych wysokości/paddingów sprzecznych z kanonem

### Przyciski
- [ ] Użyto `im-button` + wariantów (`--primary/--danger/--neutral/--success`)
- [ ] Wysokość 28 px, `whitespace-nowrap`, spójny focus-ring
- [ ] Kolejność i odstępy w grupach przycisków spójne (8 px)

### Drzewa (Object/Model/Sources/Requirements)
- [ ] Wcięcia poziomów 16 px (`tree.indent.step`), L0 wyrównane do lewej pod toolbarem
- [ ] `Sources`: etykieta poziomu po prawej (Source System/Database/Schema/Table/View/Column)
- [ ] Truncation + tooltip dla długich nazw (nazwa/atrybuty)
- [ ] Zebra stripes spójne (delikatne tło co drugi wiersz tam gdzie wymagane)
- [ ] Lewy panel: tło `bg-gray-50`, `minWidth: 220px`, `maxWidth: 40vw`, stan zapisywany

### Formularze (Details)
- [ ] `Name`/`Stereotype` jako 28 px (input/select), `Description` = 3×28 px
- [ ] Konsekwentne użycie `im-filter`/`SelectTrigger` (size 28 px)

### Tabele
- [ ] Użyto klas: `im-table`, `im-thead`, `im-th`, `im-td`
- [ ] Sticky header, zebra, spójne paddingi komórek

### Diagramy
- [ ] Canvas tło białe (`bg-white`) w Model i Mapping
- [ ] Panel tytułowy: Mapping – tytuł „Mapping”, Model – pogrubione „Instructions:” i „Colors:”
- [ ] Przyciski w panelach: `im-button` (`neutral`/`danger`)

### Tokeny i a11y
- [ ] Użyto tokenów (CSS variables) zamiast wartości ad‑hoc tam gdzie możliwe
- [ ] Focus-ring obecny na wszystkich interaktywnych elementach
- [ ] Nawigacja klawiaturą działa (Tab/Shift+Tab, strzałki w drzewach)
- [ ] Kontrasty zgodne z WCAG AA

### Dodatkowe
- [ ] Etykiety przycisków nie łamią się do dwóch linii (no wrap)
- [ ] Brak regresji wizualnych w innych kartach (krótki smoke test)
- [ ] N/A: punkty niestosowalne w tym PR (opisane w komentarzu)













