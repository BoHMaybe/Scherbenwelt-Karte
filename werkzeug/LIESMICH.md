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

### Stufe 2b (V10.95)

- `app/abfrage.js` (nach `gh-pages/app/`): fragt im geöffneten Atlas `scherbenwelt-sl/steuerung/stand.json` nach Zeitplan ab und zeigt bei neuer Fassung „Neu laden“. Bedingte Abfragen (ETag), im Hintergrund keine Abfrage.
- `scherbenwelt-sl/steuerung/zeitplan.json`: Zeitplan, vom SL auf GitHub bearbeitbar (wird von login_bauen.py nie überschrieben). Wirkt spätestens nach 1 Stunde.
- `scherbenwelt-sl/steuerung/stand.json`: Kennung der aktuellen Spieler- und SL-Fassung (schreibt login_bauen.py).
- Gerätespeicher: Die Anmeldeseite hält die zuletzt geladene Fassung in IndexedDB („scherbenwelt“); neu geladen wird nur bei geänderter Kennung. Abmelden löscht den Gerätespeicher.
- App: `app/manifest.webmanifest`, Symbole in `app/`, `sw.js` (nur für die Installation, ohne Zwischenspeicher).

## V10.95 · Spielerbögen (Stufe 3)

- `apply95.py <v10_94.html> patch1095.js <v10_95.html>`: neuer Hauptreiter „Spielerbögen“ (Unterreiter Schiffe), Schiffsbogen aus Tabellen dorthin verschoben, `delete r.online` in der Spielerdatei.
- Online: Spieler speichern in `BoHMaybe/scherbenwelt-<name>/boegen/schiffe.json` (Token „eigen“), automatisch 15 s nach Änderung bzw. „Jetzt speichern“, beim Verlassen/Ausblenden sofort. Konflikt (anderes Gerät): letzte Speicherung gewinnt.
- SL: Spielerliste aus `scherbenwelt-sl/steuerung/spieler.json` (bearbeitbar); „Online-Stand übernehmen“ schreibt `atlas.online.schiffe` in den Arbeitsstand (nicht in die Spielerdatei).
- `test_online.py`: Ablauf gegen nachgebautes GitHub (Spieler anlegen/speichern/neu laden/löschen, SL bearbeiten mit Konflikt, Übernahme).

## V10.96 · Automatischer Online-Abgleich (Stufe 4)

- `online/apply96.py <v10_95.html> online <v10_96.html>`: Hook (`ops.js` + `hook1096.js`) vor dem Atlas-Programm, `patch1096.js` am Ende, `[data-sw]` beim Speichern entfernt, `online`/`onlineImport` nie in der Spielerdatei.
- SL-Fassung im Web: Änderungen am Atlas werden per Vergleich je Hauptschlüssel erkannt (Ereignisse, `v7Dirty`, `status()`), nach 10 s in `scherbenwelt-sl/online/aenderungen.json` gespeichert (Basis = SHA-1 des Atlas-Datentexts des Masters), 2 min nach der letzten Änderung `online/veroeffentlichen.json` → GitHub-Ablauf `.github/workflows/veroeffentlichen.yml`.
- Ablauf: `werkzeug/online_veroeffentlichen.py` setzt `master/teile` zusammen, wendet die Änderungen an, exportiert (exp.py) und baut (build.py, Bilderordner „-“), schreibt `online/spieler-ops.json` (Unterschied zu `daten/spieler-basis.json.gz`), `steuerung/stand.json` (spieler_v) und `online/status.json`.
- Anmeldeseite: SL lädt `online/aenderungen.json`, Spieler `online/spieler-ops.json` und wenden sie beim Laden an (`window.SW_OPS`).
- Vor jedem Hochladen durch Claude: `online/online_uebernehmen.py <Arbeitsstand> <scherbenwelt-sl> <aus.html>` (Arbeitsstand gewinnt), dann `SW_OPS_UEBERNOMMEN=1 python3 login_bauen.py … live`.
- Tests: `online/test_flow.py` (Phasen sl, spieler, lokal; vorher `online_veroeffentlichen.py` im SL-Ordner ausführen).

## V10.97 · Spielerbögen Heere und Gebäude, Prüfstempel (Stufe 5)

- `online/apply97.py <v10_96.html> online <v10_97.html>`: `patch1097.js`, Besitz `sl7.owner` (CU-A01 → blutaar).
- Spieler-Repo: `boegen/heere.json` (Anträge), `boegen/gebaeude.json`; SL-Repo: `online/freigaben.json` (Stempel-Fingerabdrücke je Bogen, Status der Anträge).
- Spielerdatei: `besitz` (vollständige Heerdaten je Besitzer, beim Export aus dem SL-Stand erzeugt).
- Gebäude: Menge = Grundmenge × fP × cr; Gewinn = Grundgewinn × ((1+K)·f − K), f = fP·cr·tf·rt, K = 0,15 (Fixkostenanteil, für Spieler nicht angezeigt).
- Test: `online/test97.py` (Spieler bernd mit CU-A01/FH-0503 in einer Testkopie, SL genehmigt und stempelt).

## V10.98 · Verschlankung und Ladezeiten

Reihenfolge: `v1098/auslagern98.py <v10_97.html> <A.html> <gh-pages>` → `v1098/oeko98_einbauen.py <A.html> <B.html>` → `v1098/oeko_cache.py <B.html> <Arbeitsstand_v10_98.html>` → Spielerexport (`online/exp.py`) → `build.py` → `pruefen.py` → `uebernehmen.py` → `medien/` nach gh-pages kopieren → `login_bauen.py … live`.
- Punkte 1–2 (`auslagern98.py`): Musik und Krankheitsstudien (≥ 20 KB) nach `gh-pages/medien/<sha1-16>.<ext>`; lokal geöffnet lädt `swMedia()` sie von der Webseite. Journalmedien, Startbild, Legionsbilder bleiben eingebettet.
- Punkt 3: Excel-Bibliothek nur im lokalen Arbeitsstand (build.py und SL-Webfassung entfernen sie; Excel-Import zeigt dort einen Hinweis).
- Punkt 4 (`oeko98.js`, `oeko_cache.py`): Wirtschafts-Startspeicher. Die Lieferkettenrechnung beim Start wird aufgezeichnet und als `atlas-eco` (`data-sw`, beim Speichern/Export entfernt) eingebettet. Verwendung nur bei gleichem Programm, gleichen Daten, gleichen Online-Änderungen, Bit-gleichem Zustand vor jeder Rechnung (ganzer Atlas, Faktoren, Ausgangswerte, Hilfswerte), Chromium mit gleichem Exponential-Prüfwert und nur vor der ersten Bedienung. Das Werkzeug prüft nach dem Einbetten den Gesamtzustand (Atlas + Programmwerte) gegen die Rechnung ohne Speicher; bei Abweichung wird ohne Speicher geschrieben (Rückgabe 2). `login_bauen.py` zeichnet die SL-Webfassung eigens auf (`SW_OEKO=0` schaltet ab).
- Punkt 6 (`lazy98.js`, build.py): Spieler-Webfassung enthält Compendium-Seiten je Eintrag gepackt (`z0:`/`z1:` + Base64(Deflate(JSON))); sie werden beim ersten Lesen von `pages` entpackt. `online_veroeffentlichen.py` vergleicht entpackt (Spieler-Änderungen bleiben inhaltlich). Lokaler Arbeitsstand und SL-Fassung unverändert vollständig.

## V10.99 · Kleine Korrekturen
- `v1099/apply99.py`: Überschrift „Reisejournal“, Reiterleiste auf dem Handy (≤ 560 px, Touch) zweizeilig. Danach `v1098/oeko_cache.py`.

## V11.00 · Würfel und Flüstern (Stufe 6)
- `v1100/apply1100.py <v10_99.html> <aus.html>` baut `patch1100.js` ein (nur Programm), danach `v1098/oeko_cache.py`. Schriften `v1100/fonts/` (SIL OFL 1.1) nach `gh-pages/medien/fonts/`.
- Ablage: offene Würfe `scherbenwelt-tisch/wuerfe/<benutzer>.json`, Würfelstil `scherbenwelt-tisch/stil/<benutzer>.json`, verdeckte Würfe `<Spieler-Repo>/wuerfe/verdeckt.json` bzw. `scherbenwelt-sl/tisch/sl-verdeckt.json`, Flüstern `<Spieler-Repo>/fluestern/spieler.json` (Spieler) und `fluestern/sl.json` (SL); je Benutzer 300 Würfe, Nachrichten 90 Tage.
- Abfrage im Takt von `steuerung/zeitplan.json`, zusätzlich beim Öffnen der Fenster. Spieler schreiben mit dem Token „eigen“ (Zugriff auf eigenes Repo und scherbenwelt-tisch).
- Test: `v1100/t2.py` (nachgebautes GitHub mit Tisch-Repo; Spieler bernd und SL: Würfe offen/verdeckt, Flüstern, Schiffsbogen-Würfel, Würfelstil, 90-Tage-Löschung).
