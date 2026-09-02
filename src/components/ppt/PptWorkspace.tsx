'use client';

import { PptAskForm } from './PptAskForm';
import { PptSlideView } from './PptSlideView';
import { PptStageBar } from './PptStageBar';
import { PptStickyWall } from './PptStickyWall';
import type { PptBrief, PptCard, PptDeckState, PptOutline, PptStage } from '@/lib/ppt/types';

export function PptWorkspace({
  deck,
  busy,
  onPatch,
  onAdvance,
  onDownload,
  onRedoPage,
}: {
  deck: PptDeckState;
  busy?: boolean;
  onPatch: (patch: Partial<PptDeckState>) => void;
  onAdvance: (to: PptStage, extra?: Partial<PptDeckState>) => void;
  onDownload: (format: 'json' | 'html' | 'pptx') => void;
  onRedoPage: (pageId: string) => void;
}) {
  const selected =
    (deck.selectedPageId && deck.pages[deck.selectedPageId]) ||
    Object.values(deck.pages)[0];
  const showPreview = deck.stage === 'plan' || deck.stage === 'design' || deck.stage === 'export';

  const confirmBrief = (brief: PptBrief) => {
    onAdvance('outline', { brief, questions: null });
  };

  const changeOutline = (outline: PptOutline) => {
    onPatch({ outline });
  };

  const changeCard = (cardId: string, patch: Partial<PptCard>) => {
    if (!selected) return;
    onPatch({
      pages: {
        ...deck.pages,
        [selected.page_id]: {
          ...selected,
          cards: selected.cards.map((card) =>
            card.id === cardId ? { ...card, ...patch } : card,
          ),
        },
      },
    });
  };

  return (
    <aside className="ppt-workspace">
      <PptStageBar
        deck={deck}
        busy={busy}
        onAdvance={(to) => onAdvance(to)}
        onTheme={(themeId) => onPatch({ themeId })}
        onDownload={onDownload}
        onRedoPage={
          selected ? () => onRedoPage(selected.page_id) : undefined
        }
      />
      {deck.questions && deck.questions.length > 0 && deck.stage === 'discover' ? (
        <PptAskForm questions={deck.questions} onSubmit={confirmBrief} disabled={busy} />
      ) : null}
      <PptStickyWall
        deck={deck}
        onSelect={(pageId) => onPatch({ selectedPageId: pageId })}
        onOutlineChange={changeOutline}
      />
      {showPreview && selected ? (
        <div className="ppt-preview-pair">
          <div className="ppt-preview-pane">
            <h3>策划线框</h3>
            <div className="ppt-slide-scale">
              <PptSlideView
                plan={selected}
                themeId={deck.themeId}
                mode="wireframe"
                onCardChange={deck.stage === 'plan' ? changeCard : undefined}
              />
            </div>
          </div>
          <div className="ppt-preview-pane">
            <h3>设计稿</h3>
            <div className="ppt-slide-scale">
              <PptSlideView
                plan={selected}
                themeId={deck.themeId}
                mode={deck.stage === 'plan' ? 'wireframe' : 'design'}
              />
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
