export type DocBlock = { content: string } & (
  | { type: "text" }
  | { type: "code"; lang: string }
  | { type: "heading"; id: string; level: 2 | 3 }
);

export function parseDocBlocks(content: string): DocBlock[] {
  const lines = content.trim().split(/\r?\n/);
  const blocks: DocBlock[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      while (++index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
      }
      blocks.push({ type: "code", content: code.join("\n"), lang });
      continue;
    }

    const heading = line.match(/^(#{2,3}) +(.+)$/);
    if (heading) {
      const [, marker, text] = heading;
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/(^-|-$)/g, "");
      blocks.push({ type: "heading", content: text, id, level: marker === "##" ? 2 : 3 });
    } else {
      blocks.push({ type: "text", content: line });
    }
  }

  return blocks;
}
