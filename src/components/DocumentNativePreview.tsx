'use client';

import dynamic from 'next/dynamic';

const NativeDocumentPreview = dynamic(() => import('./NativeDocumentPreview'), {
  ssr: false,
  loading: () => <p className="document-preview-empty">Loading preview…</p>,
});

export default function DocumentNativePreview({
  file,
  name,
}: {
  file: Blob;
  name: string;
}) {
  return <NativeDocumentPreview file={file} name={name} />;
}
