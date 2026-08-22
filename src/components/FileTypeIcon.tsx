'use client';

import { fileKind, fileKindGlyph } from '@/lib/writing/fileKind';

export default function FileTypeIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const kind = fileKind(name);
  return (
    <span
      className={`file-type-icon kind-${kind}${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(7, Math.round(size * 0.42)),
      }}
      title={kind}
      aria-hidden
    >
      {fileKindGlyph(kind)}
    </span>
  );
}
