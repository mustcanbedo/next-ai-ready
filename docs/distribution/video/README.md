# next-ai-ready distribution video

Remotion source for the first public adoption campaign. The compositions share verified product
facts but use platform-native timing and aspect ratios.

| Composition | Output | Duration |
|---|---|---:|
| `NextAiReady-ZH-Vertical` | Xiaohongshu vertical | 45 s |
| `NextAiReady-EN-Reddit` | Reddit landscape | 60 s |
| `NextAiReady-EN-X` | X landscape | 30 s |

## Preview

```bash
npm install
npm run dev
```

## Render

```bash
npm run render:zh
npm run render:reddit
npm run render:x
```

Rendered files are written to `out/` and intentionally ignored by Git. Check the opening, install,
proof, and CTA frames before publishing. Update the npm version shown in `src/Composition.tsx` only
after that version exists on the public registry.

The research and publishing rules live one directory above in `video-research.zh-CN.md`.
