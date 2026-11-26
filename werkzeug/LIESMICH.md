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
| Bilder | seit V10.94 verweist die Spielerkarte auf `bilder/<name>`; die verwiesenen Dateien werden aus dem Ordner `bilder/` des Zweigs `gh-pages` in den Zielordner kopiert (drittes Argument, Vorgabe `../../scherbenwelt-karte/bilder`) |
| Programmanpassung | drei Stellen, die eingebettete Daten voraussetzten (Compendium-Bilder, Wappen, Musik), akzeptieren auch Dateiverweise; jede Stelle wird mit Zähler geprüft, ein geänderter Programmstand bricht den Umbau ab |
| Suchmaschinen | `noindex,nofollow` |
| Boxen beim Öffnen | nur die Liste `KEEP` ist angewählt, alles andere aus und einschaltbar |
| Teleportverbindungen | sichtbar nur, wenn beide Orte besucht sind oder ein Ort „Widerstand“ hat, nie bei einem Ende „Tendenz Loyal“ oder „Imperiumstreu“; gesperrte Ziele werden aus den Daten entfernt |
| Reisejournal | Bilder an Einträgen „Legendäre Kreatur“ werden entfernt (Fremdillustrationen), Text bleibt |
| Panorama (`pano_inject.py`) | Link „Panorama ansehen“ im Ortsfenster bei Orten ab `PANO_MIN` Einwohnern oder mit Typ aus `PANO_TYPEN` (Großstadt, Stadt, Bezirkszentrum, Kartenort, Landschaft / besonderer Ort), sobald `panorama/<Siedlungs-ID>.webp` (auch .jpg/.jpeg/.png, auch kleingeschrieben) vorliegt; ebenso im Fundortfenster der entdeckten Fundorte mit `panorama/<POI-ID>.webp` (z. B. `POI-DSC-026.webp`); Vollbild über der Karte, Schließen mit X oder Esc |
| Darstellung (`pano_inject.py`) | Link „Darstellung“ im Heer- und Flottenfenster der Karte und im Compendium (Söldnereintrag: zugehöriges Söldnerheer bzw. -flotte; Machtgruppeneintrag: alle Heere und Flotten der Spielerdatei mit dieser Machtgruppe als Träger, bei Heeresverbänden jedes beteiligte Haus), sobald `darstellung/<Kennung>.webp` vorliegt (z. B. `FH-S008`, `FF-0139`, `FH-0503`, `VB-002`, `CU-A01`); Karte und Compendium öffnen dieselbe Datei im Vollbild |

## Panoramabilder

Liegen dauerhaft im Zweig `gh-pages` im Ordner `panorama/` und werden von `uebernehmen.py` nie verändert.

```
python3 karte/werkzeug/panorama_bild.py  <Bild> <Siedlungs-ID> seite       # verkleinert auf 2400 px, WebP 200-400 KB
python3 karte/werkzeug/panorama_liste.py <Spielerkarte.html> liste.csv seite # Orte und Fundorte mit Dateinamen und Bildstand
```

Dateinamen in Großbuchstaben ablegen (z. B. `BER-S112.webp`, Fundorte `POI-BER-012.webp`). Neue Bilder wirken sofort, ohne Karten-Update.
Das Repository ist öffentlich: nur eigene oder KI-erzeugte Bilder, keine Bilder geheimer Orte.

## Darstellungsbilder (Heere und Flotten)

Liegen dauerhaft im Zweig `gh-pages` im Ordner `darstellung/` (nur online, nicht im Arbeitsstand) und werden von `uebernehmen.py` nie verändert.

```
python3 karte/werkzeug/panorama_bild.py <Bild> <Kennung> seite 2400 darstellung   # z. B. FH-S008, FF-0139, VB-002
```

## Ausgelagerte Bilder (seit V10.94)

Große Bilder (Compendium-Bildblöcke ohne Wappen, Scherbenkarten, Weltkarte; ab 20 KB) liegen nicht mehr im Arbeitsstand:

| Ablage | Verweis in den Daten | Inhalt |
|---|---|---|
| Zweig `gh-pages`, Ordner `bilder/` (öffentlich) | `bilder/<name>` | Bilder in Einträgen und Karten, die in der Spielerkarte stehen, auch geschwärzte |
| Repo `BoHMaybe/scherbenwelt-sl`, Ordner `bilder/` (privat) | `slbild:<name>` | Bilder in Einträgen und Karten nur für die Spielleitung; nie in der Spielerkarte |

`<name>` = erste 16 Zeichen der SHA-1-Prüfsumme des Base64-Inhalts + Endung; der Inhalt wird nicht neu kodiert. Der lokal geöffnete Arbeitsstand lädt `bilder/` von der Webseite und `slbild:` über die GitHub-API mit dem SL-Schlüssel (Schaltfläche unten links, Schlüssel nur im Browser). `bilder/` wird von `uebernehmen.py` nur ergänzt, nie bereinigt.

Nach jeder Änderung, die neue Bilder einbettet (z. B. `compendium_bilder.py`), wird ausgelagert:

```
python3 karte/werkzeug/auslagern.py <Arbeitsstand_ein.html> <Arbeitsstand_aus.html> <Spielerkarte.html> seite <scherbenwelt-sl> karte/werkzeug/patch1094.js
```

Die Spielerkarte dient nur zur Einordnung öffentlich/SL (Einträge und Karten, die sie enthält). Der Lauf ist wiederholbar; bereits ausgelagerte Bilder bleiben unverändert. Danach beide Repos committen und pushen, dann Spielerexport und Web-Fassung wie oben. `build.py` kopiert die verwiesenen Dateien aus `bilder/` in den Zielordner und bricht ab, wenn ein `slbild:`-Verweis in der Spielerkarte steht.

## Bilder im Compendium des Arbeitsstands

```
python3 karte/werkzeug/compendium_bilder.py <Arbeitsstand.html> <Bildordner> <Ausgabe.html>
```

Zuordnung über den Dateinamen: `TITEL-<Kürzel>` (Titelbild im Geschichtseintrag der Scherbe), `bau-<…>` (Konzeptzeichnung als erster Block im Gebäudeeintrag, wie bei den Schiffen), `legion-<…>-ausruestung` / `-sondergeraet` (am Anfang des Abschnitts „Ausrüstung“; dort für Spieler geschwärzt bis zur Freigabe im Eintrag), `waffe-<name>` / `modul-<name>` (Konzeptblatt im Geschützkatalog bzw. Modulkatalog, unter der Tabelle des Platzes bzw. der Kategorie, zweispaltig in Katalogreihenfolge; Name wie im Katalog, Umlaute als ae/oe/ue, z. B. `waffe-leichte-balliste`, `modul-aethersegel`). Armadas erhalten keine eigenen Ausrüstungsbilder. Gespeichert wird über den Speicherweg der App; ein erneuter Lauf mit gleichem Dateinamen ersetzt das Bild. Danach `auslagern.py` (siehe oben), dann Spielerexport und Web-Fassung wie oben.


## Anmeldung (Stufe 2a, V10.95)

- `login_bauen.py <webdir/index.html> <Arbeitsstand.html> <gh-pages> <scherbenwelt-sl> [test|live]` – nach jedem Web-Build ausführen.
  - `daten/spieler.bin`: Spieler-Webfassung, gzip + AES-256-GCM. `daten/stand.json`: Stand und Schlüsselkennung.
  - `scherbenwelt-sl/sl/teile/`: SL-Fassung, gzip in Teilen zu 2 MB plus index.json (privat). Teile, weil GitHub API-Abrufe nach etwa 10 s abbricht.
  - `scherbenwelt-sl/zugang/spielerschluessel.txt`: Datenschlüssel; einmal erzeugt, danach wiederverwendet (sonst müssen alle Zugänge neu erzeugt werden).
  - `test`: Hülle nach `test/index.html` (Live-Seite unverändert). `live`: Hülle ersetzt `index.html` – erst nach Freigabe; dann zusätzlich die unverschlüsselte Fassung aus der Git-Geschichte entfernen (Geschichte zusammenfassen).
- `login_huelle.html`: Anmeldeseite. Lädt `zugang/zugaenge.json`, entschlüsselt den Eintrag (PBKDF2-SHA256 600 000, AES-GCM), öffnet Spieler- oder SL-Fassung per document.write mit `<base href>` auf die Seitenwurzel. Abmelden unten rechts.
- `Zugangswerkzeug.html`: lokal im Browser öffnen; erzeugt/ändert `zugaenge.json` je Benutzer (Rolle, Tokens, Repo, Datenschlüssel), prüft Anmeldungen. Datei nach `gh-pages/zugang/` hochladen.

### Ablauf nach jeder Sitzung (ab Umstellung 26.11.2026)

1. `python3 build.py <Spielerkarte.html> <webdir> [Bilderordner]`
2. `python3 pruefen.py <Spielerkarte.html> <webdir>` → „ALLES OK“
3. `python3 uebernehmen.py <webdir> <gh-pages>` (a/, bilder/; index.html bleibt die Login-Hülle)
4. `python3 login_bauen.py <webdir>/index.html <Arbeitsstand.html> <gh-pages> <scherbenwelt-sl> live` (immer nach 3, damit die SL-Fassung nur auf vorhandene a/-Dateien verweist)
5. gh-pages und scherbenwelt-sl committen und pushen.

Backup der Webseite vor der Umstellung: privates Repo scherbenwelt-sl, Zweig `backup-web-vor-login-2026-11-26` (vollständig mit Geschichte).
