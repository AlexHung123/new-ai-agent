'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { IAllProps } from '@tinymce/tinymce-react';
import { useChat } from '@/lib/hooks/useChat';
import { wrapHtmlPreview } from '@/lib/html/previewDoc';
import { insertBackToWcms } from '@/lib/html/insertBackToWcms';
import {
  HTML_PREVIEW_SANDBOX,
  WCMS_TINYMCE_INIT,
} from '@/lib/html/tinymceInit';
import { getAuthHeaders } from '@/lib/utils/auth';
import { toast } from 'sonner';

// Editor's propTypes.apiKey nominal type fails next/dynamic's ComponentClass check.
const TinyMceEditor = dynamic(
  () =>
    import('@tinymce/tinymce-react').then(
      (mod) => mod.Editor as unknown as ComponentType<IAllProps>,
    ),
  { ssr: false },
);

export default function HtmlCanvas() {
  const {
    focusMode,
    wcmsHtml,
    setWcmsHtml,
    wcmsFileBaseHref,
    wcmsContentId,
    wcmsPageIndex,
    wcmsLang,
    wcmsTitle,
  } = useChat();
  const inlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const htmlFromEditor = useRef(false);
  const suppressEditorEcho = useRef(false);
  const seenHtml = useRef(wcmsHtml);
  if (seenHtml.current !== wcmsHtml) {
    if (!htmlFromEditor.current) {
      suppressEditorEcho.current = true;
      queueMicrotask(() => {
        suppressEditorEcho.current = false;
      });
    }
    htmlFromEditor.current = false;
    seenHtml.current = wcmsHtml;
  }
  const [previewHtml, setPreviewHtml] = useState(wcmsHtml);
  const [view, setView] = useState<'source' | 'preview'>('source');

  useEffect(() => {
    return () => {
      if (inlineTimer.current) clearTimeout(inlineTimer.current);
    };
  }, []);

  useEffect(() => {
    if (focusMode !== 'agentHtml') return;
    setPreviewHtml(wcmsHtml);
    if (inlineTimer.current) clearTimeout(inlineTimer.current);
    inlineTimer.current = setTimeout(() => {
      void fetch('/itms/ai/api/wcms-content/inline', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          html: wcmsHtml,
          itmsOrigin: wcmsFileBaseHref,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.html === 'string') setPreviewHtml(data.html);
        })
        .catch(() => undefined);
    }, 400);
  }, [focusMode, wcmsHtml]);

  if (focusMode !== 'agentHtml') return null;

  const previewDoc = wrapHtmlPreview(
    previewHtml,
    wcmsFileBaseHref || undefined,
  );
  const heading = wcmsContentId
    ? `WCMS ${wcmsContentId} · ${wcmsLang.toUpperCase()} · page ${wcmsPageIndex + 1}`
    : 'HTML canvas';

  const applyToForm = () => {
    const result = insertBackToWcms({
      wcmsContentId,
      pageIndex: wcmsPageIndex,
      lang: wcmsLang,
      html: wcmsHtml,
      embedded: window.parent !== window,
      targetOrigin: wcmsFileBaseHref,
      post: (message, targetOrigin) => {
        window.parent.postMessage(message, targetOrigin);
      },
    });
    if (result === 'sent') {
      toast.success(
        'Inserted into the WCMS TinyMCE editor. Save the WCMS form to keep it.',
      );
      return;
    }
    toast.error(
      'Open this page from the WCMS Edit by Agent HTML button to insert the content back.',
    );
  };

  const onEditorChange = (content: string) => {
    if (suppressEditorEcho.current || content === wcmsHtml) {
      suppressEditorEcho.current = false;
      return;
    }
    htmlFromEditor.current = true;
    setWcmsHtml(content);
  };

  return (
    <aside className="html-canvas" aria-label="HTML editor and preview">
      <div className="html-canvas-bar">
        <span className="html-canvas-label">{heading}</span>
        {wcmsTitle ? (
          <span className="html-canvas-title">{wcmsTitle}</span>
        ) : null}
        <span className="html-canvas-tabs">
          <button
            type="button"
            className={`html-canvas-tab${view === 'source' ? ' is-active' : ''}`}
            onClick={() => setView('source')}
          >
            Source
          </button>
          <button
            type="button"
            className={`html-canvas-tab${view === 'preview' ? ' is-active' : ''}`}
            onClick={() => setView('preview')}
          >
            Preview
          </button>
        </span>
        {wcmsContentId ? (
          <button type="button" className="html-canvas-apply" onClick={applyToForm}>
            Insert back to TinyMCE
          </button>
        ) : null}
      </div>
      <div
        className={`html-canvas-editor${view === 'source' ? '' : ' is-hidden'}`}
      >
        <TinyMceEditor
          licenseKey="gpl"
          tinymceScriptSrc="/itms/ai/tinymce/tinymce.min.js"
          value={wcmsHtml}
          onEditorChange={onEditorChange}
          init={{
            ...WCMS_TINYMCE_INIT,
            height: '100%',
            base_url: '/itms/ai/tinymce',
            suffix: '.min',
          }}
        />
      </div>
      <div
        className={`html-canvas-preview${view === 'preview' ? '' : ' is-hidden'}`}
      >
        <iframe
          className="html-canvas-frame"
          title="HTML preview"
          sandbox={HTML_PREVIEW_SANDBOX}
          srcDoc={previewDoc}
        />
      </div>
    </aside>
  );
}
