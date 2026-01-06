# PWA Installation - Fußballregeln Quiz

## Was ist PWA?

PWA (Progressive Web App) ermöglicht es, die Web-App wie eine native App auf dem Smartphone zu installieren und offline zu nutzen.

## Installation auf dem Smartphone

### Android (Chrome/Samsung Internet):

1. Öffnen Sie die HTML-Datei `fußball-quiz.html` in Chrome oder Samsung Internet
2. Tippen Sie auf das Menü (drei Punkte oben rechts)
3. Wählen Sie "Zur Startseite hinzufügen" oder "Zum Startbildschirm hinzufügen"
4. Bestätigen Sie die Installation
5. Die App erscheint jetzt auf Ihrem Startbildschirm

### iOS (Safari):

1. Öffnen Sie die HTML-Datei `fußball-quiz.html` in Safari
2. Tippen Sie auf das Teilen-Symbol (Quadrat mit Pfeil nach oben)
3. Wählen Sie "Zum Home-Bildschirm"
4. Bestätigen Sie die Installation
5. Die App erscheint jetzt auf Ihrem Home-Bildschirm

## Wichtige Dateien

- `fußball-quiz.html` - Hauptdatei der Anwendung
- `manifest.json` - PWA-Manifest (App-Informationen)
- `sw.js` - Service Worker (für Offline-Funktionalität)
- `icon-192.png` - App-Icon 192x192 Pixel
- `icon-512.png` - App-Icon 512x512 Pixel

## Offline-Nutzung

Nach der Installation funktioniert die App auch offline, da alle notwendigen Dateien im Cache gespeichert werden.

## Hinweise

- Für die Installation muss die HTML-Datei über einen Webserver geöffnet werden (nicht direkt als Datei)
- Auf dem lokalen Computer können Sie einen einfachen Webserver starten:
  - Python: `python3 -m http.server 8000`
  - Node.js: `npx http-server`
- Dann öffnen Sie `http://localhost:8000/fußball-quiz.html` im Browser

## Troubleshooting

- Falls die Installation nicht funktioniert, stellen Sie sicher, dass alle Dateien im selben Ordner sind
- Service Worker funktioniert nur über HTTPS oder localhost
- Bei Problemen: Browser-Cache leeren und Seite neu laden

