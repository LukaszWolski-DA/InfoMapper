## InfoMapper – przegląd aplikacji

### Cel
Aplikacja do modelowania danych i gromadzenia metadanych pod automatyzację wytwarzania hurtowni danych (DWH): od modelu logicznego/semantycznego, przez mapowanie źródeł, po generowanie artefaktów (DDL/ELT/ETL, dokumentacja, testy).

### Najważniejsze obszary funkcjonalne (stan na dziś)
- Mapping
  - Przeciągnij‑upuść encje/źródła/wymagania na diagram
  - Mapowania atrybut→atrybut i obiekt→obiekt (linie konektorów)
  - Filtry atrybutów: All / Mapped / Unmapped
  - Eksport/Import JSON (diagram + mapowania)
- Model
  - Diagram encji z relacjami
  - Zoom (Ctrl + scroll, przyciski +/%/−), pan (Space + drag), snap do siatki, płynny drag
  - Filtry atrybutów: All / Keys (PK/FK)
  - Relacje: krzywe Bezier, label inline (opcjonalny), kardynalności przy kotwicach (0..1 / 1..N), strzałki kierunku
  - Edycja relacji (double‑click po zaznaczeniu): label (opcjonalny), min/max po obu stronach, direction
  - Rozstrzelenie wielu relacji między tą samą parą encji (kotwice + krzywe)

### Model danych (fragment)
- DiagramItem: pozycja/stan karty (entity/source/requirement), filtr atrybutów, szerokość
- Relationship: id, sourceEntityId, targetEntityId, label (opcjonalny), cardinality (wsteczna zgodność), min/max (0/1, 1/N) po obu stronach, direction (source‑to‑target/target‑to‑source/none)
- Connection (Mapping): attribute‑mapping / requirement‑mapping z danymi źródła i celu

### Architektura UI
- Next.js (React, TypeScript, Tailwind)
- Składowe: `DiagramArea`/`DiagramCard` (Mapping), `ModelDiagramArea`/`RelationshipLine` (Model)
- Obliczenia pozycji linii względem wrappera `.model-canvas`, stabilne względem zoomu i scrolla

---

## Roadmap – kolejne iteracje (priorytety)

### 1) Trwałość i wersjonowanie (wysoki priorytet)
- Zapisywanie stanu (model, relacje, mapowania) do localStorage + autosave
- Wersje modelu: snapshoty, diff, revert
- Integracja z repo (opcjonalnie JSON w Git)

### 2) Walidacja modelu i reguły (wysoki priorytet)
- Spójność PK/FK, brak sierot, kardynalności (0..1/0..N) vs obligatoryjność
- Wykrywanie cykli/niejednoznaczności, duplikatów atrybutów, braków kluczy
- Raport walidacyjny z szybkim przejściem do miejsca błędu

### 3) Import metadanych i reverse‑engineering (wysoki priorytet)
- Import schematów z baz (PostgreSQL/SQL Server): tabele/kolumny, PK/FK
- Import z narzędzi (dbt manifest, OpenAPI/JSON Schema) → encje i atrybuty
- Półautomatyczne mapowanie źródeł do encji (fuzzy dopasowanie nazw)

### 4) Generowanie artefaktów (wysoki priorytet)
- Szablony generatorów: 
  - DDL (tabele/staging/target) + klucze/indeksy
  - dbt (models, sources, tests) lub SQL ELT (CTE/pipeline)
  - Dokumentacja HTML/Markdown (diagram, słownik danych, lineage)
- Parametryzacja generatorów (nazwa schematu, prefiksy, konwencje)

### 5) Lineage i transformacje (średni priorytet)
- Wizualizacja lineage atrybutów: source → staging → model
- Reguły transformacji (np. konwersje, join conditions, agregacje) jako metadane
- Pseudokod transformacji lub DSL z renderem do SQL

### 6) Testy i jakość danych (średni priorytet)
- Reguły testów (not null, unique, referential, range, pattern)
- Eksport do testów dbt / SQL checks
- Szybki panel niezgodności/alertów

### 7) Uprawnienia/PII/GDPR (średni priorytet)
- Flagi PII na atrybutach i propagacja przez mapowania
- Maskowanie / anonimizacja (metadane reguł)
- Eksport polityk (np. widoki maskujące)

### 8) Współpraca i UX (średni priorytet)
- Notatki/komentarze przy encjach/relacjach
- Blokady edycji / multi‑user (docelowo)
- Ulepszenia nawigacji (mini‑mapa, wyszukiwarka po modelu)

### 9) Wydajność i techniczne
- Optymalizacja renderu przy wielu kartach/liniach (memoization, wirtualizacja list atrybutów)
- Uporządkowanie eventów i ograniczenie rAF tylko gdy konieczne
- Testy jednostkowe wybranych obszarów (pozycjonowanie linii, walidacja)

---

## Kierunek produktu
- Budujemy silnik modelowania z pełnym zasileniem metadanymi, by przy minimum ręcznej pracy wygenerować artefakty do DWH (DDL/ELT/dbt/testy/dokumentacja) oraz zapewnić walidację i zgodność (PII/GDPR).
- Z czasem: wtyczki importerów/eksporterów, profile projektów (np. „dbt‑postgres”), automatyczne szkielety pipeline’ów i reguł testów.











