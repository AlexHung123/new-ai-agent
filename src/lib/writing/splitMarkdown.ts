export function utf8ByteLength(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

function splitByHeadings(markdown: string): string[] {
  const lines = markdown.split('\n');
  const sections: string[] = [];
  let buf: string[] = [];
  const heading = /^#{1,6}\s/;
  for (const line of lines) {
    if (heading.test(line) && buf.length > 0) {
      sections.push(buf.join('\n'));
      buf = [line];
    } else {
      buf.push(line);
    }
  }
  if (buf.length > 0) sections.push(buf.join('\n'));
  return sections;
}

function splitByLines(text: string, maxBytes: number): string[] {
  const lines = text.split('\n');
  const parts: string[] = [];
  let current = '';
  const push = () => {
    if (current) {
      parts.push(current);
      current = '';
    }
  };
  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (utf8ByteLength(candidate) <= maxBytes) {
      current = candidate;
      continue;
    }
    push();
    if (utf8ByteLength(line) <= maxBytes) {
      current = line;
      continue;
    }
    let rest = line;
    while (utf8ByteLength(rest) > maxBytes) {
      let lo = 1;
      let hi = rest.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (utf8ByteLength(rest.slice(0, mid)) <= maxBytes) lo = mid;
        else hi = mid - 1;
      }
      parts.push(rest.slice(0, lo));
      rest = rest.slice(lo);
    }
    current = rest;
  }
  push();
  return parts.filter((p) => p.trim().length > 0);
}

export function splitMarkdownParts(markdown: string, maxBytes: number): string[] {
  const trimmed = markdown.replace(/^\uFEFF/, '');
  if (!trimmed.trim()) return [''];
  if (utf8ByteLength(trimmed) <= maxBytes) return [trimmed];

  const sections = splitByHeadings(trimmed);
  const parts: string[] = [];
  let current = '';
  const flush = () => {
    if (current) {
      parts.push(current);
      current = '';
    }
  };

  for (const section of sections) {
    if (utf8ByteLength(section) > maxBytes) {
      flush();
      parts.push(...splitByLines(section, maxBytes));
      continue;
    }
    const joined = current ? `${current}\n\n${section}` : section;
    if (utf8ByteLength(joined) > maxBytes) {
      flush();
      current = section;
    } else {
      current = joined;
    }
  }
  flush();
  return parts.filter((p) => p.length > 0);
}
