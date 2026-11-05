"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { markdownToSafeEditorHtml } from "@/components/FormattedDescription";
import { getProductDescriptionCharacterCount } from "@/lib/product-description";

function escapeMarkdownText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([*_~`\[\]#>])/g, "\\$1");
}

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function serializeInline(node: JSONContent): string {
  if (node.type === "hardBreak") return "  \n";
  if (node.type !== "text" || typeof node.text !== "string") return "";

  let content = escapeMarkdownText(node.text);
  let linkHref: string | null = null;
  for (const mark of node.marks ?? []) {
    if (mark.type === "code") content = `\`${node.text.replace(/`/g, "\\`")}\``;
    if (mark.type === "bold") content = `**${content}**`;
    if (mark.type === "italic") content = `*${content}*`;
    if (mark.type === "strike") content = `~~${content}~~`;
    if (mark.type === "link") linkHref = safeHref(mark.attrs?.href);
  }
  return linkHref ? `[${content}](${linkHref.replace(/\)/g, "%29")})` : content;
}

function serializeList(node: JSONContent, depth = 0): string {
  const ordered = node.type === "orderedList";
  let index = 0;
  const items = (node.content ?? []).filter((item) => item.type === "listItem").map((item) => {
    index += 1;
    const lines: string[] = [];
    for (const child of item.content ?? []) {
      if (child.type === "bulletList" || child.type === "orderedList") {
        lines.push(serializeList(child, depth + 1));
      } else {
        const text = serializeBlock(child);
        if (text) lines.push(text);
      }
    }
    const indent = "  ".repeat(depth);
    const marker = ordered ? `${index}. ` : "- ";
    const [first = "", ...rest] = lines;
    return `${indent}${marker}${first}${rest.map((line) => `\n${indent}  ${line}`).join("")}`;
  });
  return items.join("\n");
}

function serializeBlock(node: JSONContent): string {
  const content = (node.content ?? []).map(serializeInline).join("");
  switch (node.type) {
    case "paragraph": return content.trim();
    case "heading": return content.trim() ? `${Number(node.attrs?.level) === 2 ? "##" : "###"} ${content.trim()}` : "";
    case "bulletList":
    case "orderedList": return serializeList(node);
    case "blockquote": {
      const quoted = (node.content ?? []).map(serializeBlock).filter(Boolean).join("\n");
      return quoted.split("\n").map((line) => `> ${line}`).join("\n");
    }
    default: return content.trim();
  }
}

function serializeDescription(document: JSONContent): string {
  return (document.content ?? [])
    .map(serializeBlock)
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const toolbarButtonClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg text-[#43516D] transition hover:bg-[#F0F2F6] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8265A] disabled:cursor-not-allowed disabled:opacity-40";

export default function ProductDescriptionEditor({ initialValue = "" }: { initialValue?: string }) {
  const initialHtml = useMemo(() => markdownToSafeEditorHtml(initialValue), [initialValue]);
  const [value, setValue] = useState(initialValue);
  const [characterCount, setCharacterCount] = useState(() => getProductDescriptionCharacterCount(initialValue));
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkSelection, setLinkSelection] = useState<{ from: number; to: number; text: string } | null>(null);
  const [, setEditorRevision] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        protocols: ["mailto"],
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        isAllowedUri: (url, { defaultValidate }) =>
          defaultValidate(url) && /^(https?:|mailto:)/i.test(url),
      }),
      Placeholder.configure({
        placeholder: "Décrivez le produit, sa matière, sa coupe et ce qui le rend unique…",
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "product-description-prose min-h-[190px] px-5 py-4 outline-none",
        "aria-label": "Description du produit",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = serializeDescription(currentEditor.getJSON());
      setValue(nextValue);
      setCharacterCount(getProductDescriptionCharacterCount(nextValue));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const refresh = () => setEditorRevision((revision) => revision + 1);
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor]);

  function openLinkEditor() {
    if (!editor) return;
    if (editor.state.selection.empty && editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").run();
    }
    const { from, to } = editor.state.selection;
    if (from === to) {
      setLinkError("Sélectionnez un mot ou une expression pour ajouter un lien.");
      return;
    }
    setLinkSelection({ from, to, text: editor.state.doc.textBetween(from, to, " ") });
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setShowLinkEditor(true);
  }

  function saveLink() {
    if (!editor || !linkSelection || !linkUrl.trim()) {
      setLinkError("Saisissez l’adresse du lien.");
      return;
    }
    const rawUrl = linkUrl.trim();
    const candidate = /^(https?:\/\/|mailto:)/i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    if (!safeHref(candidate)) {
      setLinkError("Utilisez un lien web ou une adresse e-mail valide.");
      return;
    }
    editor.chain().focus().setTextSelection({ from: linkSelection.from, to: linkSelection.to }).setLink({ href: candidate }).run();
    setShowLinkEditor(false);
    setLinkSelection(null);
  }

  const activeHeading = editor?.isActive("heading", { level: 2 })
    ? "heading2"
    : editor?.isActive("heading", { level: 3 })
      ? "heading3"
      : "paragraph";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9DDE6] bg-white text-ink shadow-[0_5px_18px_rgba(15,30,61,0.10)] ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0">
          <label className="block text-sm font-extrabold tracking-[-0.01em] text-[#182746]">Description du produit</label>
          <p className="mt-0.5 text-xs text-[#748097]">Présentez clairement les détails et les avantages de votre article.</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#F1F7F4] px-2.5 py-1 text-[10px] font-bold text-[#23725F] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3D9D7E]" /> Texte enrichi
        </span>
      </div>

      <div className="mx-3 overflow-hidden rounded-xl border border-[#E0E4EB] sm:mx-4">
        <div role="toolbar" aria-label="Mise en forme de la description" className="flex flex-wrap items-center gap-1 border-b border-[#E0E4EB] bg-[#F8F9FB] p-2">
          <select
            aria-label="Style de paragraphe"
            value={activeHeading}
            disabled={!editor}
            onChange={(event) => {
              if (!editor) return;
              if (event.target.value === "paragraph") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: event.target.value === "heading2" ? 2 : 3 }).run();
            }}
            className="mr-1 h-9 min-w-28 rounded-lg border border-[#E0E4EB] bg-white px-2.5 text-xs font-semibold text-[#43516D] outline-none focus:border-[#7785A0]"
          >
            <option value="paragraph">Paragraphe</option>
            <option value="heading2">Titre</option>
            <option value="heading3">Sous-titre</option>
          </select>
          <div className="mx-1 hidden h-6 w-px bg-[#DDE1E8] sm:block" />
          <ToolbarButton label="Gras" active={Boolean(editor?.isActive("bold"))} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={17} /></ToolbarButton>
          <ToolbarButton label="Italique" active={Boolean(editor?.isActive("italic"))} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={17} /></ToolbarButton>
          <ToolbarButton label="Barré" active={Boolean(editor?.isActive("strike"))} disabled={!editor} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></ToolbarButton>
          <div className="mx-1 hidden h-6 w-px bg-[#DDE1E8] sm:block" />
          <ToolbarButton label="Liste à puces" active={Boolean(editor?.isActive("bulletList"))} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={17} /></ToolbarButton>
          <ToolbarButton label="Liste numérotée" active={Boolean(editor?.isActive("orderedList"))} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></ToolbarButton>
          <ToolbarButton label="Citation" active={Boolean(editor?.isActive("blockquote"))} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolbarButton>
          <ToolbarButton label="Lien" active={Boolean(editor?.isActive("link"))} disabled={!editor} onClick={openLinkEditor}><Link2 size={16} /></ToolbarButton>
          {editor?.isActive("link") && <ToolbarButton label="Retirer le lien" disabled={!editor} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink size={16} /></ToolbarButton>}
          <div className="ml-auto flex items-center border-l border-[#DDE1E8] pl-1">
            <ToolbarButton label="Annuler" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={16} /></ToolbarButton>
            <ToolbarButton label="Rétablir" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={16} /></ToolbarButton>
          </div>
        </div>

        {showLinkEditor && (
          <div className="flex flex-col gap-2 border-b border-[#E0E4EB] bg-white p-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-[11px] font-bold text-[#53617B]">
              Adresse du lien{linkSelection?.text ? <span className="font-medium text-[#8490A4]"> · {linkSelection.text}</span> : null}
              <input
                autoFocus
                type="text"
                inputMode="url"
                value={linkUrl}
                onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveLink(); } }}
                placeholder="https://exemple.com"
                className="mt-1 block h-10 w-full rounded-lg border border-[#DDE1E8] bg-[#FCFCFD] px-3 text-sm font-medium text-ink outline-none focus:border-[#8793A9]"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={saveLink} className="h-10 rounded-lg bg-[#142343] px-3.5 text-xs font-bold text-white transition hover:bg-[#20365F]">Appliquer</button>
              <button type="button" onClick={() => { setShowLinkEditor(false); setLinkError(""); }} className="h-10 rounded-lg border border-[#DDE1E8] px-3 text-xs font-semibold text-[#596680] hover:bg-[#F8F9FB]">Annuler</button>
            </div>
          </div>
        )}
        {linkError && <p role="alert" className="border-b border-[#E0E4EB] bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{linkError}</p>}

        <div className="bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-[#7D879B] sm:px-5">
        <p>Collez du texte ou utilisez les outils pour structurer votre description.</p>
        <span className={`font-semibold tabular-nums ${characterCount > 3000 ? "text-rose-600" : "text-[#68758D]"}`}>{characterCount.toLocaleString("fr-FR")} / 3 000</span>
      </div>
      <input type="hidden" name="description" value={value} readOnly />

      <style jsx global>{`
        .product-description-prose {
          color: #273756;
          font-size: 14px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }
        @media (max-width: 640px) {
          .product-description-prose { font-size: 16px; }
        }
        .product-description-prose p { margin: 0.55rem 0; }
        .product-description-prose p:first-child { margin-top: 0; }
        .product-description-prose p:last-child { margin-bottom: 0; }
        .product-description-prose h2,
        .product-description-prose h3 {
          color: #142343;
          font-weight: 800;
          line-height: 1.4;
          margin: 1rem 0 0.35rem;
        }
        .product-description-prose h2 { font-size: 1.05rem; }
        .product-description-prose h3 { font-size: 0.94rem; }
        .product-description-prose ul,
        .product-description-prose ol { margin: 0.65rem 0; padding-left: 1.45rem; }
        .product-description-prose ul { list-style: disc; }
        .product-description-prose ol { list-style: decimal; }
        .product-description-prose li { padding-left: 0.2rem; }
        .product-description-prose li + li { margin-top: 0.25rem; }
        .product-description-prose blockquote {
          margin: 0.8rem 0;
          border-left: 3px solid #e9b2c2;
          padding-left: 0.85rem;
          color: #596780;
        }
        .product-description-prose a { color: #2856a8; text-decoration: underline; text-underline-offset: 2px; }
        .product-description-prose code { border-radius: 0.3rem; background: #f1f3f6; padding: 0.1rem 0.3rem; font-size: 0.9em; }
        .product-description-prose p.is-editor-empty:first-child::before {
          color: #a0a8b7;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .product-description-prose:focus { outline: none; }
      `}</style>
    </section>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  children,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`${toolbarButtonClass} ${active ? "bg-[#E9ECF2] text-[#142343] shadow-inner" : ""}`}
    >
      {children}
    </button>
  );
}
