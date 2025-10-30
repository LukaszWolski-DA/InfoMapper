1. Karta Object
Użytkownik w tej karcie będzie tworzył kluczowe elementy logicznego modelu danych.
Kluczowe obiekty:
a) Koncept - abstrakcyjny element nadrzędny, grupujący logiczne encje
b) Encja - logiczna reprezentacja modelu danych (tabela, widok, noścnik konkretnej informacji biznesowej)
c) Atrybut - składnik encji, kolumna, np. numer klienta, kwota, etc.

Hierarchia: Koncept -> Encja -> Atrybut.

2. Karta Sources
Użytkownik w tej karcię będzie improtował metdane systemów źródłowych - tabele, widoki, pliki płaskie.
Chciałbym aby w karcie Sources również było drzewo - format i styl zbliżony do drzewa w karcie Model (style, wcięcia).

Hierarchia drzewa:
Source System -> Baza danych -> Schemat -> Tabela (lub widok) -> Kolumna (właściwości kolumny, np. data type, data precision)
Przykład: HR.hrdta.dbo.employee_t.empl_id (numeric(5,4), not null)