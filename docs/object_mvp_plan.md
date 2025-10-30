## Plan MVP – karta Object (Koncept → Encja → Atrybut)

### Założenia i zakres
- **Cel**: edytor hierarchii modelu logicznego danych, który zasila widoki `Model` i `Mapping`.
- **Hierarchia**: Koncept → Encja → Atrybut.
- **Źródło prawdy**: karta Object; `Model` i `Mapping` korzystają z projekcji danych.

## Etap 0: Model danych i walidacja
- **Typy** (TS):
  - `Concept`: `id`, `name`, `description?`, `order?`
  - `LogicalEntity`: `id`, `conceptId`, `name`, `stereotype?` (Dimension/Fact/Link/Dictionary), `description?`, `tags?[]`
  - `LogicalAttribute`: `id`, `entityId`, `name`, `dataType?` (String/Integer/Decimal/Boolean/Date/JSON), `isPrimaryKey?`, `isNullable?`, `isPII?`, `description?`, `order?`
- **Walidacja (Zod)**: `ConceptSchema`, `LogicalEntitySchema`, `LogicalAttributeSchema`, `ObjectModelStateSchema` (listy) + reguły nazw (trymowanie, zakres długości, zakazane znaki).
- **Trwałość**: rozszerzenie `localStorage` (`infoMapperStateV1`) o `concepts`, `logicalEntities`, `logicalAttributes` (bez migracji wstecz).
- **Akceptacja**: parsowanie/serializacja nowej części stanu działa; brak regresji w istniejących widokach.

## Etap 1: Szkielet UI karty Object
- **Layout**: 3‑panelowy.
  - Lewy: drzewo Koncept → Encje → Atrybuty z wyszukiwarką.
  - Środek: formularz szczegółów zaznaczonego elementu + tabela atrybutów (inline).
  - Prawy: panel walidacji/ostrzeżeń na żywo.
- **Komponenty**:
  - `components/object-tree.tsx`: drzewo z akcjami Dodaj/Usuń/Kopiuj.
  - `components/object-details.tsx`: formularz encji/konceptu + grid atrybutów.
  - Reuse prymitywów z `components/ui/*`.
- **Akceptacja**: zmiana zaznaczenia odświeża detale; placeholdery bez logiki CRUD.

## Etap 2: CRUD Koncept/Encja/Atrybut
- **Akcje**: `createConcept`, `updateConcept`, `deleteConcept`; `createEntity(conceptId)`, `updateEntity`, `deleteEntity`; `createAttribute(entityId)`, `updateAttribute`, `deleteAttribute`.
- **Zachowanie**: usuwanie kaskadowe (potwierdzenia), re‑order atrybutów (opcjonalnie drag/strzałki).
- **UX**: dodawanie z drzewa (ikonki/FAB), edycja nazw inline; reszta w panelu środkowym.
- **Akceptacja**: CRUD działa; zapis do `localStorage`; odświeżenie zachowuje stan.

## Etap 3: Walidacje i ostrzeżenia (MVP)
- **Reguły**: unikalność nazw encji w obrębie konceptu; unikalność atrybutów w encji; ostrzeżenie dla braku PK; opcjonalnie puste opisy.
- **UI**: prawy panel z listą problemów; klik przenosi do elementu (focus/scroll).
- **Akceptacja**: problemy oznaczane na żywo; brak twardych blokad w MVP.

## Etap 4: Integracja z Model i Mapping
- **Projekcja danych**: `LogicalEntity`/`LogicalAttribute` → struktury `Entity`/`Attribute` używane przez `Model` i `Mapping`.
- **Kierunek danych**: jednostronny (edycja w Object → odczyt w Model/Mapping).
- **Akceptacja**: nowe encje/atrybuty widoczne w panelu Model i w drzewie Mapping (drag‑and‑drop działa).

## Etap 5: Export/Import rozszerzony
- **JSON**: rozszerzenie eksportu/importu o `concepts`, `logicalEntities`, `logicalAttributes`.
- **Walidacja importu**: pełne `ObjectModelStateSchema` + bezpieczne podstawienia wartości domyślnych.
- **Akceptacja**: import przywraca strukturę Object i integruje się z Model/Mapping bez refreshu aplikacji.

## Etap 6: UX dopracowanie (po MVP)
- **Szablony**: 2–3 wzorce encji (np. Słownik/Wymiar/Fakt) z predefiniowanymi atrybutami.
- **Tagi i wyszukiwarka**: po tagach/typach; filtrowanie listy.
- **Sortowanie/grupowanie**: wg stereotypu, alfabetycznie, ręczny porządek.
- **Akceptacja**: szybkie wstawianie z szablonów; filtrowanie po tagach działa.

## Testy ręczne – checklista
- Utwórz Koncept A; encje (np. Klient, Umowa); atrybuty (PK, PII, typy danych).
- Zweryfikuj walidacje (duplikaty nazw, brak PK, puste opisy).
- Odśwież stronę – stan zachowany (localStorage).
- Sprawdź widoczność w Model/Mapping i możliwość przeciągania/mapowania.
- Eksport → wyczyść localStorage → import → odtworzenie struktur.

## Dalsze kroki (po MVP)
- Governance: właściciel, domena, klasyfikacja PII, SLA; raport zgodności.
- Wersjonowanie: snapshoty, diff, revert; łączenie z repo JSON.



