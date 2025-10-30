## Propozycje – lewy panel (hierarchia) i ergonomia UI

1) Widoczność i rozmiar panelu
- 1.1: Toggle widoczności (ikona w top-nav i skrót: Alt+L) – panel chowa się/pojawia z animacją.
- 1.2: Resizable width (drag‑handle przy krawędzi), zakres min/max, zapamiętywanie w localStorage.
- 1.3: Tryb „mini” – zwija panel do paska ikon (Concept/Entity), hover otwiera overlay.

2) Hierarchia i układ filtrów (spójne z obecnym)
- 2.1: Poziom 1 – filtr wiodący (wyszukiwarka) + „Only issues”.
- 2.2: Poziom 2 – filtry Has PK / Has PII (checkboxy z licznikami wyników).
- 2.3: Poziom 3 – przyciski „Expand current only”, „Expand all”, „Collapse all” (prawa strona).
- 2.4: „Clear filters” (reset wszystkich filtrów/wyrażeń) + pamięć ustawień filtrów.

3) Format elementów drzewa
- 3.1: Concept: nazwa + badge liczby encji + ⋯ (menu) + „Expand only”.
- 3.2: Entity: chevron (toggle), nazwa (drag target/handle), badge: No PK/PII/liczba atrybutów, ⋯ menu.
- 3.3: Attribute: nazwa + (opcjonalnie) typ danych (subtle) – widoczne tylko w trybie „verbose”.
- 3.4: „Smart filter” – przy dopasowaniu atrybutu wyświetl ścieżkę Concept → Entity → Attribute.
- 3.5: Podświetlenie drop targetu (hover) przy DnD.

4) Akcje i interakcje
- 4.1: Inline rename (F2) + walidacje (puste/duplikaty). Enter = zapis, Esc = anuluj, blur = zapis.
- 4.2: Menu ⋯ (Add/Duplicate/Delete/Move) dla Concept/Entity; Add Attribute na Entity.
- 4.3: DnD attribute między encjami (Undo), DnD entity między konceptami (Undo).
- 4.4: Multi‑select (Shift/CTRL) dla atrybutów – masowe Delete/Move (opcjonalnie później).

5) Nawigacja i dostępność
- 5.1: Strzałki/Enter/Space/Home/End – już działa; dodać PageUp/PageDown (skok o ekran).
- 5.2: Roving tabindex, wyraźny focus ring, ARIA (tree/treeitem/group) spójne.
- 5.3: Skróty: F2 (rename), Del (delete + Undo), Alt+E (expand current only), Alt+L (toggle panel), Ctrl+F (focus search).

6) Użyteczność i feedback
- 6.1: Empty states (brak konceptów/encji/atrybutów) z CTA „Add …”.
- 6.2: Toastery Undo dla destrukcyjnych akcji; soft scroll + highlight po akcjach z Issues.
- 6.3: Tooltipy dla obciętych nazw; line‑clamp i ellipsis spójne z tabelą.

7) Wydajność i skala
- 7.1: Lazy render długich list atrybutów (po rozwinięciu). 
- 7.2: (Opcjonalnie) wirtualizacja listy atrybutów przy bardzo dużej liczbie.
- 7.3: Debounce wyszukiwarki i filtrów; pamięć stanu UI w localStorage.

8) Spójność wizualna z całą aplikacją
- 8.1: Typografia `text-sm`, identyczny ring i spacing (8/12/16 px) jak w Model/Mapping.
- 8.2: Ikony (Chevron/More) – stały rozmiar; badge w wariantach outline/destructive.
- 8.3: Dark‑mode (tokeny kolorów), brak „flashu” stanów przy mount.

9) Rozszerzalność
- 9.1: Sekcja presetów filtrów (np. „Model review”, „PII audit”).
- 9.2: Zakładki w panelu (Hierarchy / Bookmarks / Recent changes) – później.
- 9.3: Eksport/import selekcji/filtrów (np. link share) – później.

10) Rekomendowana kolejność wdrożeń (propozycja)
- Krok A: Toggle panel + resize (1.1–1.2), Clear filters (2.4).
- Krok B: Podświetlenie drop targetu i feedback (3.5, 6.2).
- Krok C: Skróty Alt+E, Alt+L, Ctrl+F (5.3) + PageUp/PageDown (5.1).
- Krok D: Pamięć filtrów i szerokości panelu (2.4, 7.3).
- Krok E: Lazy render atrybutów (7.1) i opcjonalna wirtualizacja (7.2).

Zaznacz proszę, które punkty są dla Ciebie priorytetem – zacznę od nich implementację i będziemy iterować.



