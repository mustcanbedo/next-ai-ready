import React from "react";
import { codeToHtml } from "shiki";

interface MdxContentProps {
  content: string;
}

async function highlightCode(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang: lang || "text",
    theme: "github-dark-default",
  });
}

function parseMarkdown(content: string): string[] {
  return content.split("\n");
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
      i++; // skip closing ```
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
      const html = await highlightCode(block.content, block.lang || "text");
      rendered.push(
        <div
          key={j}
          className="my-6 overflow-hidden rounded-lg border border-zinc-800"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
    } else {
      const line = block.content;

      if (!line.trim()) {
        continue;
      }

      if (line.startsWith("### ")) {
        rendered.push(
          <h3 key={j} className="text-base font-semibold mt-8 mb-3 text-text">
            {line.slice(4)}
          </h3>,
        );
      } else if (line.startsWith("## ")) {
        rendered.push(
          <h2
            key={j}
            className="text-xl font-semibold tracking-tight mt-12 mb-4 text-text pb-2 border-b border-border-subtle"
          >
            {line.slice(3)}
          </h2>,
        );
      } else if (line.startsWith("# ")) {
        // Skip h1 — we render it from metadata
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
          <ul key={j} className="list-disc pl-6 mb-4 space-y-1">
            {items.map((item, k) => (
              <li key={k} className="text-text-secondary text-[15px] leading-7">
                <InlineMarkdown text={item} />
              </li>
            ))}
          </ul>,
        );
      } else if (line.startsWith("> ")) {
        rendered.push(
          <blockquote
            key={j}
            className="border-l-2 border-border pl-4 italic text-text-secondary my-4"
          >
            <InlineMarkdown text={line.slice(2)} />
          </blockquote>,
        );
      } else if (line.startsWith("|")) {
        // Simple table parsing
        const tableLines: string[] = [line];
        while (
          j + 1 < blocks.length &&
          blocks[j + 1].type === "text" &&
          blocks[j + 1].content.startsWith("|")
        ) {
          j++;
          tableLines.push(blocks[j].content);
        }
        const headerCells = tableLines[0]
          .split("|")
          .filter(Boolean)
          .map((c) => c.trim());
        const bodyRows = tableLines
          .slice(2)
          .map((row) =>
            row
              .split("|")
              .filter(Boolean)
              .map((c) => c.trim()),
          );
        rendered.push(
          <table key={j} className="w-full text-sm my-6">
            <thead>
              <tr>
                {headerCells.map((cell, k) => (
                  <th
                    key={k}
                    className="text-left font-medium text-text-secondary pb-2 border-b border-border pr-4"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="py-2 border-b border-border-subtle text-text-secondary pr-4"
                    >
                      <InlineMarkdown text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>,
        );
      } else {
        rendered.push(
          <p key={j} className="mb-4 text-text-secondary text-[15px] leading-7">
            <InlineMarkdown text={line} />
          </p>,
        );
      }
    }
  }

  return <div>{rendered}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts: (string | React.ReactNode)[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);
    // Link
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

    const matches = [
      boldMatch && { type: "bold", index: boldMatch.index!, match: boldMatch },
      codeMatch && { type: "code", index: codeMatch.index!, match: codeMatch },
      linkMatch && { type: "link", index: linkMatch.index!, match: linkMatch },
    ].filter(Boolean) as { type: string; index: number; match: RegExpMatchArray }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const first = matches[0];

    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === "bold") {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-text">
          {first.match[1]}
        </strong>,
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "code") {
      parts.push(
        <code
          key={keyIdx++}
          className="text-sm font-mono bg-bg-alt px-1.5 py-0.5 rounded text-text"
        >
          {first.match[1]}
        </code>,
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "link") {
      parts.push(
        <a
          key={keyIdx++}
          href={first.match[2]}
          className="text-text underline decoration-border hover:decoration-text transition-colors"
        >
          {first.match[1]}
        </a>,
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    }
  }

  return <>{parts}</>;
}
