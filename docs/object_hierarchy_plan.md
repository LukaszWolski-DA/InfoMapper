## Plan iteracji – hierarchia (Object)

1) Inline rename i menu kontekstowe
- 1.1: Rename dla `Concept` i `Entity` (F2 + klik/Enter, Esc anuluj)
- 1.2: Menu „⋯” na nagłówkach: Add (Entity/Attribute), Duplicate, Delete
- 1.3: Walidacje nazw (puste/duplikaty) – komunikat inline

2) Drag & drop atrybutów między encjami
- 2.1: Przeciąganie `Attribute` pomiędzy `Entity` (w obrębie tego samego `Concept`)
- 2.2: Potwierdzenie przy przeniesieniu (Undo w toascie)
- 2.3: Walidacje minimalne (np. co najmniej 1 PK – ostrzeżenie)

3) Filtry i oznaczenia w drzewie
- 3.1: Filtry: Has PK, Has PII, Only with issues
- 3.2: Badge z liczbą encji/atrybutów; wskaźnik błędów (kolor/severity)
- 3.3: Ikony typów encji (Dimension/Fact/Link/Dictionary)

4) Drag & drop encji między konceptami
- 4.1: Przenoszenie `Entity` pomiędzy `Concept` (z potwierdzeniem)
- 4.2: Aktualizacja liczników/badge, zachowanie stanu rozwinięcia
- 4.3: Soft scroll do nowej lokalizacji, highlight przez 2 s

5) Nawigacja i dostępność
- 5.1: Klawiatura: Enter/Space = toggle, Strzałki = nawigacja, Home/End
- 5.2: Roving tabindex, focus ring spójny z UI
- 5.3: „Clear search” i auto‑expand gałęzi z dopasowaniem

6) Kontrola rozwinięcia
- 6.1: Expand/Collapse All (globalnie) – już dostępne, dopracować UX
- 6.2: „Expand current only” (zamyka inne koncepty, rozwija bieżący)
- 6.3: Persist stanu (localStorage) – już działa, zachować kompatybilność

Kryteria akceptacji (dla każdej iteracji)
- A. Zmiana widoczna natychmiast, bez przeładowania
- B. Fokus i klawiatura działają zgodnie z opisem
- C. Walidacje komunikowane inline/tooltip; Undo przez toast



