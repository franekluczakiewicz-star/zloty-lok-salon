# Złoty Lok — salon fryzjerski

Aplikacja do obsługi salonu: klienci, historia usług i osobne terminarze dla trzech fryzjerek (**Ania**, **Ewa**, **Roksana**).

## Gdzie otworzyć

- **Online (GitHub Pages):** https://franekluczakiewicz-star.github.io/zloty-lok-salon/
- **Lokalnie:** http://127.0.0.1:5173/

Jeśli widzisz starą wersję, zrób twarde odświeżenie: **Cmd+Shift+R** (Mac) lub **Ctrl+Shift+R** (Windows).  
W menu po lewej powinno być widać napis **Wersja 22.09.2026**.

## Uruchomienie lokalne

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

## Funkcje

- Klienci — dodawanie, edycja, wyszukiwanie po telefonie
- Terminarze — widok dzienny + wybór daty z kalendarza miesięcznego
- Wizyty równoległe — jak w Outlooku, z potwierdzeniem przy zajętym terminie
- Farby — raport zużycia i zapotrzebowania
- Historia — wszystkie statusy wizyt + kosz usuniętych
- Dane lokalne — zapis w przeglądarce (localStorage)
