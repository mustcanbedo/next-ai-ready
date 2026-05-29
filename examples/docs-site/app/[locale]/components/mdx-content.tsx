import React from "react";
import { codeToHtml } from "shiki";

interface MdxContentProps {
  content: string;
}

async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang: lang || "text",
    theme: "vitesse-dark",
  });
}

export async function MdxContent({ content }: MdxContentProps) {
  const lines = content.trim().split("\n");
  const blocks: { type: string; content: string; lang?: string }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", content: codeLines.join("\n"), lang });
    } else {
      blocks.push({ type: "text", content: line });
      i++;
    }
  }

  const rendered: React.ReactNode[] = [];

  for (let j = 0; j < blocks.length; j++) {
    const block = blocks[j];
    if (block.type === "code") {
      const lang = block.lang || "text";
      const html = await highlight(block.content, lang);
      rendered.push(
        <figure key={j} className="my-8 group">
          <div className="rounded-2xl bg-[#121212] ring-1 ring-white/[0.08] overflow-hidden shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 px-4 h-10 border-b border-white/[0.04]">
              <div className="flex gap-1.5 mr-3">
                <span className="h-3 w-3 rounded-full bg-white/[0.08]" />
                <span className="h-3 w-3 rounded-full bg-white/[0.08]" />
                <span className="h-3 w-3 rounded-full bg-white/[0.08]" />
              </div>
              <span className="text-[11px] font-mono text-white/30 tracking-wide">{lang}</span>
            </div>
            <div
              className="overflow-x-auto px-5 py-4 text-[13.5px] leading-7 [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!text-[13.5px] [&_code]:!leading-7"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </figure>,
      );
    } else {
      const line = block.content;
      if (!line.trim()) continue;

      if (line.startsWith("### ")) {
        rendered.push(
          <h3 key={j} className="text-[17px] font-semibold mt-12 mb-4 text-text tracking-tight">
            {line.slice(4)}
          </h3>,
        );
      } else if (line.startsWith("## ")) {
        rendered.push(
          <h2 key={j} className="group text-2xl font-semibold tracking-tight mt-16 mb-5 pt-8 text-text border-t border-border/50 first:border-0 first:pt-0 first:mt-0">
            {line.slice(3)}
          </h2>,
        );
      } else if (line.startsWith("# ")) {
        // Skip — rendered from page header
      } else if (line.startsWith("- ")) {
        const items: string[] = [line.slice(2)];
        while (
          j + 1 < blocks.length &&
          blocks[j + 1].type === "text" &&
          blocks[j + 1].content.startsWith("- ")
        ) {
          j++;
          items.push(blocks[j].content.slice(2));
        }
        rendered.push(
          <ul key={j} className="my-6 space-y-3">
            {items.map((item, k) => (
              <li key={k} className="flex gap-3 text-[15px] leading-7 text-text-secondary">
                <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                <span><Inline text={item} /></span>
              </li>
            ))}
          </ul>,
        );
      } else if (line.startsWith("> ")) {
        rendered.push(
          <blockquote key={j} className="my-8 rounded-xl bg-accent/[0.04] border border-accent/10 px-5 py-4 text-[15px] text-text-secondary leading-7">
            <Inline text={line.slice(2)} />
          </blockquote>,
        );
      } else if (line.startsWith("|")) {
        const tableLines: string[] = [line];
        while (
          j + 1 < blocks.length &&
          blocks[j + 1].type === "text" &&
          blocks[j + 1].content.startsWith("|")
        ) {
          j++;
          tableLines.push(blocks[j].content);
        }
        const headerCells = tableLines[0].split("|").filter(Boolean).map((c) => c.trim());
        const bodyRows = tableLines.slice(2).map((row) =>
          row.split("|").filter(Boolean).map((c) => c.trim()),
        );
        rendered.push(
          <div key={j} className="my-8 overflow-x-auto rounded-2xl ring-1 ring-white/[0.08] bg-[#121212]">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {headerCells.map((cell, k) => (
                    <th key={k} className="text-left font-medium text-text px-5 py-3.5">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-white/[0.04] last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-5 py-3 text-text-secondary">
                        <Inline text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      } else {
        rendered.push(
          <p key={j} className="mb-6 text-[16px] text-text-secondary leading-[1.85]">
            <Inline text={line} />
          </p>,
        );
      }
    }
  }

  return <div className="prose-custom">{rendered}</div>;
}

function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    const bold = remaining.match(/\*\*(.+?)\*\*/);
    const code = remaining.match(/`(.+?)`/);
    const link = remaining.match(/\[(.+?)\]\((.+?)\)/);

    const matches = [
      bold && { type: "bold", index: bold.index!, match: bold },
      code && { type: "code", index: code.index!, match: code },
      link && { type: "link", index: link.index!, match: link },
    ].filter(Boolean) as { type: string; index: number; match: RegExpMatchArray }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const first = matches[0];

    if (first.index > 0) parts.push(remaining.slice(0, first.index));

    if (first.type === "bold") {
      parts.push(<strong key={k++} className="font-medium text-text">{first.match[1]}</strong>);
    } else if (first.type === "code") {
      parts.push(
        <code key={k++} className="text-[0.9em] font-mono bg-white/[0.06] px-[5px] py-[2px] rounded text-text/90">
          {first.match[1]}
        </code>,
      );
    } else if (first.type === "link") {
      parts.push(
        <a key={k++} href={first.match[2]} className="text-accent underline underline-offset-[3px] decoration-accent/30 hover:decoration-accent transition-colors">
          {first.match[1]}
        </a>,
      );
    }

    remaining = remaining.slice(first.index + first.match[0].length);
  }

  return <>{parts}</>;
}
