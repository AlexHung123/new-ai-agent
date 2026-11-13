'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  MAX_ATTACHED_IMAGES,
  isChatImageAttachment,
  selectImageFiles,
  shouldCompressImageFile,
  type ChatImageAttachment,
} from '@/lib/chat/attachedImages';

const CLIENT_MAX_IMAGE_SIDE = 1024;
const CLIENT_JPEG_QUALITY = 0.85;

type PreviewImage = ChatImageAttachment & { previewUrl: string };

function revokePreview(image: PreviewImage) {
  if (image.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(image.previewUrl);
  }
}

function readImageFile(
  file: Blob,
  mimeType: string,
): Promise<ChatImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data =
        typeof reader.result === 'string'
          ? reader.result.split(',')[1]
          : undefined;
      if (!data) {
        reject(new Error('Failed to read image'));
        return;
      }
      resolve({ type: 'image', data, mimeType });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file: File): Promise<ChatImageAttachment> {
  const mimeType = file.type || 'image/png';
  const original = () => readImageFile(file, mimeType);
  if (
    !shouldCompressImageFile({
      size: file.size,
      type: mimeType,
    }) ||
    typeof createImageBitmap !== 'function'
  ) {
    return original();
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return original();

  try {
    const scale = Math.min(
      1,
      CLIENT_MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return original();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', CLIENT_JPEG_QUALITY).split(',')[1];
    return data && data.length < Math.ceil(file.size / 3) * 4
      ? { type: 'image', data, mimeType: 'image/jpeg' }
      : original();
  } catch {
    return original();
  } finally {
    bitmap.close();
  }
}

export function useAttachedImages(focusMode: string) {
  const enabled = focusMode === 'agentWriting' || focusMode === 'agentHtml';
  const enabledRef = useRef(enabled);
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const previewsRef = useRef(previews);
  const pendingRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  enabledRef.current = enabled;
  previewsRef.current = previews;

  useEffect(() => {
    if (enabled) return;
    setPreviews((prev) => {
      prev.forEach(revokePreview);
      return [];
    });
  }, [enabled]);

  useEffect(
    () => () => {
      previewsRef.current.forEach(revokePreview);
    },
    [],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!enabled || files.length === 0) return;
      const selected = selectImageFiles(
        files,
        previewsRef.current.length,
        pendingRef.current,
      );
      if (selected.rejectedTypeOrSize) {
        toast.error('Attach an image of 10 MB or smaller.');
      }
      if (selected.overLimit) {
        toast.error(`A message can include at most ${MAX_ATTACHED_IMAGES} images.`);
      }
      if (selected.accepted.length === 0) return;

      pendingRef.current += selected.accepted.length;
      try {
        const loaded = (
          await Promise.all(
            selected.accepted.map(async (file) => {
              const image = await compressImageFile(file).catch(() => null);
              if (!image || !isChatImageAttachment(image)) return null;
              return { ...image, previewUrl: URL.createObjectURL(file) };
            }),
          )
        ).filter((image): image is PreviewImage => image !== null);

        setPreviews((prev) => {
          if (!enabledRef.current) {
            loaded.forEach(revokePreview);
            return [];
          }
          const room = Math.max(0, MAX_ATTACHED_IMAGES - prev.length);
          const accepted = loaded.slice(0, room);
          loaded.slice(room).forEach(revokePreview);
          return [...prev, ...accepted];
        });
      } finally {
        pendingRef.current -= selected.accepted.length;
      }
    },
    [enabled],
  );

  const onPick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      void addFiles(Array.from(list));
    },
    [addFiles],
  );

  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!enabled) return;
      const items = Array.from(event.clipboardData?.items ?? []).filter((item) =>
        item.type.startsWith('image/'),
      );
      if (items.length === 0) return;
      event.preventDefault();
      const files = items.flatMap((item) => {
        const file = item.getAsFile();
        if (!file) return [];
        if (file.type) return [file];
        return [new File([file], file.name || 'image', { type: item.type })];
      });
      void addFiles(files);
    },
    [addFiles, enabled],
  );

  const remove = useCallback((index: number) => {
    setPreviews((prev) => {
      const image = prev[index];
      if (image) revokePreview(image);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }, []);

  const clear = useCallback(() => {
    setPreviews((prev) => {
      prev.forEach(revokePreview);
      return [];
    });
  }, []);

  const payload = useMemo<ChatImageAttachment[]>(
    () =>
      previews.map(({ type, data, mimeType }) => ({ type, data, mimeType })),
    [previews],
  );

  return {
    enabled,
    previews,
    payload,
    fileInputRef,
    onPick,
    onFiles,
    onPaste,
    remove,
    clear,
  };
}

export function ImagePreview({
  src,
  children,
}: {
  src: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="attached-image-open"
        aria-label="Preview image"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="attached-image-dialog"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <button
          type="button"
          className="attached-image-dialog-close"
          aria-label="Close preview"
          onClick={() => setOpen(false)}
        >
          <X size={16} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
      </dialog>
    </>
  );
}

export function AttachedImageStrip({
  images,
}: {
  images: ReturnType<typeof useAttachedImages>;
}) {
  if (!images.enabled || images.previews.length === 0) return null;
  return (
    <div className="composer-images">
      {images.previews.map((image, index) => (
        <div key={image.previewUrl} className="attached-image">
          <ImagePreview src={image.previewUrl}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.previewUrl} alt="" />
          </ImagePreview>
          <button
            type="button"
            className="attached-image-remove"
            aria-label="Remove image"
            onClick={() => images.remove(index)}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function AttachImageControls({
  images,
}: {
  images: ReturnType<typeof useAttachedImages>;
}) {
  if (!images.enabled) return null;
  return (
    <>
      <button
        type="button"
        className={`writing-tool-btn${images.previews.length ? ' is-active' : ''}`}
        aria-label="Attach image"
        title="Attach image"
        onClick={images.onPick}
      >
        <ImageIcon size={16} />
      </button>
      <input
        ref={images.fileInputRef as RefObject<HTMLInputElement>}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          images.onFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </>
  );
}
