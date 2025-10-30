# InfoMapper - Postęp Refaktoryzacji

## Status ogólny
**Data rozpoczęcia**: 2025-01-16  
**Aktualizacja**: 2025-01-16

---

## Fazy Refaktoryzacji

### ✅ Faza 1: Uporządkowanie Identyfikatorów (2-3h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Wszystkie ID generowane przez fabrykę `lib/id.ts`

#### Zadania:
- [x] Dodać `genDiagramItemId()` w `lib/id.ts`
- [x] Zamienić `Date.now()` w `commands.ts` L132 na `genRequirementId()`
- [x] Zamienić `Date.now()` w `model-view.tsx` L131 na `genRelationshipId()`
- [x] Zamienić `Date.now()` w `diagram-card.tsx` (4 wystąpienia) na `genConnectionId()`
- [x] Zamienić `Date.now()` w `page.tsx` (5 wystąpień) na odpowiednie fabryki:
  - L498: `genLogicalEntityId()` (custom entity)
  - L519: `genConceptId()` (default concept)
  - L530: `genLogicalEntityId()` (logical entity)
  - L540: `genDiagramItemId()` (custom source)
  - L552: `genRequirementId()` (requirement)
- [ ] Testy manualne po zmianach (do wykonania przez użytkownika)

**Notatki**:
- Wszystkie zmiany zaimplementowane bez błędów kompilacji
- Dodano importy odpowiednich fabryk ID w plikach
- Gotowe do testowania manualnego

---

### ✅ Faza 2: Usunięcie Redundancji Atrybutów (4-6h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Atrybuty tylko w `LogicalAttribute[]`, karty używają projekcji

#### Zadania:
- [x] Dodać `projectEntityAttributes()` w `lib/projections.ts`
- [x] Przenieść logikę Add/Edit/Delete do komend:
  - `addCustomAttribute` → używa `upsertCardAttribute`
  - `updateAttribute` → używa `updateLogicalAttribute`
  - `deleteAttribute` → używa `deleteLogicalAttribute`
  - `addModelCustomAttribute` → używa `upsertCardAttribute`
  - `updateModelAttribute` → używa `updateLogicalAttribute`
  - `deleteModelAttribute` → używa `deleteLogicalAttribute`
- [x] Uprosić logikę w `diagram-card.tsx`:
  - Usunięto merging z `customAttributes`
  - Usunięto applying `attributeOverrides`
  - Usunięto filtering `hiddenAttributes`
  - Atrybuty pochodzą wyłącznie z `data.attributes` (projekcja)
- [x] Usunąć normalizację `customAttributes` przy import/load w `page.tsx`
- [x] Usunąć `customAttributes`, `attributeOverrides`, `hiddenAttributes` z:
  - `lib/types.ts` (DiagramItem interface)
  - `app/page.tsx` (DiagramItemSchema)
  - `app/page.tsx` (AttributeSchema - całkowicie usunięty)
- [ ] Testy manualne (do wykonania przez użytkownika)

**Notatki**:
- Atrybuty teraz pochodzą TYLKO z `LogicalAttribute[]` w store
- Karty na diagramie używają projekcji `projectEntities()`
- Wszystkie operacje Add/Edit/Delete idą przez komendy do store
- Brak błędów kompilacji
- Gotowe do testowania manualnego

---

### ✅ Faza 3: Ujednolicenie Logiki Kluczy (2h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Filtr "Keys" i badge używają tylko boolean flags

#### Zadania:
- [x] Zmienić logikę filtrowania w `diagram-card.tsx`:
  - L424: `attr.stereotype === "PK" || attr.stereotype === "FK"` → `attr.isPrimaryKey || attr.isForeignKey`
- [x] Zaktualizować renderowanie badge w `diagram-card.tsx`:
  - L877-882: usunięto sprawdzanie `stereotype === "PK"/"FK"`, używamy tylko `isPrimaryKey`/`isForeignKey`
  - L495-496: przy edycji atrybutu używamy tylko flag boolean
- [x] Sprawdzić spójność w całej aplikacji:
  - `components/tree-item.tsx`:
    - L101: `entityHasPk` używa tylko `isPrimaryKey`
    - L174-182: badge używają tylko flag boolean
  - `components/model-object-tree.tsx`:
    - L134: `hasPk` używa tylko `isPrimaryKey`
- [ ] Testy manualne (do wykonania przez użytkownika)

**Notatki**:
- Wszystkie sprawdzenia PK/FK używają teraz TYLKO flag boolean
- `stereotype` jest traktowany jako pochodna (ustawiana w projekcjach)
- Spójność logiki między filtrami a badge'ami: 100%
- Brak błędów kompilacji
- Gotowe do testowania manualnego

---

### ✅ Faza 4: Zastąpienie Custom Events Centralnym Store (3-4h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Usunąć rozproszone eventy, wszystko przez store/callbacks

#### Zadania:
- [x] Usunąć eventy z `diagram-card.tsx`:
  - Usunięto `sync-logical-attribute` (3 miejsca: L517, L561, add/update)
  - Usunięto `delete-logical-attribute` (L543)
  - Usunięto event listenery z `page.tsx`
  - Zastąpiono `create-relationship` callback'iem `onCreateRelationship`
- [x] Usunąć eventy z `model-view.tsx`:
  - Usunięto event listenery `update-relationship-label` i `open-relationship-editor` (L82-102)
  - Zastąpiono funkcjami callback: `handleUpdateRelationshipLabel`, `handleRequestEditRelationship`
  - Przekazano callbacks przez `model-diagram-area.tsx` do `RelationshipLine`
- [x] Usunąć `catalog-state-updated`:
  - `catalog-view.tsx` używa `subscribe()` z `lib/store.ts` (L45-54)
  - Usunięto emitowanie z `page.tsx` (3 miejsca: L544, L628, L707)
  - Usunięto event listener duplikujący logikę requirements
- [x] Usunąć `sources-data-updated`:
  - Dodano callback `onDataUpdated` do `SourcesView`
  - Zastąpiono event callback'iem (L111-113)
  - Dodano handler `handleSourcesDataUpdated` w `page.tsx`
- [x] Catalog subskrybuje store bezpośrednio: ✅
- [ ] Testy manualne (do wykonania przez użytkownika)

**Notatki**:
- Liczba custom events: **0** (było 7)
- Przepływ danych: callbacks + subskrypcje store
- Eliminacja 10+ event listenerów
- Kod znacznie bardziej przejrzysty i łatwiejszy do śledzenia
- Brak błędów kompilacji
- Gotowe do testowania manualnego

---

### ✅ Faza 5: Konsolidacja LocalStorage (2-3h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Zredukować liczbę kluczy z 6 do 3

#### Zadania:
- [x] Usunięcie `infoMapperRequirementsV1`:
  - Requirements są teraz w `infoMapperStateV1` (zarządzane przez store)
  - Dodano `RequirementRowSchema` do `PersistedStateSchema`
  - `addCustomRequirement` używa tylko `cmdAddRequirement` → store
  - Usunięto duplikację `importedRequirements` state
  - Usunięto useEffect wczytujący z osobnego klucza
- [x] Konsolidacja UI preferences do `infoMapperUIv1`:
  - Utworzono `lib/ui-prefs.ts` z utility functions
  - Usunięto `objectTreeUIv1`, `modelTreeUIv1`, `sourcesTreeUIv1`
  - Wszystkie komponenty używają teraz centralnego `infoMapperUIv1`
  - Zaktualizowano: object-view, model-view, sources-view, sources-tree
- [ ] Testy manualne (do wykonania przez użytkownika)

**Notatki**:
- Liczba kluczy localStorage: **3** (było 6) 
  - `infoMapperStateV1`: dane domenowe + requirements
  - `infoMapperUIv1`: wszystkie preferencje UI
  - `infoMapperSourcesV1`: zewnętrzne źródła (pozostaje)
- Redukcja o 50% (6 → 3 klucze)
- Centralizacja ułatwia zarządzanie
- Brak błędów kompilacji
- Gotowe do testowania manualnego

---

### ✅ Faza 6: Kompletne Komendy (3-4h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Wszystkie mutacje tylko przez `commands.ts`

#### Zadania:
- [x] Dodać brakujące komendy do `lib/commands.ts`:
  - `toggleModelItemCollapsed(itemId)` (L246-251)
  - `setModelItemAttributeFilter(itemId, filter)` (L253-258)
  - `toggleDiagramItemShowOnlyMapped(itemId)` (L202-207)
- [x] Przepisać funkcje w `page.tsx` aby używały komend:
  - Mapping: hideItem, updateItemPosition, addConnection, deleteConnection,
    toggleItemCollapsed, updateItemObjectType, setAttributeFilter, updateItemWidth,
    toggleShowOnlyMapped, addItemToDiagram (13 funkcji)
  - Model: addModelItem, hideModelItem, updateModelItemPosition, updateModelItemObjectType,
    updateModelItemWidth, addModelRelationship, deleteModelRelationship, updateModelRelationship,
    toggleModelItemCollapsed, setModelAttributeFilter (10 funkcji)
  - Synchronizacja objectType przy zmianie stereotype w LogicalEntity
- [ ] Testy manualne (do wykonania przez użytkownika)

**Notatki**:
- Wszystkie mutacje stanu diagramów idą teraz przez komendy
- Usunięto ~25 miejsc bezpośredniego użycia `setObjectState` w `page.tsx`
- Spójność: 100% mutacji przez Command pattern
- Ułatwia to testowanie, debugowanie i późniejszą implementację undo/redo
- Brak błędów kompilacji
- Gotowe do testowania manualnego

---

### ✅ Faza 7: Uzupełnienie Projekcji (2-3h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Widoki tylko czytają projekcje, nie przechowują danych

#### Zadania:
- [x] Dodać projekcje do `lib/projections.ts`:
  - `projectMapping()` - projekcja dla Mapping view (entities, sources, requirements)
  - `projectModel()` - projekcja dla Model view (entities, diagramItems, relationships)
  - `projectCatalog()` - projekcja dla Catalog view (concepts, entities, attributes, connections)
  - Dodano interfejsy TypeScript dla każdej projekcji
- [x] Usunąć duplikację danych z `page.tsx`:
  - Usunięto `customEntities` state - encje teraz tylko ze store przez projekcję
  - Usunięto `customSources` state - źródła tylko z importedSources
  - Usunięto `customRequirements` state - wymagania tylko ze store
  - `addCustomEntity` teraz dodaje przez komendę `addEntity()` do store
  - `addCustomSource` dodaje do `importedSources` (zewnętrzne dane)
- [x] Zaktualizować komponenty aby używały projekcji:
  - `ModelView` używa `modelProjection.entities/diagramItems/relationships`
  - `Sidebar` (Mapping) używa `mappingProjection.entities/sources/requirements`
  - `DiagramArea` (Mapping) używa `mappingProjection.entities/sources/requirements`
- [x] Testy manualne ✅ PRZESZŁY POMYŚLNIE
  - Dodawanie encji z formularza (Concept Name, Entity Name, Object Type)
  - Przeciąganie encji na diagram (bez błędu "Data not found")
  - Synchronizacja z Object view
  - Dodawanie atrybutów i synchronizacja
  - Persistence po odświeżeniu (F5)
  - Dodawanie sources
  - Synchronizacja z Model view

**Notatki**:
- Usunięto 3 lokalne state dla danych domenowych (customEntities, customSources, customRequirements)
- Wszystkie widoki czytają dane z projekcji, nie przechowują kopii
- Single Source of Truth: dane tylko w store lub zewnętrznych importach
- Sources pozostają w importedSources (zewnętrzne dane, nie część domeny)
- Naprawiono problem "Data not found" - dodano natychmiastową synchronizację state po dodaniu encji
- Uproszczono formularz dodawania encji - ZAWSZE 3 pola niezależnie od konceptów
- Brak błędów kompilacji
- Wszystkie testy manualne przeszły pomyślnie ✅

---

### ✅ Faza 8: Usunięcie Martwego Kodu (1-2h)
**Status**: ✅ UKOŃCZONE  
**Cel**: Oczyścić nieużywane pliki i funkcje

#### Zadania:
- [x] Usunąć nieużywane pliki testowe:
  - `lib/test-sources.ts` - całkowicie nieużywany (0 importów)
  - `lib/test-data.ts` - zastąpiony przez projekcje (135 linii)
  - `components/model-entity-card.tsx` - zastąpiony przez diagram-card.tsx (263 linie)
- [x] Skonsolidować duplikacje:
  - Przeniesiono `normalizeStereotype` do `lib/utils.ts`
  - Usunięto duplikacje z `app/page.tsx` i `lib/projections.ts`
- [x] Oczyszczenie `diagram-area.tsx`:
  - Usunięto import `testData`
  - Uproszono logikę allEntities/allSources/allRequirements
- [x] Refaktoryzacja `dependency-panel.tsx`:
  - Dodano props: entities, sources, requirements
  - Zastąpiono `testData.find()` wyszukiwaniem w propsach z projekcji
  - Zaktualizowano wywołanie w `app/page.tsx`
- [x] Czyszczenie komentarzy w `app/page.tsx`:
  - Usunięto 5 zdezaktualizowanych komentarzy
  - Uproszono opisy funkcji
- [x] Weryfikacja kompilacji - brak błędów ✅
- [x] Testy manualne ✅ PRZESZŁY POMYŚLNIE
  - Dodawanie encji
  - Przeciąganie na diagram
  - Dependency Panel
  - Podstawowe funkcje aplikacji

**Notatki**:
- Usunięto łącznie 3 pliki (~600 linii martwego kodu)
- Zkonsolidowano 1 funkcję (usunięto 2 duplikacje)
- Oczyszczono 2 komponenty z referencji do nieistniejących danych
- Uproszono 5 komentarzy
- Brak błędów kompilacji/lintowania
- Wszystkie testy manualne przeszły pomyślnie ✅

---

### ⏳ Faza 9: UI/UX Konsystencja (4-6h)
**Status**: OCZEKUJE  
**Cel**: Implementacja zgodna z `ui-ux-consistency.md`

#### Zadania:
- [ ] Utworzyć `im-filter.tsx`
- [ ] Zastosować w wszystkich widokach
- [ ] Weryfikacja checklisty QA
- [ ] Testy manualne

---

### ⏳ Faza 10: Testy i Dokumentacja (2-3h)
**Status**: OCZEKUJE  
**Cel**: Pokrycie testami i aktualizacja dokumentacji

#### Zadania:
- [ ] Testy jednostkowe komend
- [ ] Testy projekcji
- [ ] Aktualizacja dokumentacji
- [ ] Review finalny

---

## Problemy i Uwagi

### Faza 1
- 

---

## Metryki

### Przed refaktoryzacją
- Liczba miejsc z duplikacją atrybutów: 3
- Liczba custom events: 7
- Liczba kluczy localStorage: 6
- Pokrycie komendami: ~60%
- Zgodność z dokumentacją UI: ~70%

### Po Fazie 1
- Wszystkie ID generowane przez fabryki z prefiksami
- Spójność identyfikatorów: 100%

### Po Fazie 2
- Liczba miejsc z duplikacją atrybutów: 1 (tylko LogicalAttribute[] w store)
- Eliminacja redundancji: ✅ Ukończona
- Źródło prawdy dla atrybutów: tylko store

### Po Fazie 3
- Logika PK/FK używa TYLKO flag boolean (isPrimaryKey, isForeignKey)
- Spójność filtrów i badge'ów: 100%
- Usunięto 6 miejsc sprawdzających stereotype dla PK/FK

### Po Fazie 4
- Liczba custom events: **0** (było 7)
- Eliminacja 10+ event listenerów
- CatalogView subskrybuje store bezpośrednio przez `subscribe()`
- Przepływ danych: callbacks + subskrypcje zamiast eventów

### Po Fazie 5
- Liczba kluczy localStorage: **3** (było 6)
- Redukcja o 50%
- Utworzono `lib/ui-prefs.ts` dla centralnego zarządzania UI
- Requirements w pełni zarządzane przez store (bez duplikacji)

### Po Fazie 6
- 100% mutacji stanu przez komendy z `commands.ts`
- Usunięto ~25 miejsc bezpośredniego użycia `setObjectState`
- Dodano 3 nowe komendy (toggleModelItemCollapsed, setModelItemAttributeFilter, toggleDiagramItemShowOnlyMapped)
- Gotowe do implementacji undo/redo w przyszłości

### Po Fazie 7
- Usunięto 3 lokalne state dla danych domenowych (customEntities, customSources, customRequirements)
- Dodano 3 projekcje (projectMapping, projectModel, projectCatalog) w `lib/projections.ts`
- Wszystkie widoki czytają dane tylko z projekcji (read-only)
- Single Source of Truth: dane tylko w store, widoki tylko renderują
- Naprawiono problem asynchronicznej synchronizacji ("Data not found")
- Uproszczono formularz dodawania encji (3 pola zawsze)
- Wszystkie testy manualne przeszły ✅

### Po Fazie 8
- Usunięto 3 nieużywane pliki (~600 linii kodu)
- Zkonsolidowano funkcję `normalizeStereotype` w `lib/utils.ts`
- Oczyszczono komponenty z referencji do testData
- Usunięto zdezaktualizowane komentarze
- Cały kod używa projekcji zamiast testowych danych

### Cel końcowy
- Liczba miejsc z duplikacją atrybutów: 1 ✅
- Liczba custom events: 0 ✅
- Liczba kluczy localStorage: 3 ✅ (było 6, sources pozostaje oddzielnie jako zewnętrzny import)
- Pokrycie komendami: 100% ✅
- Zgodność z dokumentacją UI: 95%+ (do weryfikacji w Fazie 9)

