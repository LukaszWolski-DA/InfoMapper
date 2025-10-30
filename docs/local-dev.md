## Uruchomienie InfoMapper lokalnie (http://127.0.0.1:3000/)

### Wymagania
- Node.js 18+ (zalecane 18 LTS lub nowszy)
- npm 9+ (lub yarn/pnpm – opcjonalnie)

Sprawdź wersje:

```
node -v
npm -v
```

### Instalacja zależności (pierwsze uruchomienie lub po zmianie pakietów)

```
# w katalogu głównym repozytorium
npm ci
# jeśli "npm ci" zgłasza brak lockfile, użyj:
# npm install
```

### Start w trybie deweloperskim

Najprościej:

```
npm run dev
# Otwórz: http://127.0.0.1:3000/
```

Jeśli chcesz wymusić nasłuch na 127.0.0.1 i porcie 3000:

```
npx next dev -H 127.0.0.1 -p 3000
# Otwórz: http://127.0.0.1:3000/
```

Zatrzymanie:

```
# w tym samym oknie terminala
Ctrl + C
```

### Rozwiązywanie problemów
- Port zajęty: zmień port, np. `npx next dev -H 127.0.0.1 -p 3001`, lub zamknij proces na porcie 3000.
- Błędy builda po aktualizacjach: usuń artefakty i zbuduj ponownie:

```
rd /s /q .next  
npm run dev
```

- Zmiana przeglądarki/środowiska: jeśli adres `localhost:3000` działa, preferuj `http://127.0.0.1:3000/` zgodnie z naszym standardem.













