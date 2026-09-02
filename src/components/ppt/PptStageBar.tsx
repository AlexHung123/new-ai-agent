'use client';

import { PPT_STAGES, PPT_THEMES, type PptDeckState, type PptStage } from '@/lib/ppt/types';
import { missingPlans, nextStage } from '@/lib/ppt/stage';
import { PPT_THEME_MAP } from '@/lib/ppt/themes';

const LABELS: Record<PptStage, string> = {
  discover: '顾问',
  outline: '大纲',
  plan: '策划',
  design: '设计',
  export: '导出',
};

export function PptStageBar({
  deck,
  busy,
  onAdvance,
  onTheme,
  onDownload,
  onRedoPage,
}: {
  deck: PptDeckState;
  busy?: boolean;
  onAdvance: (to: PptStage) => void;
  onTheme: (themeId: PptDeckState['themeId']) => void;
  onDownload: (format: 'json' | 'html' | 'pptx') => void;
  onRedoPage?: () => void;
}) {
  const missing = missingPlans(deck);
  const upcoming = nextStage(deck.stage);
  const advanceHint =
    upcoming === 'outline'
      ? '确认需求后生成大纲'
      : upcoming === 'plan'
        ? '确认便利贴后开始策划'
        : upcoming === 'design'
          ? missing.length
            ? `还差 ${missing.length} 页策划`
            : '生成设计稿'
          : upcoming === 'export'
            ? '可以导出了'
            : null;

  return (
    <div className="ppt-stage-bar">
      <ol className="ppt-stage-list">
        {PPT_STAGES.map((stage) => (
          <li
            key={stage}
            className={
              stage === deck.stage
                ? 'is-current'
                : PPT_STAGES.indexOf(stage) < PPT_STAGES.indexOf(deck.stage)
                  ? 'is-done'
                  : ''
            }
          >
            {LABELS[stage]}
          </li>
        ))}
      </ol>
      <div className="ppt-stage-actions">
        {deck.stage === 'design' || deck.stage === 'export' ? (
          <select
            value={deck.themeId}
            onChange={(e) => onTheme(e.target.value as PptDeckState['themeId'])}
            disabled={busy}
          >
            {PPT_THEMES.map((id) => (
              <option key={id} value={id}>
                {PPT_THEME_MAP[id].nameZh}
              </option>
            ))}
          </select>
        ) : null}
        {onRedoPage && deck.selectedPageId && deck.stage === 'plan' ? (
          <button type="button" className="ppt-btn-ghost" onClick={onRedoPage} disabled={busy}>
            重做本页
          </button>
        ) : null}
        {upcoming && advanceHint ? (
          <button
            type="button"
            onClick={() => onAdvance(upcoming)}
            disabled={
              busy ||
              (upcoming === 'outline' && !deck.brief) ||
              (upcoming === 'plan' && !deck.outline) ||
              (upcoming === 'design' && missing.length > 0)
            }
          >
            {advanceHint}
          </button>
        ) : null}
        <button
          type="button"
          className="ppt-btn-ghost"
          onClick={() => onDownload('json')}
          disabled={!deck.outline}
        >
          JSON
        </button>
        <button
          type="button"
          className="ppt-btn-ghost"
          onClick={() => onDownload('html')}
          disabled={deck.stage === 'discover' || deck.stage === 'outline'}
        >
          HTML
        </button>
        <button
          type="button"
          onClick={() => onDownload('pptx')}
          disabled={deck.stage === 'discover' || deck.stage === 'outline'}
        >
          PPTX
        </button>
      </div>
    </div>
  );
}
