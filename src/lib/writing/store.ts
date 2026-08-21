import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { convertAttachment } from './convert';
import {
  attachmentSlug,
  writingManifestAbs,
  writingOwnerRoot,
  writingRawAbs,
  writingWorkspaceAbs,
} from './paths';
import { splitMarkdownParts } from './splitMarkdown';
import {
  MAX_WRITING_FILES,
  MAX_WRITING_PART_BYTES,
  type WritingAttachment,
} from './types';

export class WritingAttachmentError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'WritingAttachmentError';
  }
}

type Manifest = {
  files: WritingAttachment[];
};

function readManifest(userId: string): Manifest {
  const abs = writingManifestAbs(userId);
  if (!existsSync(abs)) return { files: [] };
  try {
    const parsed = JSON.parse(readFileSync(abs, 'utf8')) as Manifest;
    if (!Array.isArray(parsed?.files)) return { files: [] };
    return {
      files: parsed.files.filter((f) => f && typeof f.fileId === 'string'),
    };
  } catch {
    return { files: [] };
  }
}

function writeManifest(userId: string, manifest: Manifest) {
  const abs = writingManifestAbs(userId);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(manifest, null, 2), 'utf8');
}

function partName(index: number, total: number): string {
  const width = total >= 100 ? 3 : 2;
  return `part-${String(index).padStart(width, '0')}.md`;
}

export function writeWorkspaceIndex(
  userId: string,
  files: WritingAttachment[],
) {
  const workspace = writingWorkspaceAbs(userId);
  mkdirSync(workspace, { recursive: true });
  const ready = files.filter((f) => f.status === 'ready' && f.relDir);
  const lines = ['# Attachments', ''];
  if (ready.length === 0) {
    lines.push(
      'No files uploaded for this user.',
      'Do not use fs_* tools. Write from the user request only.',
      '',
    );
  } else {
    lines.push(
      'Converted Markdown for files this user uploaded (personal library).',
      'Original office files are not in this folder.',
      'Use fs_ls, fs_read, fs_grep, and fs_find. Prefer fs_grep to locate a section, then fs_read that part.',
      'If the user @-mentioned files, read those first.',
      'Do not invent text that is not in these files.',
      '',
      '## Files',
      '',
    );
    for (const file of ready) {
      const partsLabel = file.parts === 1 ? '1 part' : `${file.parts} parts`;
      lines.push(
        `- \`${file.relDir}/INDEX.md\` — ${file.name} (${partsLabel}, ${file.charCount} characters)`,
      );
    }
    lines.push('');
  }
  writeFileSync(join(workspace, 'INDEX.md'), lines.join('\n'), 'utf8');
}

function writeAttachmentIndex(
  userId: string,
  item: WritingAttachment,
  partFiles: string[],
) {
  const dir = join(writingWorkspaceAbs(userId), item.relDir);
  mkdirSync(dir, { recursive: true });
  const lines = [
    `# ${item.name}`,
    '',
    `- Original name: ${item.name}`,
    `- Format: ${item.format}`,
    `- Characters: ${item.charCount}`,
    `- Parts: ${item.parts}`,
    '',
    'Read with fs_read. Prefer fs_grep to find a section, then read that part.',
    '',
  ];
  for (const name of partFiles) {
    lines.push(`- ${name}`);
  }
  lines.push('');
  writeFileSync(join(dir, 'INDEX.md'), lines.join('\n'), 'utf8');
}

export function listWritingAttachments(userId: string): WritingAttachment[] {
  return readManifest(userId).files;
}

export function ensureWritingWorkspace(
  userId: string,
  files?: WritingAttachment[],
): string {
  const workspace = writingWorkspaceAbs(userId);
  mkdirSync(workspace, { recursive: true });
  writeWorkspaceIndex(userId, files ?? listWritingAttachments(userId));
  return workspace;
}

export async function addWritingAttachment(opts: {
  userId: string;
  filename: string;
  bytes: Uint8Array;
  mimeType?: string;
  fileId?: string;
  convert?: typeof convertAttachment;
}): Promise<WritingAttachment> {
  const userId = opts.userId.trim();
  if (!userId) {
    throw new WritingAttachmentError('Missing user id');
  }
  const existing = listWritingAttachments(userId);
  if (existing.length >= MAX_WRITING_FILES) {
    throw new WritingAttachmentError(
      `At most ${MAX_WRITING_FILES} files per user.`,
    );
  }

  const fileId = (opts.fileId || randomBytes(8).toString('hex')).replace(
    /[^a-f0-9]/gi,
    '',
  );
  const convert = opts.convert ?? convertAttachment;
  const converted = await convert(opts.bytes, opts.filename);

  const item: WritingAttachment = {
    fileId,
    userId,
    name: opts.filename,
    status: converted.ok ? 'ready' : 'failed',
    relDir: converted.ok ? attachmentSlug(opts.filename, fileId) : '',
    parts: 0,
    charCount: converted.ok ? converted.markdown.length : 0,
    format: converted.ok ? converted.format : '',
    mimeType: opts.mimeType,
    sizeBytes: opts.bytes.byteLength,
    error: converted.ok ? undefined : converted.error,
    createdAt: new Date().toISOString(),
  };

  mkdirSync(dirname(writingRawAbs(userId, fileId, opts.filename)), {
    recursive: true,
  });
  writeFileSync(
    writingRawAbs(userId, fileId, opts.filename),
    Buffer.from(opts.bytes),
  );

  if (converted.ok) {
    const parts = splitMarkdownParts(converted.markdown, MAX_WRITING_PART_BYTES);
    item.parts = Math.max(1, parts.length);
    const dir = join(writingWorkspaceAbs(userId), item.relDir);
    mkdirSync(dir, { recursive: true });
    const partFiles: string[] = [];
    parts.forEach((body, i) => {
      const name = partName(i + 1, parts.length);
      partFiles.push(name);
      const header = `<!-- ${opts.filename} part ${i + 1}/${parts.length} -->\n\n`;
      writeFileSync(join(dir, name), header + body, 'utf8');
    });
    writeAttachmentIndex(userId, item, partFiles);
  }

  const next = { files: [...existing.filter((f) => f.fileId !== fileId), item] };
  writeManifest(userId, next);
  writeWorkspaceIndex(userId, next.files);
  return item;
}

export function removeWritingAttachment(
  userId: string,
  fileId: string,
): boolean {
  const manifest = readManifest(userId);
  const item = manifest.files.find((f) => f.fileId === fileId);
  if (!item) return false;
  const next = { files: manifest.files.filter((f) => f.fileId !== fileId) };
  if (item.relDir) {
    rmSync(join(writingWorkspaceAbs(userId), item.relDir), {
      recursive: true,
      force: true,
    });
  }
  try {
    rmSync(writingRawAbs(userId, fileId, item.name), { force: true });
  } catch {
    /* ignore */
  }
  writeManifest(userId, next);
  writeWorkspaceIndex(userId, next.files);
  return true;
}

export function removeWritingOwnerDir(userId: string) {
  const root = writingOwnerRoot(userId);
  if (!existsSync(root)) return;
  rmSync(root, { recursive: true, force: true });
}
