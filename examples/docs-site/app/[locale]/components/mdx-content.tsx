import React from "react";
import Image, { type StaticImageData } from "next/image";
import { codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";
import type { Locale } from "@/lib/i18n";
import nextraHtml from "../../../public/guides/nextra/html.jpg";
import nextraConfig from "../../../public/guides/nextra/config.jpg";

const guideImages: Record<string, StaticImageData> = {
  "/guides/nextra/html.jpg": nextraHtml,
  "/guides/nextra/config.jpg": nextraConfig,
};

const orderedListItem = /^(\d{1,9})\. (.+)$/;

interface MdxContentProps {
  content: string;
  locale?: Locale;
}

async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang: lang || "text",
    themes: { light: "github-light", dark: "github-dark" },
  });
}

export async function MdxContent({ content, locale = "en" }: MdxContentProps) {
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
        <figure key={j} className="code-frame">
            <div className="code-bar">
              <span>{lang}</span>
              <CopyButton text={block.content} locale={locale} />
            </div>
            <div
              className="code-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
        </figure>,
      );
    } else {
      const line = block.content;
      if (!line.trim()) continue;

      const orderedItem = line.match(orderedListItem);
      const imageMatch = line.match(/^!\[([^\]]+)\]\((\/[^\s)]+)\)$/);
      const guideImage = imageMatch && guideImages[imageMatch[2]];
      if (imageMatch && guideImage) {
        rendered.push(
          <figure key={j} className="my-8">
            <a href={imageMatch[2]}>
              <Image
                src={guideImage}
                alt={imageMatch[1]}
                sizes="(max-width: 768px) 100vw, 768px"
                className="w-full h-auto rounded-lg"
              />
            </a>
            <figcaption className="mt-3 text-sm leading-6 text-text-secondary">
              {imageMatch[1]}
            </figcaption>
          </figure>,
        );
      } else if (line.startsWith("### ")) {
        const text = line.slice(4);
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/(^-|-$)/g, "");
        rendered.push(
          <h3 key={j} id={id}>
            {text}
          </h3>,
        );
      } else if (line.startsWith("## ")) {
        const text = line.slice(3);
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/(^-|-$)/g, "");
        rendered.push(
          <h2 key={j} id={id}>
            {text}
          </h2>,
        );
      } else if (line.startsWith("# ")) {
        // Skip — rendered from page header
      } else if (orderedItem) {
        const start = Number(orderedItem[1]);
        const items = [orderedItem[2]];
        while (j + 1 < blocks.length && blocks[j + 1].type === "text") {
          const next = blocks[j + 1].content;
          const item = next.match(orderedListItem);
          if (item) {
            items.push(item[2]);
          } else if (/^ {2,}\S/.test(next)) {
            items[items.length - 1] += ` ${next.trim()}`;
          } else if (!next.trim() && blocks[j + 2]?.type === "text" &&
                     orderedListItem.test(blocks[j + 2].content)) {
            // A blank line between steps should not reset the list numbering.
          } else {
            break;
          }
          j++;
        }
        rendered.push(
          <ol key={j} start={start === 1 ? undefined : start}>
            {items.map((item, k) => <li key={k}><Inline text={item} /></li>)}
          </ol>,
        );
      } else if (line.startsWith("- ")) {
        const items: string[] = [line.slice(2)];
        while (
          j + 1 < blocks.length &&
          blocks[j + 1].type === "text" &&
          (blocks[j + 1].content.startsWith("- ") || /^ {2,}\S/.test(blocks[j + 1].content))
        ) {
          j++;
          if (blocks[j].content.startsWith("- ")) {
            items.push(blocks[j].content.slice(2));
          } else {
            items[items.length - 1] += ` ${blocks[j].content.trim()}`;
          }
        }
        rendered.push(
          <ul key={j}>
            {items.map((item, k) => (
              <li key={k}>
                <Inline text={item} />
              </li>
            ))}
          </ul>,
        );
      } else if (line.startsWith("> ")) {
        rendered.push(
          <blockquote key={j}>
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
          <div key={j} className="prose-table">
            <table>
              <thead>
                <tr>
                  {headerCells.map((cell, k) => (
                    <th key={k} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>
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
        let paragraph = line;
        while (
          j + 1 < blocks.length &&
          blocks[j + 1].type === "text" &&
          blocks[j + 1].content.trim() &&
          !/^(#{1,3} |[->] |\||!\[)/.test(blocks[j + 1].content) &&
          !orderedListItem.test(blocks[j + 1].content)
        ) {
          j++;
          paragraph += ` ${blocks[j].content.trim()}`;
        }
        rendered.push(
          <p key={j}>
            <Inline text={paragraph} />
          </p>,
        );
      }
    }
  }

  return <div className="prose-custom [overflow-wrap:anywhere] [&_table]:[overflow-wrap:normal]">{rendered}</div>;
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
      parts.push(<strong key={k++}>{first.match[1]}</strong>);
    } else if (first.type === "code") {
      parts.push(
        <code key={k++}>
          {first.match[1]}
        </code>,
      );
    } else if (first.type === "link") {
      parts.push(
        <a key={k++} href={first.match[2]}>
          {first.match[1]}
        </a>,
      );
    }

    remaining = remaining.slice(first.index + first.match[0].length);
  }

  return <>{parts}</>;
}
