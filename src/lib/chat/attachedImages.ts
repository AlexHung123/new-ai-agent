export const MAX_ATTACHED_IMAGES = 10;
export const MAX_ATTACHED_IMAGE_BYTES = 10 * 1024 * 1024;
export const CLIENT_IMAGE_COMPRESSION_THRESHOLD_BYTES = 1024 * 1024;

export type ChatImageAttachment = {
  type: 'image';
  data: string;
  mimeType: string;
};

const IMAGE_FOCUS_MODES = new Set(['agentKnowledge', 'agentWriting', 'agentDocument', 'agentHtml']);

function isBase64DataChar(code: number): boolean {
  return (
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0x30 && code <= 0x39) ||
    code === 0x2b ||
    code === 0x2f
  );
}

export function getBase64DecodedByteLength(data: string): number | null {
  if (!data || data.length % 4 !== 0) return null;
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  const dataEnd = data.length - padding;
  for (let index = 0; index < dataEnd; index += 1) {
    if (!isBase64DataChar(data.charCodeAt(index))) return null;
  }
  for (let index = dataEnd; index < data.length; index += 1) {
    if (data[index] !== '=') return null;
  }
  return (data.length / 4) * 3 - padding;
}

export function isChatImageAttachment(
  value: unknown,
): value is ChatImageAttachment {
  if (!value || typeof value !== 'object') return false;
  const image = value as Partial<ChatImageAttachment>;
  if (image.type !== 'image') return false;
  if (
    typeof image.data !== 'string' ||
    typeof image.mimeType !== 'string' ||
    !image.mimeType.startsWith('image/')
  ) {
    return false;
  }
  const bytes = getBase64DecodedByteLength(image.data);
  return bytes !== null && bytes > 0 && bytes <= MAX_ATTACHED_IMAGE_BYTES;
}

export function acceptsImageAttachments(focusMode: string): boolean {
  return IMAGE_FOCUS_MODES.has(focusMode);
}

export function imagesForFocus(
  focusMode: string,
  images: unknown,
): ChatImageAttachment[] {
  if (!acceptsImageAttachments(focusMode) || !Array.isArray(images)) return [];
  return images.filter(isChatImageAttachment).slice(0, MAX_ATTACHED_IMAGES);
}

export function shouldCompressImageFile(
  file: Pick<File, 'size' | 'type'>,
): boolean {
  return (
    file.size > CLIENT_IMAGE_COMPRESSION_THRESHOLD_BYTES &&
    file.type !== 'image/gif'
  );
}

export function selectImageFiles<T extends { type: string; size: number }>(
  files: T[],
  attachedCount: number,
  pendingCount: number,
): { accepted: T[]; overLimit: boolean; rejectedTypeOrSize: boolean } {
  const remaining = Math.max(
    0,
    MAX_ATTACHED_IMAGES - attachedCount - pendingCount,
  );
  const eligible = files.filter(
    (file) =>
      file.type.startsWith('image/') &&
      file.size > 0 &&
      file.size <= MAX_ATTACHED_IMAGE_BYTES,
  );
  return {
    accepted: eligible.slice(0, remaining),
    overLimit: eligible.length > remaining,
    rejectedTypeOrSize: files.some(
      (file) =>
        !file.type.startsWith('image/') ||
        file.size <= 0 ||
        file.size > MAX_ATTACHED_IMAGE_BYTES,
    ),
  };
}

export function imageReferenceNote(
  focusMode: 'agentHtml' | 'agentWriting' | 'agentKnowledge',
): string {
  if (focusMode === 'agentHtml') {
    return 'The attached images are visual references for this edit. Do not embed their bytes into the HTML.';
  }
  return 'The attached images are visual references for this writing task.';
}

export function promptWithImages(
  text: string,
  images: ChatImageAttachment[] | undefined,
  focusMode: 'agentHtml' | 'agentWriting' | 'agentKnowledge',
): { text: string; images?: ChatImageAttachment[] } {
  if (!images?.length) return { text };
  return {
    text: `${imageReferenceNote(focusMode)}\n\n${text}`,
    images,
  };
}
