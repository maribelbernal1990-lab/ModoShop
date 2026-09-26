# ModoShop Venezuela · Theme 3.0

The storefront keeps the existing visual design but uses a Shopify-inspired separation of concerns:

- `theme/templates/` — route documents.
- `theme/assets/css/` — reusable page styles.
- `theme/assets/js/` — cached browser modules.
- `theme/data/` — safe public fallback catalog.
- `theme/config/` — theme/runtime configuration.
- `theme/sections/`, `theme/snippets/`, `theme/layout/` — extension points for reusable sections and layout fragments.
- `netlify/functions/` — server-side catalog, admin, orders, reviews and rate endpoints.
- `scripts/build-site.mjs` — deterministic build into `dist/`.

Public routes are human-readable: `/`, `/products/:id`, `/cart`, `/track/:id`, `/admin.html`.

Product images are restricted to the original product photos. Public images use the Netlify Image CDN and long-lived asset caching; cart/customer state remains browser-local.
