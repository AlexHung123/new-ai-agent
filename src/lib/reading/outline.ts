export type OutlineEntry = {
  title: string;
  page: number | null;
  items: OutlineEntry[];
};

export function formatOutlineMarkdown(entries: OutlineEntry[]): string {
  if (entries.length === 0) return '';
  const lines = ['# Outline', ''];
  const walk = (nodes: OutlineEntry[], depth: number) => {
    for (const node of nodes) {
      const title = node.title.replace(/\s+/g, ' ').trim() || 'Untitled';
      const cite = node.page != null ? ` — p. ${node.page}` : '';
      lines.push(`${'  '.repeat(depth)}- ${title}${cite}`);
      if (node.items.length > 0) walk(node.items, depth + 1);
    }
  };
  walk(entries, 0);
  lines.push('');
  return lines.join('\n');
}
