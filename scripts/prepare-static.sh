#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${MODOSHOP_ASSETS_BASE_URL:-https://gleaming-brigadeiros-c260a9.netlify.app}"
mkdir -p assets/products assets/flyers

# Keep the existing public pages while the repository-backed deploy becomes the new source.
for page in index.html legal.html producto.html seguimiento.html success.html; do
  curl -fsSL --retry 3 --connect-timeout 10 "$BASE_URL/$page" -o "$page"
done

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
products/bandolero-usb-vista2.jpg
products/bandolero-usb-vista3.jpg
products/bandolero-usb-vista4.jpg
products/bandolero-usb.jpg
products/camara-bombillo-360-vista2.jpg
products/camara-bombillo-360-vista3.jpg
products/camara-bombillo-360-vista4.jpg
products/camara-dual-6mp-vista2.jpg
products/camara-dual-6mp-vista3.jpg
products/camara-dual-6mp-vista4.jpg
products/camara-dual-6mp.jpg
products/licuadora-portatil-vista2.jpg
products/licuadora-portatil-vista3.jpg
products/licuadora-portatil-vista4.jpg
products/licuadora-portatil.jpg
products/masajeador-ficha.jpg
products/masajeador-mini-vista2.jpg
products/masajeador-mini-vista3.jpg
products/masajeador-mini-vista4.jpg
products/masajeador-mini.jpg
products/microfono-v8-vista2.jpg
products/microfono-v8-vista3.jpg
products/microfono-v8-vista4.jpg
products/microfono-v8.jpg
products/plancha-vapor-raf-vista2.jpg
products/plancha-vapor-raf-vista3.jpg
products/plancha-vapor-raf-vista4.jpg
products/plancha-vapor-raf.jpg
products/radios-bf888s-vista2.jpg
products/radios-bf888s-vista3.jpg
products/radios-bf888s-vista4.jpg
products/radios-bf888s.jpg
products/tensiometro-brazalete-vista2.jpg
products/tensiometro-brazalete-vista3.jpg
products/tensiometro-brazalete-vista4.jpg
products/timbre-camara-wifi-vista2.jpg
products/timbre-camara-wifi-vista3.jpg
products/timbre-camara-wifi.jpg
products/timbre-camara-wifi-vista4.jpg
reviews.js
ASSETS

test -s assets/catalog-data.json
test -s assets/products/masajeador-mini.jpg
