'use client';

import { useEffect, useState } from 'react';
import FileViewer, { type ViewerOptions } from '@file-viewer/react';
import officePreset from '@file-viewer/preset-office';
import { imageRenderer } from '@file-viewer/renderer-image';
import { setDefaultFileViewerAssetBaseUrl } from '@file-viewer/core/assets';

const ASSET_BASE = '/itms/ai/file-viewer/';

const viewerOptions = {
  preset: officePreset,
  renderers: [imageRenderer],
  rendererMode: 'replace' as const,
  theme: 'light' as const,
  styleIsolation: 'shadow' as const,
  ui: { density: 'compact' as const },
  toolbar: { position: 'bottom-right' as const },
} as unknown as ViewerOptions;

function ensureAssetBase() {
  setDefaultFileViewerAssetBaseUrl(ASSET_BASE);
}

export default function NativeDocumentPreview({
  file,
  name,
}: {
  file: Blob;
  name: string;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureAssetBase();
  }, []);

  useEffect(() => {
    setError(null);
  }, [file, name]);

  return (
    <div className="native-document-preview">
      {error ? (
        <p className="document-preview-empty">{error}</p>
      ) : (
        <FileViewer
          file={file}
          name={name}
          options={viewerOptions}
          onStateChange={(state) => {
            if (!state.error) return;
            const message =
              state.error instanceof Error
                ? state.error.message
                : 'Could not preview this file.';
            setError(message || 'Could not preview this file.');
          }}
        />
      )}
    </div>
  );
}
