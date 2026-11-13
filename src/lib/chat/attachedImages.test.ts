import { describe, expect, it } from 'vitest';
import {
  MAX_ATTACHED_IMAGE_BYTES,
  MAX_ATTACHED_IMAGES,
  imageReferenceNote,
  imagesForFocus,
  isChatImageAttachment,
  promptWithImages,
  selectImageFiles,
  shouldCompressImageFile,
} from './attachedImages';

function image(bytes: number, mimeType = 'image/png') {
  const groups = Math.floor(bytes / 3);
  const remainder = bytes % 3;
  let data = 'A'.repeat(groups * 4);
  if (remainder === 1) data += 'AA==';
  if (remainder === 2) data += 'AAA=';
  return { type: 'image' as const, data, mimeType };
}

describe('chat image attachments', () => {
  it('accepts up to 10 images of 10 MB on Agent Writing and Agent HTML', () => {
    const images = Array.from({ length: MAX_ATTACHED_IMAGES }, () =>
      image(32, 'image/jpeg'),
    );
    expect(isChatImageAttachment(images[0])).toBe(true);
    expect(imagesForFocus('agentWriting', images)).toHaveLength(10);
    expect(imagesForFocus('agentHtml', images)).toHaveLength(10);
  });

  it('drops images for every other focus mode', () => {
    expect(imagesForFocus('agentSFC', [image(32)])).toEqual([]);
    expect(imagesForFocus('agentDocument', [image(32)])).toEqual([]);
  });

  it('rejects a non-image, invalid base64, and a file over 10 MB', () => {
    expect(isChatImageAttachment({ type: 'image', data: 'AAAA', mimeType: 'text/plain' })).toBe(false);
    expect(isChatImageAttachment({ type: 'image', data: '****', mimeType: 'image/png' })).toBe(false);
    expect(isChatImageAttachment(image(MAX_ATTACHED_IMAGE_BYTES + 1))).toBe(false);
    expect(isChatImageAttachment(image(MAX_ATTACHED_IMAGE_BYTES))).toBe(true);
  });

  it('keeps at most the remaining image slots and reports what was dropped', () => {
    const files = [
      { type: 'image/png', size: 100 },
      { type: 'application/pdf', size: 100 },
      { type: 'image/gif', size: MAX_ATTACHED_IMAGE_BYTES + 1 },
      { type: 'image/jpeg', size: 200 },
    ];
    const selected = selectImageFiles(files, MAX_ATTACHED_IMAGES - 1, 0);
    expect(selected.accepted).toEqual([files[0]]);
    expect(selected.overLimit).toBe(true);
    expect(selected.rejectedTypeOrSize).toBe(true);
  });

  it('compresses a non-GIF over 1 MB', () => {
    expect(shouldCompressImageFile({ size: 1024 * 1024 + 1, type: 'image/png' })).toBe(true);
    expect(shouldCompressImageFile({ size: 1024 * 1024 + 1, type: 'image/gif' })).toBe(false);
    expect(shouldCompressImageFile({ size: 1024, type: 'image/png' })).toBe(false);
  });

  it('adds a visual-reference note only when images are attached', () => {
    expect(promptWithImages('edit this', [], 'agentHtml')).toEqual({
      text: 'edit this',
    });
    expect(promptWithImages('edit this', [image(12)], 'agentHtml')).toEqual({
      text: `${imageReferenceNote('agentHtml')}\n\nedit this`,
      images: [image(12)],
    });
    expect(imageReferenceNote('agentHtml')).toMatch(/visual reference/i);
    expect(imageReferenceNote('agentHtml')).toMatch(/do not embed/i);
    expect(promptWithImages('draft this', [image(12, 'image/webp')], 'agentWriting').text).toContain(
      imageReferenceNote('agentWriting'),
    );
  });
});
