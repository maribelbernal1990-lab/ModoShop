#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${MODOSHOP_ASSETS_BASE_URL:-https://gleaming-brigadeiros-c260a9.netlify.app}"
mkdir -p assets/products assets/flyers

# Static HTML/JS pages live in GitHub. Only legacy binary/media assets are hydrated
# from the current production site so the repository does not need to store large files.
while IFS= read -r path; do
  [ -z "$path" ] && continue
  mkdir -p "assets/$(dirname "$path")"
  curl -fsSL --retry 3 --connect-timeout 10 "$BASE_URL/assets/$path" -o "assets/$path"
done <<'ASSETS'
auriculares.png
camara.png
catalog-client.js
catalog-data.json
catalog.js
flyers/blend-flyer.jpg
flyers/bp-flyer.jpg
flyers/bulb-flyer.jpg
flyers/door-flyer.jpg
flyers/dual-flyer.jpg
flyers/mas-flyer.jpg
flyers/mic-flyer.jpg
flyers/radio-flyer.jpg
flyers/sling-flyer.jpg
flyers/steam-flyer.jpg
hero-family.png
hero-tech.png
licuadora.png
logo.png
product-page.js
products/bandolero-usb.jpg
products/camara-dual-6mp.jpg
products/licuadora-portatil.jpg
products/masajeador-mini.jpg
products/microfono-v8.jpg
products/plancha-vapor-raf.jpg
products/radios-bf888s.jpg
products/timbre-camara-wifi.jpg
reviews.js
ASSETS

test -s assets/catalog-data.json
test -s assets/products/masajeador-mini.jpg
