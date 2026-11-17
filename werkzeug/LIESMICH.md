# Werkzeuge für die Web-Fassung der Scherbenwelt-Karte

Die Web-Seite liegt im Zweig `gh-pages` und wird aus einer exportierten Spielerkarte (`Scherbenwelt_Spielerkarte_*.html`) erzeugt.
Arbeitsstand und Spielerexport bleiben dabei unverändert; alle Regeln unten gelten nur für die Web-Seite.

## Ablauf bei einem Karten-Update

```
git clone https://github.com/BoHMaybe/Scherbenwelt-Karte.git karte
git -C karte worktree add ../seite gh-pages
python3 karte/werkzeug/build.py   <Spielerkarte.html> /tmp/web
python3 karte/werkzeug/pruefen.py <Spielerkarte.html> /tmp/web          # muss mit "ALLES OK" enden
python3 karte/werkzeug/uebernehmen.py /tmp/web seite
git -C seite add -A && git -C seite commit -m "Web-Fassung auf Stand ..." && git -C seite push origin gh-pages
```

Abhängigkeiten: Python 3, Pillow, Playwright mit Chromium.
Nicht veröffentlicht wird je der Arbeitsstand der Spielleitung, nur die exportierte Spielerkarte.

## Was `build.py` macht

| Schritt | Inhalt |
|---|---|
| Aufteilen | eingebettete Bilder und Musik ab 20 KB werden als Dateien nach `a/` ausgelagert (Name = Prüfsumme), JPEG wird zu WebP (Qualität 80), wenn kleiner |
| Programmanpassung | drei Stellen, die eingebettete Daten voraussetzten (Compendium-Bilder, Wappen, Musik), akzeptieren auch Dateiverweise; jede Stelle wird mit Zähler geprüft, ein geänderter Programmstand bricht den Umbau ab |
| Suchmaschinen | `noindex,nofollow` |
| Boxen beim Öffnen | nur die Liste `KEEP` ist angewählt, alles andere aus und einschaltbar |
| Teleportverbindungen | sichtbar nur, wenn beide Orte besucht sind oder ein Ort „Widerstand“ hat, nie bei einem Ende „Tendenz Loyal“ oder „Imperiumstreu“; gesperrte Ziele werden aus den Daten entfernt |
| Reisejournal | Bilder an Einträgen „Legendäre Kreatur“ werden entfernt (Fremdillustrationen), Text bleibt |
| Panorama (`pano_inject.py`) | Link „Panorama ansehen“ im Ortsfenster bei Orten ab `PANO_MIN` Einwohnern, sobald `panorama/<Siedlungs-ID>.webp` (auch .jpg/.jpeg/.png, auch kleingeschrieben) vorliegt; Vollbild über der Karte, Schließen mit X oder Esc |

## Panoramabilder

Liegen dauerhaft im Zweig `gh-pages` im Ordner `panorama/` und werden von `uebernehmen.py` nie verändert.

```
python3 karte/werkzeug/panorama_bild.py  <Bild> <Siedlungs-ID> seite       # verkleinert auf 2400 px, WebP 200-400 KB
python3 karte/werkzeug/panorama_liste.py <Spielerkarte.html> liste.csv seite # Orte mit Dateinamen und Bildstand
```

Dateinamen in Großbuchstaben ablegen (z. B. `BER-S112.webp`). Neue Bilder wirken sofort, ohne Karten-Update.
Das Repository ist öffentlich: nur eigene oder KI-erzeugte Bilder, keine Bilder geheimer Orte.
