# E-commerce example (R-09)

Minimal **Capability + Knowledge** demo without a full Next.js UI.

## Actions

- `search_products` — keyword search over a static catalog
- `get_product_page` — read product MDX from `content/products/`

## Try it

```bash
cd examples/ecommerce
pnpm install
pnpm exec next-ai-ready build
pnpm exec next-ai-ready doctor --score
```

Product pages compile into the semantic graph; actions appear in `public/openapi.json`.
