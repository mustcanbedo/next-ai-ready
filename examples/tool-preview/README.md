# Tool manifest preview (P6-07)

Open `index.html` in a browser **after** running `next-ai-ready build` in a project with actions.

Serve from your app's `public/` folder or any static server:

```bash
# From a project with public/openapi.json + public/tools.json
cp examples/tool-preview/index.html public/tool-preview.html
pnpm dev
# open http://localhost:3000/tool-preview.html
```

Or open this file directly and paste JSON paths if CORS blocks local file access.
