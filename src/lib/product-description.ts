/** Counts what a reader sees, without the formatting syntax stored with descriptions. */
export function getProductDescriptionCharacterCount(markdown: string): number {
  const visibleText = markdown
    .replace(/\\([\\*_~`\[\]#>])/g, "$1")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, "$1")
    .replace(/^\s*(?:#{1,3}\s+|>\s?|[-*+]\s+|\d+\.\s+)/gm, "")
    .replace(/\*\*|~~|`|\*|_/g, "");
  return visibleText.length;
}
