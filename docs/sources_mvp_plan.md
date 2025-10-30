## Sources – zakres i szkic UI (MVP)

### Zakres danych (TS – propozycja)
- **SourceSystem**: id, name
- **SourceDatabase**: id, systemId, name
- **SourceSchema**: id, databaseId, name
- **SourceObject**: id, schemaId, name, objectType ("table" | "view"), columns: SourceColumn[], rowCount?, comment?
- **SourceColumn**:
  - id, objectId, name
  - dataType.base (np. "varchar" | "numeric" | "int" | "date" | "timestamp" | "boolean" | "json")
  - dataType.length?, dataType.precision?, dataType.scale?
  - nullable: boolean, isPrimaryKey?, isForeignKey?
  - defaultValue?, comment?
- **Pola pochodne**:
  - fullyQualifiedName = system.database.schema.object
  - columnPath = system.database.schema.object.column
- **Walidacje (MVP)**:
  - Duplikaty kolumn w obrębie obiektu
  - Nieuzupełnione dataType/parametry (length/precision/scale, jeśli wymagane)
  - Brak PK na tabeli (ostrzeżenie)
  - Nullability nieznane (oznaczenie "unknown" do uzupełnienia po imporcie)

### Szkic UI (spójny ze stylem drzewa Model)
- **Układ 3‑panelowy**:
  - **Lewy panel (drzewo, ~340px, resize, stan w localStorage `sourcesTreeUIv1`)**
    - Hierarchia: Source System → Baza → Schemat → Tabela/Widok → Kolumna
    - Wyszukiwarka: dopasowanie po FQN/kolumnach; auto‑expand trafień
    - Filtry: Only issues, Only tables, Only views, Hide panel
    - Akcje: Expand current only, Expand all, Collapse all
    - Wiersze: obiekt z badge typu (table/view); kolumna z typem skrótem (np. `numeric(5,4)`), ikony PK/FK/Nullable
    - Klawiatura: strzałki, Home/End, Enter/Space (jak `ObjectTree`)
  - **Środkowy panel (szczegóły)**
    - Nagłówek: fullyQualifiedName + typ (table/view)
    - Zakładki: Overview | Columns
      - Overview: system, baza, schemat, rowCount?, comment
      - Columns: tabela kolumn (read‑only w MVP) z typem, nullability, PK/FK, default, comment
  - **Prawy panel (Issues)**
    - Lista problemów (scope: bieżący obiekt lub całe drzewo)
    - Kliknięcie przenosi do elementu (jak w `ObjectIssues`)

- **Akcje w MVP**:
  - Brak CRUD/importu (read‑only); import zaplanujemy później
  - Kopiowanie: Copy FQN, Copy column path

- **Persistencja UI**:
  - `sourcesTreeUIv1`: isLeftPanelVisible, leftPanelWidth, openSystemIds, openDatabaseIds, openSchemaIds, openObjectIds
  - Dane domenowe: tymczasowo w pamięci; docelowo `infoMapperSourcesV1` po imporcie

### Integracja z istniejącą aplikacją
- **Komponenty**:
  - `components/sources-view.tsx` (layout 3‑panelowy)
  - `components/sources-tree.tsx` (lewe drzewo)
  - `components/sources-details.tsx` (środek)
  - `components/sources-issues.tsx` (prawy panel)
- **Routing/sekcja**:
  - W `app/page.tsx` podmienić sekcję „Sources” na `SourcesView` (w późniejszej iteracji)













