'use client';

import { Loader2 } from 'lucide-react';

export default function KnowledgeLoading() {
  return (
    <div
      className="knowledge-manager knowledge-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="knowledge-detail-layout">
        <aside className="knowledge-detail-rail">
          <div className="knowledge-tree-item">Folders</div>
          <div className="knowledge-loading-skel-list">
            <div className="knowledge-skeleton knowledge-skeleton-line" />
            <div className="knowledge-skeleton knowledge-skeleton-line is-indent" />
            <div className="knowledge-skeleton knowledge-skeleton-line" />
            <div className="knowledge-skeleton knowledge-skeleton-line" />
            <div className="knowledge-skeleton knowledge-skeleton-line" />
          </div>
        </aside>
        <section className="knowledge-files-panel">
          <div className="knowledge-files-header">
            <div>
              <h2 className="knowledge-files-title">Files</h2>
              <p className="knowledge-files-subtitle">
                Browse folders in the tree. Drop files here or use Add file.
              </p>
            </div>
          </div>
          <div className="knowledge-skeleton knowledge-skeleton-storage" />
          <div className="knowledge-loading-main">
            <Loader2 className="knowledge-loading-spinner" size={28} aria-hidden />
            <span>Loading files…</span>
          </div>
        </section>
      </div>
    </div>
  );
}
