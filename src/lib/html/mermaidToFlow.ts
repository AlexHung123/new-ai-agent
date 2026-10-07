export type RewriteMermaidResult = {
  draft: string;
  warnings: string[];
};

type Shape = 'rect' | 'diamond' | 'round' | 'db';

type FlowNode = { label: string; shape: Shape };

type FlowEdge = {
  from: string;
  to: string;
  label: string;
  dashed: boolean;
};

const DIR_MAP: Record<string, string> = {
  TD: 'TB',
  TB: 'TB',
  BT: 'BT',
  LR: 'LR',
  RL: 'RL',
};

const FENCE_RE = /```mermaid[^\n]*\r?\n([\s\S]*?)```/g;

export function mermaidFlowchartToFlow(source: string): string | null {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length && !stripComment(lines[i]).trim()) i += 1;
  if (i >= lines.length) return null;

  const header = stripComment(lines[i]).trim().match(
    /^(flowchart|graph)(?:\s+(TD|TB|BT|LR|RL))?\s*$/i,
  );
  if (!header) return null;
  const dir = DIR_MAP[(header[2] || 'TB').toUpperCase()] ?? 'TB';
  i += 1;

  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];

  for (; i < lines.length; i += 1) {
    const raw = stripComment(lines[i]).trim();
    if (!raw) continue;
    if (/^subgraph\b/i.test(raw) || /^end$/i.test(raw)) return null;
    if (!parseStatement(raw, nodes, edges)) return null;
  }
  if (!nodes.size) return null;
  return emitFlow(dir, nodes, edges);
}

export function rewriteMermaidFences(draft: string): RewriteMermaidResult {
  const warnings: string[] = [];
  FENCE_RE.lastIndex = 0;
  const next = draft.replace(FENCE_RE, (full, body: string) => {
    const converted = mermaidFlowchartToFlow(body);
    if (converted) return converted;
    warnings.push(
      'Could not convert mermaid fence to flow; left as a code block',
    );
    return full;
  });
  return { draft: next, warnings };
}

function stripComment(line: string): string {
  const cut = line.indexOf('%%');
  return cut === -1 ? line : line.slice(0, cut);
}

function parseStatement(
  line: string,
  nodes: Map<string, FlowNode>,
  edges: FlowEdge[],
): boolean {
  let pos = 0;
  const first = parseNode(line, pos);
  if (!first) return false;
  upsertNode(nodes, first);
  pos = first.end;
  let fromId = first.id;

  while (pos < line.length) {
    const arrow = parseArrow(line, pos);
    if (!arrow) {
      return !line.slice(pos).trim();
    }
    pos = arrow.end;
    const next = parseNode(line, pos);
    if (!next) return false;
    upsertNode(nodes, next);
    edges.push({
      from: fromId,
      to: next.id,
      label: sanitizeLabel(arrow.label),
      dashed: arrow.dashed,
    });
    fromId = next.id;
    pos = next.end;
  }
  return true;
}

function upsertNode(
  nodes: Map<string, FlowNode>,
  parsed: { id: string; label: string; shape: Shape; explicit: boolean },
): void {
  const prev = nodes.get(parsed.id);
  if (!prev) {
    nodes.set(parsed.id, { label: parsed.label, shape: parsed.shape });
    return;
  }
  if (parsed.explicit) {
    nodes.set(parsed.id, { label: parsed.label, shape: parsed.shape });
  }
}

function parseNode(
  line: string,
  start: number,
): { id: string; label: string; shape: Shape; explicit: boolean; end: number } | null {
  const lead = line.slice(start).match(/^\s*/);
  let pos = start + (lead ? lead[0].length : 0);
  const idMatch = line.slice(pos).match(/^([A-Za-z][\w.-]*)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  pos += id.length;
  const shape = parseShape(line, pos);
  if (shape) {
    return {
      id,
      label: sanitizeLabel(shape.label) || id,
      shape: shape.shape,
      explicit: true,
      end: shape.end,
    };
  }
  return {
    id,
    label: id,
    shape: 'rect',
    explicit: false,
    end: pos,
  };
}

function parseShape(
  line: string,
  start: number,
): { label: string; shape: Shape; end: number } | null {
  const lead = line.slice(start).match(/^\s*/);
  const pos = start + (lead ? lead[0].length : 0);
  const rest = line.slice(pos);
  const patterns: Array<{ re: RegExp; shape: Shape }> = [
    { re: /^\[\s*"([^"]*)"\s*\]/, shape: 'rect' },
    { re: /^\[\s*'([^']*)'\s*\]/, shape: 'rect' },
    { re: /^\[\(([^)]*)\)\]/, shape: 'db' },
    { re: /^\(\(([^)]*)\)\)/, shape: 'round' },
    { re: /^\(\[([^\]]*)\]\)/, shape: 'round' },
    { re: /^\{\{([^}]*)\}\}/, shape: 'diamond' },
    { re: /^\{([^}]*)\}/, shape: 'diamond' },
    { re: /^\(([^)]*)\)/, shape: 'round' },
    { re: /^\[([^\]]*)\]/, shape: 'rect' },
  ];
  for (const { re, shape } of patterns) {
    const m = rest.match(re);
    if (m) {
      return { label: m[1], shape, end: pos + m[0].length };
    }
  }
  return null;
}

function parseArrow(
  line: string,
  start: number,
): { label: string; dashed: boolean; end: number } | null {
  const lead = line.slice(start).match(/^\s*/);
  const pos = start + (lead ? lead[0].length : 0);
  const rest = line.slice(pos);
  const patterns: Array<{ re: RegExp; dashed: boolean; label: (m: RegExpMatchArray) => string }> = [
    { re: /^-->\|([^|]+)\|/, dashed: false, label: (m) => m[1] },
    { re: /^-->/, dashed: false, label: () => '' },
    { re: /^--\|([^|]+)\|-->/, dashed: false, label: (m) => m[1] },
    { re: /^--\s*(.*?)\s*-->/, dashed: false, label: (m) => m[1] },
    { re: /^-\.->/, dashed: true, label: () => '' },
    { re: /^==>/, dashed: false, label: () => '' },
    { re: /^---/, dashed: false, label: () => '' },
  ];
  for (const p of patterns) {
    const m = rest.match(p.re);
    if (m) {
      return {
        label: p.label(m).trim(),
        dashed: p.dashed,
        end: pos + m[0].length,
      };
    }
  }
  return null;
}

function sanitizeLabel(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapNode(node: FlowNode): string {
  const label = safeLabel(node.shape, node.label);
  switch (node.shape) {
    case 'diamond':
      return `{${label}}`;
    case 'round':
      return `(${label})`;
    case 'db':
      return `[(${label})]`;
    default:
      return `[${label}]`;
  }
}

function safeLabel(shape: Shape, label: string): string {
  if (shape === 'diamond') return label.replace(/[{}]/g, '');
  if (shape === 'round') return label.replace(/[()]/g, '');
  if (shape === 'db') return label.replace(/[()[\]]/g, '');
  return label.replace(/[\[\]]/g, '');
}

function emitFlow(
  dir: string,
  nodes: Map<string, FlowNode>,
  edges: FlowEdge[],
): string {
  const lines: string[] = [];
  const used = new Set<string>();
  for (const edge of edges) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) continue;
    used.add(edge.from);
    used.add(edge.to);
    const arrow = edge.dashed ? '-->' : '->';
    const label = edge.label ? `: ${edge.label}` : '';
    lines.push(`${wrapNode(from)} ${arrow} ${wrapNode(to)}${label}`);
  }
  for (const [id, node] of nodes) {
    if (!used.has(id)) lines.push(wrapNode(node));
  }
  return `\`\`\`flow ${dir}\n${lines.join('\n')}\n\`\`\``;
}
