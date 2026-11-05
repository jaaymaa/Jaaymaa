import type { CSSProperties, ReactNode } from "react";

type FormattedDescriptionProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
};

type InlineNode =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "strong" | "em" | "strike" | "link"; children: InlineNode[]; href?: string };

type DescriptionBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; lines: string[] };

function isEscaped(text: string, index: number) {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}

function findClosing(text: string, delimiter: string, from: number) {
  let cursor = from;
  while (cursor < text.length) {
    const found = text.indexOf(delimiter, cursor);
    if (found === -1) return -1;
    if (!isEscaped(text, found)) return found;
    cursor = found + delimiter.length;
  }
  return -1;
}

function safeDescriptionHref(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    if (url.protocol === "mailto:") return value;
  } catch {
    return null;
  }
  return null;
}

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let plain = "";
  let index = 0;
  const flushPlain = () => {
    if (plain) nodes.push({ type: "text", text: plain });
    plain = "";
  };

  while (index < text.length) {
    if (text[index] === "\\" && index + 1 < text.length && "\\*_~`[]#>".includes(text[index + 1])) {
      plain += text[index + 1];
      index += 2;
      continue;
    }

    if (text[index] === "[") {
      const labelEnd = findClosing(text, "](", index + 1);
      if (labelEnd !== -1) {
        const urlEnd = findClosing(text, ")", labelEnd + 2);
        if (urlEnd !== -1) {
          const href = safeDescriptionHref(text.slice(labelEnd + 2, urlEnd));
          if (href) {
            flushPlain();
            nodes.push({ type: "link", href, children: parseInline(text.slice(index + 1, labelEnd)) });
            index = urlEnd + 1;
            continue;
          }
        }
      }
    }

    const delimiterOptions: Array<{ marker: string; type: "strong" | "em" | "strike" | "code" }> = [
      { marker: "**", type: "strong" },
      { marker: "~~", type: "strike" },
      { marker: "*", type: "em" },
      { marker: "_", type: "em" },
      { marker: "`", type: "code" },
    ];
    const delimiter = delimiterOptions.find((option) =>
      text.startsWith(option.marker, index) && !isEscaped(text, index)
    );
    if (delimiter) {
      const close = findClosing(text, delimiter.marker, index + delimiter.marker.length);
      if (close > index + delimiter.marker.length) {
        const content = text.slice(index + delimiter.marker.length, close);
        flushPlain();
        if (delimiter.type === "code") nodes.push({ type: "code", text: content });
        else nodes.push({ type: delimiter.type, children: parseInline(content) });
        index = close + delimiter.marker.length;
        continue;
      }
    }

    plain += text[index];
    index += 1;
  }

  flushPlain();
  return nodes;
}

function getListKind(line: string): boolean | null {
  const normalized = line.trimStart();
  if (/^\d+\.\s+/.test(normalized)) return true;
  if (/^[-*+]\s+/.test(normalized)) return false;
  return null;
}

function parseBlocks(text: string): DescriptionBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: DescriptionBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    const listKind = getListKind(line);
    if (listKind !== null) {
      const items: string[] = [];
      while (index < lines.length && getListKind(lines[index]) === listKind) {
        const normalizedLine = lines[index].trimStart();
        items.push(normalizedLine.replace(listKind ? /^\d+\.\s+/ : /^[-*+]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", ordered: listKind, items });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      getListKind(lines[index]) === null &&
      !/^>\s?/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }
  return blocks;
}

function renderInlineNodes(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "text") return node.text;
    if (node.type === "code") return <code key={index} className="rounded bg-black/5 px-1 py-0.5 text-[0.92em]">{node.text}</code>;
    const children = renderInlineNodes(node.children);
    if (node.type === "strong") return <strong key={index}>{children}</strong>;
    if (node.type === "em") return <em key={index}>{children}</em>;
    if (node.type === "strike") return <s key={index}>{children}</s>;
    return <a key={index} href={node.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">{children}</a>;
  });
}

function renderInline(text: string) {
  return renderInlineNodes(parseInline(text));
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderInlineHtml(nodes: InlineNode[]): string {
  return nodes.map((node) => {
    if (node.type === "text" || node.type === "code") {
      const text = escapeHtml(node.text);
      return node.type === "code" ? `<code>${text}</code>` : text;
    }
    const inner = renderInlineHtml(node.children);
    if (node.type === "strong") return `<strong>${inner}</strong>`;
    if (node.type === "em") return `<em>${inner}</em>`;
    if (node.type === "strike") return `<s>${inner}</s>`;
    return `<a href="${escapeHtml(node.href ?? "")}">${inner}</a>`;
  }).join("");
}

/** Converts supported Markdown into a restricted, escaped HTML fragment for the visual editor. */
export function markdownToSafeEditorHtml(text: string) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return "<p><br></p>";
  return blocks.map((block) => {
    if (block.type === "heading") {
      const tag = block.level === 1 ? "h2" : "h3";
      return `<${tag}>${renderInlineHtml(parseInline(block.text))}</${tag}>`;
    }
    if (block.type === "list") {
      const tag = block.ordered ? "ol" : "ul";
      return `<${tag}>${block.items.map((item) => `<li>${renderInlineHtml(parseInline(item))}</li>`).join("")}</${tag}>`;
    }
    if (block.type === "quote") {
      return `<blockquote><p>${block.lines.map((line) => renderInlineHtml(parseInline(line))).join("<br>")}</p></blockquote>`;
    }
    return `<p>${block.lines.map((line) => renderInlineHtml(parseInline(line))).join("<br>")}</p>`;
  }).join("");
}

export default function FormattedDescription({ text, className, style }: FormattedDescriptionProps) {
  const blocks = parseBlocks(text);

  return (
    <div className={className} style={style}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = block.level === 1 ? "h2" : "h3";
          return <Tag key={index} className={`mt-4 first:mt-0 font-bricolage font-black leading-snug text-ink ${block.level === 1 ? "text-base" : "text-sm"}`}>{renderInline(block.text)}</Tag>;
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return <List key={index} className={`mt-2 first:mt-0 space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>{block.items.map((item, itemIndex) => <li key={itemIndex} className="pl-0.5">{renderInline(item)}</li>)}</List>;
        }
        if (block.type === "quote") {
          return <blockquote key={index} className="mt-3 first:mt-0 border-l-2 border-[#C8265A]/50 pl-3 italic">{block.lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{renderInline(line)}</span>)}</blockquote>;
        }
        return <p key={index} className="mt-2 first:mt-0">{block.lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{renderInline(line)}</span>)}</p>;
      })}
    </div>
  );
}
