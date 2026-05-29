import React from "react";
import { codeToHtml } from "shiki";

interface MdxContentProps {
  content: string;
}

async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang: lang || "text",
    theme: "github-dark-default",
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
      const html = await highlight(block.content, block.lang || "text");
      rendered.push(
        <div
          key={j}
          className="my-6 overflow-hidden rounded-xl border border-border"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
    } else {
      const line = block.content;
      if (!line.trim()) continue;

      if (line.startsWith("### ")) {
        rendered.push(
          <h3 key={j} className="text-base font-semibold mt-10 mb-3 text-text">
            {line.slice(4)}
          </h3>,
        );
      } else if (line.startsWith("## ")) {
        rendered.push(
          <h2 key={j} className="text-xl font-semibold tracking-tight mt-14 mb-4 text-text">
            {line.slice(3)}
          </h2>,
        );
      } else if (line.startsWith("# ")) {
        // Skip — rendered from metadata
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
          <ul key={j} className="list-disc pl-6 mb-5 space-y-1.5">
            {items.map((item, k) => (
              <li key={k} className="text-text-secondary text-[15px] leading-7">
                <Inline text={item} />
              </li>
            ))}
          </ul>,
        );
      } else if (line.startsWith("> ")) {
        rendered.push(
          <blockquote key={j} className="border-l-2 border-accent/40 pl-4 text-text-secondary my-5 italic">
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
          <div key={j} className="my-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated/50">
                  {headerCells.map((cell, k) => (
                    <th key={k} className="text-left font-medium text-text-secondary px-4 py-2.5">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-text-secondary">
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
          <p key={j} className="mb-5 text-text-secondary text-[15px] leading-7">
            <Inline text={line} />
          </p>,
        );
      }
    }
  }

  return <div>{rendered}</div>;
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
      parts.push(<strong key={k++} className="font-semibold text-text">{first.match[1]}</strong>);
    } else if (first.type === "code") {
      parts.push(
        <code key={k++} className="text-[13px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded-md text-accent border border-border">
          {first.match[1]}
        </code>,
      );
    } else if (first.type === "link") {
      parts.push(
        <a key={k++} href={first.match[2]} className="text-accent hover:underline">
          {first.match[1]}
        </a>,
      );
    }

    remaining = remaining.slice(first.index + first.match[0].length);
  }

  return <>{parts}</>;
}
