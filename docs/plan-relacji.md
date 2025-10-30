## Plan usprawnień relacji (sekcja Model)

Poniżej uporządkowany plan prac nad liniami relacji i interakcjami. Każdy punkt realizujemy i testujemy osobno.

### 1) Zaznaczanie relacji + skróty klawiaturowe
- Zakres:
  - Klik na linię/etykietę = zaznaczenie relacji
  - Delete = usuń zaznaczoną relację
  - Esc = odznacz
- Implementacja (high‑level):
  - Stan `selectedRelationshipId` (np. w `ModelDiagramArea` lub wyżej w `ModelView`)
  - W `RelationshipLine` props z informacją o zaznaczeniu + callbacki
  - Styl zaznaczenia: pogrubiony stroke, wyraźny kolor
- Kryteria akceptacji:
  - Jednocześnie może być zaznaczona max 1 relacja
  - Delete usuwa wyłącznie zaznaczoną relację
  - Esc zawsze odznacza

### 2) Edycja etykiety relacji (inline)
- Zakres:
  - Double‑click w etykietę = tryb edycji (input)
  - Enter / blur = zapisz; Esc = anuluj
- Implementacja (high‑level):
  - Lokalny stan edycji w `RelationshipLine` lub sterowany z góry
  - Aktualizacja `relationship.label` w kolekcji `relationships`
- Kryteria akceptacji:
  - Zmiana widoczna bez przeładowania
  - Brak przypadkowego przenikania klików do tła (stopPropagation)

### 3) Krzywa (cubic bezier) + czytelny hover/active
- Zakres:
  - Zastąpienie linii prostych krzywą dopasowaną do `dx/dy`
  - Hover: subtelne pogrubienie + zmiana koloru
  - Active (zaznaczona): wyraźne pogrubienie i kolor
- Implementacja (high‑level):
  - Wyliczenie punktów kontrolnych (horyzontalnie/vert) jak w Mapping
  - Płynne przejścia CSS/SVG
- Kryteria akceptacji:
  - Krzywa czytelna przy różnych układach encji i zoomie

### 4) Kardynalność (crow’s foot)
- Zakres:
  - Zamiast kółek „1/N” – uproszczone symbole crow’s foot przy końcach
- Implementacja (high‑level):
  - Małe path/marker SVG zależne od `1` vs `N`
  - Pozycjonowanie przy krawędzi (zachowanie anchorów)
- Kryteria akceptacji:
  - Symbole nie nachodzą na kartę i są skalowalne z zoomem

### 5) Offset linii przy zbieżnych relacjach (anty‑nakładanie)
- Zakres:
  - Gdy kilka relacji łączy te same encje/krawędzie, dodajemy stały offset łuku
- Implementacja (high‑level):
  - Deterministyczny offset z hash(`relationship.id`) lub indeksu relacji pomiędzy parą encji
- Kryteria akceptacji:
  - Linie nie nakładają się idealnie; czytelność zachowana

### 6) Export/Import relacji modelu
- Zakres:
  - Dołącz `modelRelationships` do eksportu/importu JSON (w `app/page.tsx`)
  - Walidacja schematu (Zod)
- Implementacja (high‑level):
  - Rozszerzenie payloadu i walidacji przy imporcie
- Kryteria akceptacji:
  - Po imporcie relacje (z etykietami i kardynalnością) są widoczne bez dodatkowych czynności

### (Opcjonalnie) 7) Przeciąganie etykiety wzdłuż linii
- Zakres:
  - Etykieta relacji może mieć `labelOffset` (0..1) i być przesuwana
- Implementacja (high‑level):
  - Drag na etykiecie zmienia `labelOffset`; rysowanie na bazie interpolacji `x(t), y(t)`
- Kryteria akceptacji:
  - Offset zapamiętywany; etykieta nie „odłącza” się przy zoomie











