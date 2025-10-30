## Sources – instrukcja i szablony danych do importu struktur tabel (MVP)

Ten dokument opisuje, jak przygotować dane testowe dotyczące struktur źródeł (systemy → bazy → schematy → obiekty → kolumny), aby w kolejnych iteracjach zasilić kartę `Sources` w InfoMapper.

Docelowo rekomendowanym formatem jest JSON odpowiadający strukturom `lib/source-types.ts`. Dla wygody dołączony jest też wariant CSV (dwa pliki: obiekty i kolumny).

---

### 1) Zalecany format: JSON

Struktura JSON odpowiada typom:
- `SourceSystem`: { id, name }
- `SourceDatabase`: { id, systemId, name }
- `SourceSchema`: { id, databaseId, name }
- `SourceObject`: { id, schemaId, name, objectType: "table"|"view", columns[], rowCount?, comment? }
- `SourceColumn`: { id, objectId, name, dataType{ base, length?, precision?, scale? }, nullable, isPrimaryKey?, isForeignKey?, defaultValue?, comment? }

Kluczowe reguły:
- `id` muszą być unikalne w swoich kolekcjach.
- Relacje muszą się spinać: `database.systemId` → istniejący system; `schema.databaseId` → baza; `object.schemaId` → schemat; `column.objectId` → obiekt.
- `objectType` ∈ { table, view }.
- `dataType.base` np. "varchar", "numeric", "int", "date", "timestamp", "boolean", "json".
- Parametry typów:
  - varchar/char → `length` (liczba całkowita)
  - numeric/decimal → `precision` i `scale`
  - inne typy zwykle bez parametrów

#### Szablon JSON (do uzupełnienia)
```json
{
  "systems": [
    { "id": "sys_hr", "name": "HR" }
  ],
  "databases": [
    { "id": "db_hrdta", "systemId": "sys_hr", "name": "hrdta" }
  ],
  "schemas": [
    { "id": "sch_dbo", "databaseId": "db_hrdta", "name": "dbo" }
  ],
  "objects": [
    {
      "id": "obj_employee_t",
      "schemaId": "sch_dbo",
      "name": "employee_t",
      "objectType": "table",
      "rowCount": 123456,
      "comment": "HR employees master table",
      "columns": [
        {
          "id": "col_empl_id",
          "objectId": "obj_employee_t",
          "name": "empl_id",
          "dataType": { "base": "numeric", "precision": 5, "scale": 4 },
          "nullable": false,
          "isPrimaryKey": true
        },
        {
          "id": "col_first_name",
          "objectId": "obj_employee_t",
          "name": "first_name",
          "dataType": { "base": "varchar", "length": 255 },
          "nullable": false
        }
      ]
    },
    {
      "id": "obj_employee_v",
      "schemaId": "sch_dbo",
      "name": "employee_v",
      "objectType": "view",
      "columns": [
        {
          "id": "col_empl_id_v",
          "objectId": "obj_employee_v",
          "name": "empl_id",
          "dataType": { "base": "numeric", "precision": 5, "scale": 4 },
          "nullable": false
        }
      ],
      "comment": "Employee view"
    }
  ]
}
```

#### Minimalny przykład (HR.hrdta.dbo.employee_t.empl_id)
```json
{
  "systems": [ { "id": "sys_hr", "name": "HR" } ],
  "databases": [ { "id": "db_hrdta", "systemId": "sys_hr", "name": "hrdta" } ],
  "schemas": [ { "id": "sch_dbo", "databaseId": "db_hrdta", "name": "dbo" } ],
  "objects": [
    {
      "id": "obj_employee_t",
      "schemaId": "sch_dbo",
      "name": "employee_t",
      "objectType": "table",
      "columns": [
        {
          "id": "col_empl_id",
          "objectId": "obj_employee_t",
          "name": "empl_id",
          "dataType": { "base": "numeric", "precision": 5, "scale": 4 },
          "nullable": false,
          "isPrimaryKey": true
        }
      ]
    }
  ]
}
```

---

### 2) Alternatywa: CSV (dwa pliki)

Możesz przygotować dane jako dwa pliki CSV: `objects.csv` i `columns.csv`. W CSV stosujemy nazwy „ludzkie” zamiast id – importer zbuduje id i strukturę.

#### objects.csv – kolumny
```
system,database,schema,object,objectType,rowCount,comment
HR,hrdta,dbo,employee_t,table,123456,HR employees master table
HR,hrdta,dbo,employee_v,view,,Employee view
```

Reguły:
- `objectType` ∈ { table, view }
- `rowCount` opcjonalny; puste dopuszczalne

#### columns.csv – kolumny
```
system,database,schema,object,column,dataTypeBase,length,precision,scale,nullable,isPrimaryKey,isForeignKey,defaultValue,comment
HR,hrdta,dbo,employee_t,empl_id,numeric,,5,4,false,true,false,,
HR,hrdta,dbo,employee_t,first_name,varchar,255,,,false,false,false,,
HR,hrdta,dbo,employee_v,empl_id,numeric,,5,4,false,false,false,,
```

Reguły:
- `nullable` ∈ { true, false }
- `isPrimaryKey`, `isForeignKey` ∈ { true, false }
- Typy:
  - varchar/char → `length` (liczba)
  - numeric/decimal → `precision`, `scale` (liczby)
  - inne → bez parametrów (pozostaw puste)

---

### 3) Walidacje przy imporcie (MVP)
- Spójność referencji (system → baza → schemat → obiekt → kolumna).
- Duplikaty nazw kolumn w obrębie obiektu (ostrzeżenie/błąd).
- Brak PK na tabeli (ostrzeżenie).
- Braki parametrów typów (np. `numeric` bez `precision/scale`, `varchar` bez `length`).
- `objectType` poza zakresem {table, view} → błąd.

---

### 4) Nazewnictwo i FQN
- FQN obiektu: `System.Database.Schema.Object` (np. `HR.hrdta.dbo.employee_t`).
- Ścieżka kolumny: `System.Database.Schema.Object.Column` (np. `HR.hrdta.dbo.employee_t.empl_id`).

---

### 5) Organizacja plików w repo (propozycja)
- Umieść przygotowane pliki w katalogu: `docs/data/sources/` (np. `sources.json`, `objects.csv`, `columns.csv`).
- W kolejnej iteracji dodamy importer JSON/CSV, który zasili stan karty `Sources`.

---

### 6) Checklista przed importem
- [ ] W JSON/CSV wszystkie nazwy/relacje są spójne (system→baza→schemat→obiekt→kolumna)
- [ ] Każdy obiekt ma `objectType` (table/view)
- [ ] Kolumny mają poprawnie zdefiniowany `dataType.base` i wymagane parametry
- [ ] Tabele mają oznaczone PK (jeśli dotyczy)
- [ ] Brak ewidentnych duplikatów nazw kolumn w obrębie jednego obiektu













