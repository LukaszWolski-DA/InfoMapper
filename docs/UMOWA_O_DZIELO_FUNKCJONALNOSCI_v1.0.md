# InfoMapper - Propozycje Funkcjonalności w Ramach Umowy o Dzieło

**Wersja:** 1.0
**Data:** 2025-11-10
**Status:** Propozycja do dyskusji

---

## Spis Treści

1. [Wprowadzenie](#wprowadzenie)
2. [Pakiet 1: Backend Bazodanowy (Priorytet: WYSOKI)](#pakiet-1-backend-bazodanowy)
3. [Pakiet 2: Import/Export Danych (Priorytet: ŚREDNI)](#pakiet-2-importexport-danych)
4. [Pakiet 3: Zaawansowane Funkcje Diagramów (Priorytet: ŚREDNI)](#pakiet-3-zaawansowane-funkcje-diagramów)
5. [Pakiet 4: Data Lineage & Impact Analysis (Priorytet: ŚREDNI-NISKI)](#pakiet-4-data-lineage--impact-analysis)
6. [Pakiet 5: Integracje Zewnętrzne (Priorytet: NISKI)](#pakiet-5-integracje-zewnętrzne)
7. [Rekomendacja Kolejności Realizacji](#rekomendacja-kolejności-realizacji)
8. [Załącznik: Obecna Architektura Aplikacji](#załącznik-obecna-architektura-aplikacji)

---

## Wprowadzenie

### Kontekst Projektu

InfoMapper to aplikacja webowa do zarządzania metadanymi Data Warehouse, obecnie działająca jako Single Page Application (SPA) z persistencją danych w localStorage przeglądarki.

### Cel Dokumentu

Ten dokument przedstawia propozycje funkcjonalności, które mogą zostać przekazane do realizacji w ramach umowy o dzieło, wraz z:
- Szczegółowym opisem zakresu prac
- Kryteriami odbioru (acceptance criteria)
- Szacowanym nakładem pracy
- Zależnościami technicznymi

### Technologie Obecne

- **Frontend:** Next.js 15.2, React 19, TypeScript 5
- **UI:** Tailwind CSS, shadcn/ui, Lucide React
- **State Management:** Custom store z localStorage
- **Deploy:** (do ustalenia - obecnie lokalny development)

---

## Pakiet 1: Backend Bazodanowy

### 1.1 Opis Biznesowy

Przekształcenie aplikacji z lokalnej SPA na multi-user system z centralną bazą danych, umożliwiający:
- Współpracę wielu użytkowników nad tym samym modelem danych
- Backup i odzyskiwanie danych
- Audyt zmian
- Przygotowanie pod przyszłe integracje

### 1.2 Zakres Techniczny

#### 1.2.1 Backend API

**Technologie do rozważenia:**
- Next.js API Routes (rekomendowane - spójność z frontendem)
- Node.js + Express/Fastify (alternatywa)
- tRPC (dla type-safety między FE-BE)

**Funkcjonalności:**

1. **REST/GraphQL API** obejmujące:
   - CRUD dla Concepts (`POST /api/concepts`, `GET /api/concepts`, etc.)
   - CRUD dla Logical Entities
   - CRUD dla Logical Attributes
   - CRUD dla Requirements
   - CRUD dla Diagram Items (Mapping View, Model View)
   - CRUD dla Connections (mappings)
   - CRUD dla Relationships (model)
   - CRUD dla Settings (Entity Stereotypes, Source Column Tags)

2. **Endpointy specjalne:**
   - `POST /api/import` - import danych (bulk operations)
   - `POST /api/export` - export całego projektu
   - `GET /api/health` - health check
   - `GET /api/version` - API version info

3. **Migracja danych:**
   - Endpoint do migracji z localStorage: `POST /api/migrate-from-local`
   - Walidacja struktury danych przed migracją

#### 1.2.2 Baza Danych

**Rekomendowana technologia:** PostgreSQL

**Schema obejmujący tabele:**

```sql
-- Core domain tables
- concepts (id, name, description, order, color, created_at, updated_at)
- logical_entities (id, concept_id, name, stereotype, description, tags, created_at, updated_at)
- logical_attributes (id, entity_id, name, data_type, is_primary_key, is_foreign_key, is_nullable, is_pii, description, order, created_at, updated_at)
- requirements (id, name, description, type, display_id, created_at, updated_at)

-- Diagram/View tables
- diagram_items (id, item_id, item_type, left, top, hidden, collapsed, object_type, attribute_filter, width, show_only_mapped, view_type, created_at, updated_at)
- connections (id, type, source_attr_id, source_attr_name, source_parent_id, source_parent_type, source_item_id, target_attr_id, target_attr_name, target_parent_id, target_parent_type, target_item_id, created_at, updated_at)
- relationships (id, source_entity_id, target_entity_id, label, cardinality, min_source, max_source, min_target, max_target, direction, created_at, updated_at)

-- Settings tables
- entity_stereotypes (id, label, color, is_default, order, created_at, updated_at)
- source_column_tags (id, label, description, color, border_color, is_default, order, created_at, updated_at)

-- Future: Multi-tenancy / Projects
- projects (id, name, description, owner_id, created_at, updated_at)
- (wszystkie inne tabele + project_id jako FK)
```

**Indeksy i optymalizacje:**
- Primary keys na wszystkich tabelach
- Foreign keys z ON DELETE CASCADE gdzie odpowiednie
- Indeksy na często używanych polach (concept_id, entity_id, project_id)
- Timestamps (created_at, updated_at) na wszystkich tabelach

#### 1.2.3 Autentykacja i Autoryzacja

**Rekomendowane rozwiązanie:** Auth.js (NextAuth.js)

**Funkcjonalności MVP:**
1. **Logowanie/Rejestracja:**
   - Email + hasło (opcjonalnie: OAuth Google/GitHub)
   - JWT tokens dla sesji

2. **Model uprawnień (prosty MVP):**
   - Wszyscy zalogowani użytkownicy mają pełen dostęp (read/write)
   - Przygotowanie struktury pod przyszłe role (admin, editor, viewer)

3. **Middleware:**
   - Ochrona endpointów API (wymaga ważnego tokenu)
   - Rate limiting (zabezpieczenie przed abuse)

#### 1.2.4 Deployment

**Rekomendowane rozwiązania:**

**Opcja A - Vercel + Supabase (najszybsza):**
- Frontend + API: Vercel
- Database: Supabase PostgreSQL (free tier: 500MB)
- Auth: Supabase Auth lub Auth.js

**Opcja B - Railway/Render:**
- Full-stack deploy (FE + BE + DB w jednym miejscu)
- PostgreSQL managed database

**Opcja C - Docker + VPS:**
- Pełna kontrola, wymaga więcej setup
- Docker Compose z: Next.js app + PostgreSQL

**Zakres prac deploymentowych:**
- Setup CI/CD pipeline (GitHub Actions)
- Environment variables management
- Database migrations automation
- Backup strategy (daily snapshots)

### 1.3 Kryteria Odbioru

#### 1.3.1 Funkcjonalne

✅ **API Endpoints:**
- [ ] Wszystkie endpointy CRUD działają poprawnie dla każdej encji
- [ ] Zwracają właściwe kody HTTP (200, 201, 400, 404, 500)
- [ ] Walidacja danych wejściowych (Zod schemas)
- [ ] Obsługa błędów z czytelnymi komunikatami

✅ **Baza Danych:**
- [ ] Schema zgodna ze specyfikacją
- [ ] Foreign keys działają poprawnie (cascade deletes)
- [ ] Migrations są wersjonowane i odtwarzalne
- [ ] Seed data dla testów

✅ **Autentykacja:**
- [ ] Użytkownik może się zarejestrować
- [ ] Użytkownik może się zalogować
- [ ] Sesja utrzymuje się po odświeżeniu strony
- [ ] Chronione endpointy zwracają 401 dla niezalogowanych

✅ **Migracja Danych:**
- [ ] Endpoint `/api/migrate-from-local` działa poprawnie
- [ ] Waliduje strukturę danych przed zapisem
- [ ] Zwraca raport z migracją (sukces/błędy)

✅ **Frontend Integration:**
- [ ] Obecny store (`lib/store.ts`) zintegrowany z API
- [ ] Graceful handling offline mode (opcjonalnie)
- [ ] Loading states i error handling w UI
- [ ] Wszystkie obecne widoki działają z backendem

#### 1.3.2 Techniczne

✅ **Kod:**
- [ ] TypeScript bez błędów kompilacji
- [ ] Spójne konwencje nazewnictwa
- [ ] Dokumentacja API (Swagger/OpenAPI lub README)
- [ ] Environment variables template (`.env.example`)

✅ **Testy:**
- [ ] Unit testy dla kluczowych funkcji biznesowych (min. 60% coverage)
- [ ] Integration testy dla API endpoints (min. 5 happy paths)
- [ ] E2E test dla flow: rejestracja → logowanie → create entity → read entity

✅ **Performance:**
- [ ] API response time < 500ms dla prostych queries
- [ ] Database queries zoptymalizowane (brak N+1)
- [ ] Connection pooling skonfigurowany

✅ **Security:**
- [ ] Hasła hashowane (bcrypt)
- [ ] SQL injection protection (prepared statements / ORM)
- [ ] CORS poprawnie skonfigurowany
- [ ] Rate limiting na login endpoint

✅ **Deployment:**
- [ ] Aplikacja wdrożona na staging environment
- [ ] Database backup skonfigurowany (automated)
- [ ] CI/CD pipeline działa (GitHub Actions)
- [ ] Dokumentacja deployment process

#### 1.3.3 Dokumentacja

✅ **Wymagane dokumenty:**
- [ ] **API Documentation** - lista wszystkich endpointów z przykładami
- [ ] **Database Schema** - diagram ER + opis tabel
- [ ] **Deployment Guide** - jak wdrożyć aplikację krok po kroku
- [ ] **Migration Guide** - jak przenieść dane z localStorage do DB
- [ ] **Environment Setup** - zmienne środowiskowe i ich opis
- [ ] **Development Guide** - jak uruchomić lokalnie (dla przyszłych devs)

### 1.4 Szacowany Nakład Pracy

**Estymacja:** 80-120 godzin (2-3 tygodnie full-time)

**Breakdown:**
- Backend API Setup (20-30h)
- Database Schema & Migrations (15-20h)
- Autentykacja (10-15h)
- Frontend Integration (20-30h)
- Deployment & DevOps (10-15h)
- Testing (10-15h)
- Dokumentacja (5-10h)

**Ryzyka:**
- ⚠️ Complexity migracji ze starych danych localStorage
- ⚠️ Performance issues z dużą ilością danych (optymalizacja queries)
- ⚠️ Deployment issues (zależne od wybranego providera)

### 1.5 Zależności i Wymagania Wstępne

**Od wykonawcy:**
- Doświadczenie z Next.js i TypeScript
- Znajomość PostgreSQL i ORMs (Prisma/Drizzle/TypeORM)
- Doświadczenie z REST APIs i autentykacją

**Od zleceniodawcy:**
- Dostęp do repozytorium GitHub
- Decyzja o hosting provider (Vercel/Railway/inne)
- Konto na wybranym providerze (jeśli płatne)

---

## Pakiet 2: Import/Export Danych

### 2.1 Opis Biznesowy

Umożliwienie użytkownikom:
- Importowania metadanych z zewnętrznych źródeł (Excel, CSV, narzędzia modelowania)
- Eksportowania danych do dokumentacji i innych formatów
- Reverse engineering z rzeczywistych baz danych

**Business Value:**
- Oszczędność czasu (zamiast ręcznego wprowadzania)
- Integracja z istniejącymi procesami
- Ułatwienie onboardingu (import z legacy tools)

### 2.2 Zakres Techniczny

#### 2.2.1 Import z Excel/CSV

**Formaty do obsługi:**

1. **Source Systems Import** (Excel/CSV):
```
Database | Schema | Table | Column | Data Type | Is PK | Is FK | Tags
dwh      | staging| users | user_id| bigint    | TRUE  | FALSE | BK,PII
dwh      | staging| users | name   | varchar   | FALSE | FALSE | PII
```

2. **Logical Model Import** (Excel/CSV):
```
Concept  | Entity    | Attribute  | Data Type | Is PK | Description
Customer | Customer  | customer_id| Integer   | TRUE  | Unique identifier
Customer | Customer  | name       | String    | FALSE | Full name
```

**Funkcjonalności:**
- Upload pliku przez UI (drag & drop)
- Walidacja struktury pliku
- Preview przed importem (pokaż 10 pierwszych wierszy)
- Mapowanie kolumn (jeśli nazwy się różnią)
- Conflict resolution (co zrobić z duplikatami?)
- Bulk insert do bazy danych

**Biblioteki:**
- `xlsx` - parsing Excel files
- `papaparse` - parsing CSV files

#### 2.2.2 Export do Excel/PDF

**Export Formats:**

1. **Export do Excel:**
   - Logical Model (Concepts → Entities → Attributes)
   - Source Systems (all sources with columns)
   - Mappings (source → target relationships)
   - Requirements List
   - Multi-sheet workbook

2. **Export do PDF (dokumentacja):**
   - Data Model Documentation
   - Entity Catalog with descriptions
   - Mapping Documentation
   - Formatowanie profesjonalne (logo, spis treści)

**Biblioteki:**
- `exceljs` - tworzenie plików Excel
- `jspdf` + `jspdf-autotable` - tworzenie PDF

#### 2.2.3 Reverse Engineering z Baz Danych

**Supported Databases (MVP):**
- PostgreSQL
- SQL Server
- MySQL
- Oracle (opcjonalnie)

**Funkcjonalności:**
1. **Connection Form:**
   - Host, Port, Database, User, Password
   - Test Connection button
   - Save connection (encrypted credentials)

2. **Schema Selection:**
   - Lista dostępnych schematów
   - Multi-select (możliwość wyboru wielu)

3. **Import Process:**
   - Fetch tables and columns metadata
   - Detect primary keys, foreign keys
   - Import as Source Systems do InfoMappera

**Security:**
- Credentials nie zapisują się w plain text
- Connection stringi szyfrowane (env variable z secret key)
- Opcja "read-only" user w bazie źródłowej

**Biblioteki:**
- `pg` (PostgreSQL)
- `mssql` (SQL Server)
- `mysql2` (MySQL)

### 2.3 Kryteria Odbioru

#### 2.3.1 Import z Excel/CSV

✅ **Funkcjonalne:**
- [ ] Użytkownik może uploadować plik Excel/CSV
- [ ] System wykrywa błędy w strukturze pliku
- [ ] Preview pokazuje dane przed importem
- [ ] Import tworzy poprawne rekordy w bazie
- [ ] Duplikaty są wykrywane i zgłaszane
- [ ] Obsługa polskich znaków (UTF-8)

✅ **Edge Cases:**
- [ ] Obsługa pustych wierszy w pliku
- [ ] Obsługa zbyt dużych plików (limit 10MB)
- [ ] Obsługa błędnych typów danych

#### 2.3.2 Export do Excel/PDF

✅ **Funkcjonalne:**
- [ ] Button "Export to Excel" generuje plik .xlsx
- [ ] Plik zawiera wszystkie arkusze zgodnie ze specyfikacją
- [ ] Formatowanie jest czytelne (header bold, column widths)
- [ ] Export PDF generuje dokument zgodny z template
- [ ] Polskie znaki są poprawnie wyświetlane

#### 2.3.3 Reverse Engineering

✅ **Funkcjonalne:**
- [ ] Formularz połączenia z bazą działa
- [ ] Test Connection zwraca sukces/error
- [ ] Lista schematów jest poprawna
- [ ] Import tworzy Source Systems z poprawnymi danymi
- [ ] Primary keys są wykrywane
- [ ] Foreign keys są wykrywane (opcjonalnie)

✅ **Security:**
- [ ] Credentials nie są logowane w plain text
- [ ] Connection timeout po 30s
- [ ] Read-only mode enforcement (opcjonalnie)

### 2.4 Szacowany Nakład Pracy

**Estymacja:** 40-60 godzin (1-1.5 tygodnia full-time)

**Breakdown:**
- Import Excel/CSV (15-20h)
- Export Excel (10-12h)
- Export PDF (8-10h)
- Reverse Engineering (15-20h)
- Testing & Bug Fixes (5-8h)

### 2.5 Zależności

**Wymaga:** Pakiet 1 (Backend Bazodanowy) - do zapisywania zaimportowanych danych

**Nice to have:** UI/UX dla upload flow (może być przekazane jako osobny task dla designera)

---

## Pakiet 3: Zaawansowane Funkcje Diagramów

### 3.1 Opis Biznesowy

Rozszerzenie funkcjonalności widoków diagramowych (Model View, Mapping View):
- Automatyczne układanie elementów
- Eksport diagramów do obrazów
- Zaawansowane opcje wizualizacji

**Business Value:**
- Prezentacja modeli w dokumentacji i prezentacjach
- Oszczędność czasu przy układaniu dużych diagramów
- Profesjonalny wygląd diagramów

### 3.2 Zakres Techniczny

#### 3.2.1 Auto-Layout Algorytmy

**Algorytmy do zaimplementowania:**

1. **Hierarchical Layout** (dla Model View):
   - Entities układane w poziomy (levels)
   - Minimalizacja przecięć strzałek
   - Wyrównanie kart

2. **Force-Directed Layout** (dla Mapping View):
   - Fizyczny model (sprężyny między połączonymi elementami)
   - Automatyczne rozpraszanie niepołączonych kart

**Biblioteki:**
- `dagre` - hierarchical layout
- `d3-force` - force-directed layout
- Lub `cytoscape.js` (all-in-one solution)

**UI/UX:**
- Button "Auto Layout" w toolbarze
- Opcje: "Horizontal" / "Vertical" / "Force"
- Undo/Redo po auto-layout

#### 3.2.2 Eksport Diagramów do Obrazów

**Formaty:**
- PNG (raster, high-res)
- SVG (vector, skalowalne)

**Funkcjonalności:**
- Export całego widoku
- Export zaznaczonych elementów
- Opcje: z/bez tła, rozdzielczość, padding

**Biblioteki:**
- `html-to-image` - konwersja DOM → PNG
- SVG export: serialization obecnego SVG

**UI:**
- Dropdown: "Export" → "PNG" / "SVG"
- Dialog z opcjami przed exportem

#### 3.2.3 Warstwy i Filtry w Diagramach

**Funkcjonalności:**

1. **Layers:**
   - "Core Entities" (tylko główne obiekty)
   - "Links" (tylko tabele powiązań)
   - "Dictionaries" (tylko słowniki)
   - Toggle visibility per layer

2. **Filters:**
   - Show only entities with mappings
   - Show only unmapped entities
   - Search/highlight entities by name

3. **Collapse/Expand Groups:**
   - Grupowanie entities po Concepts
   - Collapse całego conceptu (show tylko nazwę)

**UI:**
- Panel boczny z checkboxami
- Search bar z highlight results

### 3.3 Kryteria Odbioru

✅ **Auto-Layout:**
- [ ] Button "Auto Layout" działa w Model View
- [ ] Hierarchical layout tworzy czytelny diagram
- [ ] Force layout w Mapping View rozdziela karty
- [ ] Możliwe jest Undo po auto-layout

✅ **Export Obrazów:**
- [ ] Eksport PNG działa (high-res, min 2000px width)
- [ ] Eksport SVG działa
- [ ] Polskie znaki są poprawnie renderowane
- [ ] Export zawiera cały widok (nie ucina elementów)

✅ **Warstwy i Filtry:**
- [ ] Toggle layers działa (show/hide stereotypes)
- [ ] Search highlight działa
- [ ] Collapse groups działa

### 3.4 Szacowany Nakład Pracy

**Estymacja:** 30-45 godzin

**Breakdown:**
- Auto-Layout (15-20h)
- Export Obrazów (8-12h)
- Warstwy/Filtry (7-10h)
- Testing (5-8h)

### 3.5 Zależności

**Niezależne od Pakietu 1** (może być rozwijane równolegle)

**Nice to have:** Pakiet 1 (żeby zapisać ustawienia layers/filters w bazie)

---

## Pakiet 4: Data Lineage & Impact Analysis

### 4.1 Opis Biznesowy

Wizualizacja i analiza przepływu danych:
- Od źródła (source table) → przez logical model → do raportów/dashboardów
- Analiza wpływu zmian (co się stanie jeśli zmienię atrybut X?)

**Business Value:**
- Kluczowa funkcjonalność dla Data Governance
- Ułatwia impact analysis przed zmianami
- Compliance (GDPR - tracking PII data flow)

### 4.2 Zakres Techniczny

#### 4.2.1 Lineage Graph

**Funkcjonalności:**

1. **End-to-End Lineage View:**
   - Nowy widok: "Lineage View"
   - Wyświetla graf: Source → Entity → (future: Reports)
   - Możliwość kliknięcia na atrybut i wyświetlenia jego całego lineage

2. **Lineage Query API:**
   - `GET /api/lineage/attribute/:attributeId` - get full lineage for attribute
   - Rekursywne wyszukiwanie connections

3. **Wizualizacja:**
   - Graph layout (dagre/cytoscape)
   - Color coding: źródła (blue), entities (green), raporty (orange)
   - Strzałki z opisami (transformation logic - opcjonalnie)

#### 4.2.2 Impact Analysis

**Funkcjonalności:**

1. **"What if" Analysis:**
   - Użytkownik wybiera atrybut: "Co jeśli zmienię typ danych?"
   - System pokazuje wszystkie downstream dependencies
   - Highlight impacted entities/attributes

2. **Dependency Report:**
   - Lista wszystkich zależności
   - Export do Excel

3. **Reverse Lineage:**
   - Dla danej tabeli/kolumny w source: pokaż gdzie jest używana

### 4.3 Kryteria Odbioru

✅ **Lineage View:**
- [ ] Nowy widok "Lineage" dostępny w menu
- [ ] Kliknięcie na atrybut pokazuje jego lineage
- [ ] Graf jest czytelny (auto-layout)
- [ ] Można eksportować graf do PNG

✅ **Impact Analysis:**
- [ ] Button "Analyze Impact" przy każdym atrybucie
- [ ] Report pokazuje wszystkie downstream dependencies
- [ ] Export do Excel działa

### 4.4 Szacowany Nakład Pracy

**Estymacja:** 50-70 godzin (1.5-2 tygodnie)

**Breakdown:**
- Lineage Graph Algorithm (20-25h)
- Lineage View UI (15-20h)
- Impact Analysis Logic (10-15h)
- Testing & Performance (10-15h)

### 4.5 Zależności

**Wymaga:** Pakiet 1 (Backend) - lineage queries w bazie danych

---

## Pakiet 5: Integracje Zewnętrzne

### 5.1 Opis Biznesowy

Integracja InfoMappera z narzędziami używanymi w organizacji:
- Confluence/SharePoint - automatyczna publikacja dokumentacji
- JIRA - synchronizacja requirements
- Webhook notifications - powiadomienia o zmianach

### 5.2 Zakres Techniczny

#### 5.2.1 Integracja z Confluence

**Funkcjonalności:**
- Automatyczne tworzenie stron w Confluence
- Publikacja Data Model Documentation
- Sync na żądanie (button "Publish to Confluence")

**API:**
- Confluence REST API
- OAuth 2.0 authentication

#### 5.2.2 Integracja z JIRA

**Funkcjonalności:**
- Import issues jako Requirements
- Sync statusów (JIRA status → InfoMapper requirement status)
- Two-way sync (opcjonalnie)

#### 5.2.3 Webhooks

**Funkcjonalności:**
- Konfiguracja webhook URLs w settings
- Events: entity created, entity updated, mapping created
- Payload: JSON z details of change

### 5.3 Kryteria Odbioru

✅ **Confluence:**
- [ ] OAuth setup działa
- [ ] Publikacja tworzy stronę w Confluence
- [ ] Formatowanie jest poprawne

✅ **JIRA:**
- [ ] Import issues jako requirements działa
- [ ] Sync statusów działa
- [ ] Mapowanie pól JIRA → InfoMapper jest konfigurowalne

✅ **Webhooks:**
- [ ] Konfiguracja webhook URL w settings
- [ ] Events są wysyłane poprawnie
- [ ] Payload zawiera wszystkie dane

### 5.4 Szacowany Nakład Pracy

**Estymacja:** 40-60 godzin

**Breakdown:**
- Confluence Integration (15-20h)
- JIRA Integration (15-20h)
- Webhooks (5-10h)
- Testing (10-15h)

### 5.5 Zależności

**Wymaga:** Pakiet 1 (Backend)

**Dodatkowe wymagania:**
- Dostęp do Confluence/JIRA instance (test environment)
- Konta z odpowiednimi uprawnieniami

---

## Rekomendacja Kolejności Realizacji

### Faza 1: Foundation (MUST HAVE)
**Cel:** Stabilna aplikacja multi-user z backendem

**Pakiety:**
1. **Pakiet 1: Backend Bazodanowy** (Priorytet: KRYTYCZNY)
   - Czas: 2-3 tygodnie
   - Odblokowuje wszystkie inne funkcjonalności

### Faza 2: Quick Wins (SHOULD HAVE)
**Cel:** Funkcjonalności zwiększające produktywność użytkowników

**Pakiety:**
2. **Pakiet 2: Import/Export** (Priorytet: WYSOKI)
   - Czas: 1-1.5 tygodnia
   - Natychmiastowa wartość dla użytkowników

3. **Pakiet 3: Zaawansowane Diagramy** (Priorytet: ŚREDNI)
   - Czas: 1 tydzień
   - Może być realizowane równolegle z Pakiet 2

### Faza 3: Advanced Features (COULD HAVE)
**Cel:** Funkcjonalności różnicujące od konkurencji

**Pakiety:**
4. **Pakiet 4: Data Lineage** (Priorytet: ŚREDNI-NISKI)
   - Czas: 1.5-2 tygodnie
   - Duża wartość dla enterprise users

### Faza 4: Integrations (NICE TO HAVE)
**Cel:** Integracja z ekosystemem narzędzi

**Pakiety:**
5. **Pakiet 5: Integracje** (Priorytet: NISKI)
   - Czas: 1-1.5 tygodnia
   - Zależne od potrzeb konkretnego klienta

### Timeline (Optymistyczny)

```
Miesiąc 1:
┌─────────────────────────────────────┐
│ Pakiet 1: Backend (3 tygodnie)     │
└─────────────────────────────────────┘

Miesiąc 2:
┌───────────────────────┬─────────────┐
│ Pakiet 2: Import/Export (1.5 tyg)   │
├───────────────────────┴─────────────┤
│ Pakiet 3: Diagramy (1 tydzień)     │
└─────────────────────────────────────┘

Miesiąc 3:
┌─────────────────────────────────────┐
│ Pakiet 4: Lineage (2 tygodnie)     │
├─────────────────────────────────────┤
│ Pakiet 5: Integracje (1.5 tyg)     │
└─────────────────────────────────────┘
```

**Łączny czas:** ~2.5-3 miesiące (przy full-time developer)

---

## Załącznik: Obecna Architektura Aplikacji

### Tech Stack
- **Framework:** Next.js 15.2 (App Router)
- **Language:** TypeScript 5
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **State:** Custom store (`lib/store.ts`) z localStorage
- **Icons:** Lucide React

### Kluczowe Pliki

#### State Management
- **`lib/store.ts`** - Global state management
  - `getObjectState()` - getter
  - `setObjectState()` - setter with persistence
  - `subscribe()` - listener registration
  - `initObjectStateFromStorage()` - init from localStorage

#### Domain Types
- **`lib/types.ts`** - Core domain types
  - `Concept`, `LogicalEntity`, `LogicalAttribute`
  - `Requirement`
  - `DiagramItem`, `Connection`, `Relationship`
  - `EntityStereotypeConfig`, `SourceColumnTagConfig`

#### Commands (State Mutations)
- **`lib/commands.ts`** - State mutation functions
  - `addConcept()`, `updateConcept()`, `deleteConcept()`
  - `addEntity()`, `updateEntity()`, `deleteEntity()`
  - `addAttribute()`, `updateAttribute()`, `deleteAttribute()`
  - Podobnie dla Requirements, Connections, Relationships, Settings

### Obecny Data Model

```typescript
GlobalState {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  requirements: RequirementRow[]
  items: DiagramItem[] // Mapping View
  connections: Connection[] // Mapping View
  modelItems: DiagramItem[] // Model View
  modelRelationships: Relationship[] // Model View
  settings: SettingsConfig
  version: number
}
```

### Kluczowe Zależności

```json
{
  "next": "15.2.4",
  "react": "^19",
  "typescript": "^5",
  "@radix-ui/*": "latest", // shadcn/ui components
  "lucide-react": "^0.454.0",
  "tailwindcss": "^4.1.9"
}
```

### Deployment (Obecny Stan)
- **Development:** Local (`npm run dev`)
- **Production:** TBD (wymaga decyzji w Pakiet 1)

---

## Kontakt i Dalsze Kroki

### Pytania Do Wykonawcy Przed Rozpoczęciem

1. **Techniczne:**
   - Preferowany stack backendu? (Next.js API Routes / Express / inne)
   - Preferowany ORM? (Prisma / Drizzle / TypeORM)
   - Doświadczenie z wybranym hosting providerem?

2. **Proces:**
   - Preferowany sposób komunikacji? (Slack / Email / GitHub Issues)
   - Częstotliwość demo/review? (tygodniowo / co 2 tygodnie)
   - Czy wykonawca dostarcza testy? (unit / integration / e2e)

3. **Deliverables:**
   - Format dokumentacji? (Markdown / Confluence / Google Docs)
   - Czy kod review przed final delivery?

### Następne Kroki

1. **Dyskusja z zespołem:**
   - Które pakiety są priorytetowe?
   - Jaki budget/timeline?
   - Kto będzie maintainował kod po dostawie?

2. **Wybór wykonawcy:**
   - Prezentacja tego dokumentu potencjalnym wykonawcom
   - Zbieranie ofert (scope + czas + koszt)
   - Weryfikacja portfolio (podobne projekty)

3. **Przygotowanie umowy:**
   - Szczegółowy zakres (wybrane pakiety)
   - Kryteria odbioru (z tego dokumentu)
   - Milestones i płatności
   - IP rights i confidentiality

---

**Dokument przygotowany:** 2025-11-10
**Autor:** Claude (AI Assistant) + Lukasz
**Wersja:** 1.0 (Draft do dyskusji)
