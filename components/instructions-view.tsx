"use client"

export function InstructionsView() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-12 py-10">
        {/* Header */}
        <div className="mb-10 pb-8 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Witaj w InfoMapper</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            InfoMapper to narzędzie do modelowania danych, mapowania źródeł i automatyzacji wytwarzania hurtowni danych (DWH). 
            Poniżej znajdziesz opis wszystkich dostępnych kart i ich przeznaczenia.
          </p>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {/* Sources */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sources – Systemy Źródłowe</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Import metadanych z systemów źródłowych (bazy danych, pliki, API). Przeglądaj strukturę 
              tabel, widoków i kolumn z systemów, które będą zasilać Twoją hurtownię.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Hierarchia:</p>
              <p className="text-xs text-gray-600">System → Baza → Schemat → Tabela/Widok → Kolumna</p>
              <p className="text-xs text-gray-500 mt-1">Przykład: HR.hrdta.dbo.employee_t.empl_id</p>
            </div>
            <p className="text-xs text-gray-600"><strong>Możliwości:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Przeglądanie zaimportowanych źródeł</li>
              <li>• Wyszukiwanie po nazwach tabel/kolumn</li>
              <li>• Podgląd typów danych i właściwości kolumn</li>
              <li>• Kopiowanie ścieżek FQN (fully qualified names)</li>
            </ul>
          </div>

          {/* Object */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Object – Model Logiczny</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Karta do tworzenia logicznego modelu danych. Definiujesz tutaj <strong>Koncepty</strong> (grupy logiczne), 
              <strong>Encje</strong> (tabele/obiekty biznesowe) oraz <strong>Atrybuty</strong> (kolumny).
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Hierarchia:</p>
              <p className="text-xs text-gray-600">Koncept → Encja → Atrybut</p>
              <p className="text-xs text-gray-500 mt-1">Przykład: Klient → Customer → customer_id</p>
            </div>
            <p className="text-xs text-gray-600"><strong>Możliwości:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Tworzenie i edycja konceptów, encji i atrybutów</li>
              <li>• Definiowanie kluczy głównych (PK) i obcych (FK)</li>
              <li>• Oznaczanie danych osobowych (PII)</li>
              <li>• Stereotypy encji (Object, Link, Dictionary, Context, Informative)</li>
            </ul>
          </div>

          {/* Model */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Model – Diagram Relacji</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Wizualizacja modelu danych jako diagramu encji z relacjami. Przeciągaj encje z panelu bocznego na obszar 
              diagramu, łącz je relacjami i definiuj kardynalności (1:1, 1:N, M:N).
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Relacje:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>1:1</strong> – jeden do jednego (np. Osoba → Paszport)</li>
                <li>• <strong>1:N</strong> – jeden do wielu (np. Klient → Zamówienia)</li>
                <li>• <strong>M:N</strong> – wiele do wielu (np. Studenci ↔ Kursy)</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Możliwości:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Drag & drop encji na diagram</li>
              <li>• Tworzenie relacji między encjami (krzywe Bezier)</li>
              <li>• Edycja kardynalności i kierunków relacji (double-click)</li>
              <li>• Zoom (Ctrl + scroll), Pan (Space + drag)</li>
              <li>• Filtrowanie atrybutów (All / Keys)</li>
            </ul>
          </div>

          {/* Requirements */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements – Wymagania Biznesowe</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Zarządzanie wymaganiami funkcjonalnymi i niefunkcjonalnymi. Dodawaj, edytuj i śledź 
              wymagania biznesowe, które muszą być spełnione przez model danych.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Typy wymagań:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Functional</strong> – wymagania funkcjonalne</li>
                <li>• <strong>Non-functional</strong> – wymagania niefunkcjonalne</li>
                <li>• <strong>Other</strong> – pozostałe wymagania</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Możliwości:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Tworzenie i edycja wymagań</li>
              <li>• Dodawanie opisów i kategorii</li>
              <li>• Łączenie wymagań z encjami w Mapping</li>
            </ul>
          </div>

          {/* Mapping */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Mapping – Mapowanie Danych</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Wizualne mapowanie źródeł danych do modelu logicznego. Przeciągaj encje, źródła i wymagania 
              na diagram, a następnie łącz atrybuty źródłowe z docelowymi.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Typy mapowań:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Attribute Mapping</strong> – atrybut źródła → atrybut encji</li>
                <li>• <strong>Requirement Mapping</strong> – wymaganie → encja/atrybut</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Możliwości:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Drag & drop encji, źródeł i wymagań</li>
              <li>• Łączenie atrybutów liniami (click → drag → click)</li>
              <li>• Filtrowanie atrybutów (All / Mapped / Unmapped)</li>
              <li>• Eksport/Import mapowań do JSON</li>
            </ul>
          </div>

          {/* Catalog */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Catalog – Katalog Danych</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Tabelaryczny przegląd wszystkich elementów modelu. Przeglądaj koncepty, encje, atrybuty 
              i mapowania w formie uporządkowanej tabeli.
            </p>
            <p className="text-xs text-gray-600"><strong>Możliwości:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Sortowanie i filtrowanie danych</li>
              <li>• Wyszukiwanie po nazwach i opisach</li>
              <li>• Eksport do CSV (w przyszłości)</li>
              <li>• Szybki podgląd wszystkich elementów</li>
            </ul>
          </div>

          {/* Validation */}
          <div className="bg-white border border-gray-200 rounded p-5 opacity-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Validation – Walidacja Modelu
              <span className="ml-2 text-xs font-normal text-gray-500">Wkrótce</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automatyczna walidacja modelu i wykrywanie problemów (brak PK, duplikaty, niespójności).
            </p>
          </div>

          {/* Export */}
          <div className="bg-white border border-gray-200 rounded p-5 opacity-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Export – Generowanie Artefaktów
              <span className="ml-2 text-xs font-normal text-gray-500">Wkrótce</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Generowanie DDL, skryptów ELT/ETL, dokumentacji i testów na podstawie modelu.
            </p>
          </div>

          {/* Settings */}
          <div className="bg-white border border-gray-200 rounded p-5 opacity-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Settings – Ustawienia
              <span className="ml-2 text-xs font-normal text-gray-500">Wkrótce</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Konfiguracja aplikacji, preferencje użytkownika i ustawienia zaawansowane.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Szybki Start</h3>
          <div className="bg-white border border-gray-200 rounded p-5">
            <ol className="space-y-2 text-xs text-gray-700">
              <li><strong>1. Sources:</strong> Zaimportuj metadane źródłowe (jeśli dostępne)</li>
              <li><strong>2. Object:</strong> Utwórz koncept i dodaj pierwszą encję z atrybutami (np. Customer z customer_id jako PK)</li>
              <li><strong>3. Model:</strong> Przeciągnij encje na diagram i połącz relacjami</li>
              <li><strong>4. Requirements:</strong> Dodaj wymagania biznesowe (opcjonalnie)</li>
              <li><strong>5. Mapping:</strong> Zmapuj atrybuty ze źródeł do modelu logicznego</li>
              <li><strong>6. Catalog:</strong> Przejrzyj kompletny katalog wszystkich elementów</li>
            </ol>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Wskazówki</h3>
          <div className="bg-white border border-gray-200 rounded p-5">
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li>• <strong>Autosave:</strong> Wszystkie dane są automatycznie zapisywane w localStorage przeglądarki</li>
              <li>• <strong>Export/Import:</strong> W kartach Mapping i Model możesz eksportować dane do JSON i importować z powrotem</li>
              <li>• <strong>Skróty klawiaturowe:</strong> Ctrl+Scroll (zoom), Space+Drag (pan), Delete (usuń zaznaczony element)</li>
              <li>• <strong>Filtry:</strong> Każda karta ma własne filtry - użyj ich aby szybko znaleźć potrzebne elementy</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>InfoMapper v1.0 • Dane przechowywane lokalnie w przeglądarce (localStorage)</p>
        </div>
      </div>
    </div>
  )
}

