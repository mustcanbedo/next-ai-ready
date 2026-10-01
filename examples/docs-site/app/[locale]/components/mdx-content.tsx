import React from "react";
import Image, { type StaticImageData } from "next/image";
import { codeToHtml } from "shiki";
import nextraHtml from "../../../public/guides/nextra/html.jpg";
import nextraConfig from "../../../public/guides/nextra/config.jpg";

const guideImages: Record<string, StaticImageData> = {
  "/guides/nextra/html.jpg": nextraHtml,
  "/guides/nextra/config.jpg": nextraConfig,
};

const orderedListItem = /^(\d{1,9})\. (.+)$/;

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
          <h3 key={j} id={id} className="text-[17px] font-semibold mt-12 mb-4 text-text tracking-tight scroll-mt-20">
            {text}
          </h3>,
        );
      } else if (line.startsWith("## ")) {
        const text = line.slice(3);
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/(^-|-$)/g, "");
        rendered.push(
          <h2 key={j} id={id} className="group text-2xl font-semibold tracking-tight mt-16 mb-5 pt-8 text-text border-t border-white/[0.04] first:border-0 first:pt-0 first:mt-0 scroll-mt-20">
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
          <ol key={j} start={start === 1 ? undefined : start} className="my-6 list-decimal space-y-3 pl-6 text-[15px] leading-7 text-text-secondary">
            {items.map((item, k) => <li key={k} className="pl-1"><Inline text={item} /></li>)}
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
            <table className="w-full min-w-[480px] text-[14px]">
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
          <p key={j} className="mb-6 text-[16px] text-text-secondary leading-[1.85]">
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
