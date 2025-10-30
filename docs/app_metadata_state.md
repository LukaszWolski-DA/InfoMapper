## Plan wdrożenia: jeden model danych, wielokierunkowe akcje (Add/Modify/Remove)

### 1) Centralny store i jednolity stan (Single Source of Truth)
- Utworzyć `lib/store.ts` (Zustand lub prosty event-emitter + obiekt stanu).
- Struktura stanu:
  - object: `concepts`, `logicalEntities`, `logicalAttributes`
  - mapping: `diagramItemsMapping`, `connections`
  - model: `diagramItemsModel`, `relationships`
  - sources: `sourcesDomain`
  - requirements: `requirements`
  - meta: `uiPrefs`, `version`
- Persist: jeden klucz `imStateV1`, zapis z debounce 500–700 ms + migracje (versioned state).

### 2) Warstwa komend domenowych (API mutation)
- Plik: `lib/commands.ts`. Komendy (idempotentne, walidowane):
  - Concept: `addConcept`, `updateConcept`, `deleteConcept`
  - Entity: `addEntity(conceptId, name, stereotype?)`, `updateEntity`, `deleteEntity`
  - Attribute: `addAttribute(entityId, name, flags?)`, `updateAttribute(attrId, { name, isPrimaryKey, isForeignKey, isPII, dataType })`, `deleteAttribute(attrId)`
  - Mapping: `addConnection`, `deleteConnection`, `clearConnections`
  - Model: `addRelationship`, `updateRelationship`, `deleteRelationship`
  - Requirements: `addRequirement(name, type)`, `updateRequirement`, `deleteRequirement`
  - Sources: `importSources(domain)`, `clearSources`
- Każda komenda:
  - modyfikuje wyłącznie stan domenowy w store,
  - emituje jedno zdarzenie `stateUpdated` (opcjonalnie granularne),
  - nie zapisuje bezpośrednio do localStorage (persist obsługuje store).

### 3) Projekcje do widoków (read-only)
- Plik: `lib/projections.ts`:
  - `projectEntities(objectState)`: LogicalEntity + LogicalAttribute → Entity/Attribute (PK/FK/PII, kolejność badge).
  - `projectMapping(state)`: projekcja encji + mapping (tylko odczyt).
- Widoki (Mapping/Model/Catalog) renderują wyłącznie projekcje – bez lokalnych danych domenowych.

### 4) Odchudzenie widoków (UI-only state)
- Diagram items przechowują tylko layout/UI (`left/top/width/collapsed/filter`).
- Formularze/Add/Save/Delete (we wszystkich kartach) wywołują wyłącznie komendy ze store.
- Usunąć/wyłączyć `customAttributes` w kartach – atrybuty pochodzą tylko z projekcji modelu logicznego.

### 5) Ujednolicenie identyfikatorów (fabryka ID)
- Plik: `lib/id.ts` (np. nanoid/ULID) i API:
  - `genConceptId()` → `conc_<id>`
  - `genLogicalEntityId()` → `lent_<id>`
  - `genLogicalAttributeId()` → `latr_<id>`
  - `genRelationshipId()` → `rel_<id>`
  - `genConnectionId()` → `conn_<id>`
  - `genRequirementId()` → `req_<id>`
  - (opcjonalnie Sources): `srcsys_`, `srcdb_`, `srcsch_`, `srcobj_`, `srccol_`
- Dodatkowo: `parseIdType(id)` do diagnostyki oraz regex walidujące prefiksy.

### 6) Spójne badge i filtry
- Badge bazują wyłącznie na booleanach: `isPrimaryKey`, `isForeignKey`, `isPII`.
- Kolejność renderu: PK → FK → PII (wszystkie mogą wystąpić jednocześnie).
- Filtr "Keys" = `isPrimaryKey || isForeignKey` (bez `stereotype`).
- `stereotype` traktować jako pochodną (kompatybilność w UI), nie jako źródło prawdy.

### 7) Zdarzenia i subskrypcje
- Jeden event `stateUpdated` po każdej komendzie.
- Widoki subskrybują (hook `useStoreSelector`) i odświeżają projekcje.
- Brak ręcznych eventów rozproszonych (np. `catalog-state-updated`) – zastąpić centralnym.

### 8) Migracje i reset
- `version` w stanie + tablica migracji. Przykład migracji: scalenie legacy kluczy storage do `imStateV1` i usunięcie `custom_*` ID.
- Przycisk „Reset app data” (czyści store i reload) – już dostępny, zostawić jako narzędzie dev.

### 9) Kolejność wdrożenia (iteracje)
1. Store + komendy dla Object/Attribute (Add/Update/Delete) + projekcja encji. Zablokowanie `customAttributes` w UI.
2. Przeniesienie Requirements do komend store (Add/Edit/Remove), usunięcie lokalnych zapisów w `RequirementsView`.
3. Przeniesienie Mapping (`connections`) do komend; Model (`relationships`) do komend.
4. Jeden persist (debounce) i dopięcie migracji; usunięcie eventów rozproszonych.
5. Porządki i testy e2e scenariuszy multi‑view (Add/Modify/Remove z każdej karty).

### 10) Testy e2e (scenariusze do weryfikacji)
- Object → add entity/attribute → Model i Mapping widzą dane; badge PK/FK/PII spójne.
- Model → edit attribute flags (PK/FK/PII) → Object/Mapping odświeżone bez duplikatów.
- Mapping → add requirement + connection → Requirements i Catalog odzwierciedlają.
- Remove ścieżki (entity/attribute/connection/relationship/requirement) – brak „osieroconych” rekordów.

---

## Lista akcji do implementacji / wdrożenia / testów

### A. Infrastruktura
1. Dodać `lib/store.ts` (stan + persist + event bus `stateUpdated`).
2. Dodać `lib/id.ts` (fabryka ID + regex + parseIdType).
3. Dodać `lib/commands.ts` (komendy domenowe; idempotencja; walidacja wejścia).
4. Dodać `lib/projections.ts` (projectEntities, projectMapping).

### B. Refaktoryzacja widoków
5. Mapping/Model: usunąć zapis domenowy z kart; użyć komend store.
6. Object: wykorzystać komendy dla Create/Update/Delete (Concept/Entity/Attribute).
7. Requirements: przepiąć Add/Edit/Remove na komendy; usunąć lokalne zapisy do storage.
8. Sources: import/clear przez komendy; projekcja tylko do odczytu.

### C. Reguły renderowania
9. Badge: PK → FK → PII; booleany zamiast stereotype.
10. Filtr „Keys” = PK || FK; spójny we wszystkich miejscach.

### D. Migracje i reset
11. Wdrożyć `version` i minimalną migrację do `imStateV1` (scalanie legacy kluczy).
12. Utrzymać „Reset app data” – tylko dev.

### E. Testy
13. Scenariusze e2e opisane wyżej (Cypress/manual): multi‑view Add/Modify/Remove.
14. Testy jednostkowe: fabryka ID, komendy (idempotencja), projekcje (kolejność badge, filtry).

---

## Ustalenia i zasady
- Jedno źródło prawdy: LogicalModel + domeny; widoki tylko czytają projekcje.
- Mutacje tylko przez komendy; brak zapisów w komponentach.
- Jeden persist (debounce); jeden event `stateUpdated`.
- ID tylko z `lib/id.ts` z prefiksami: `conc_`, `lent_`, `latr_`, `rel_`, `conn_`, `req_` (i opcjonalne `src*`).

