'use client';

import { LAYOUT_SPECS, gridTemplateForCount } from '@/lib/ppt/layouts';
import { PPT_THEME_MAP } from '@/lib/ppt/themes';
import type { PptCard, PptPagePlan, PptThemeId } from '@/lib/ppt/types';

export function PptSlideView({
  plan,
  themeId,
  mode,
  onCardChange,
}: {
  plan: PptPagePlan;
  themeId: PptThemeId;
  mode: 'wireframe' | 'design';
  onCardChange?: (cardId: string, patch: Partial<PptCard>) => void;
}) {
  const spec = LAYOUT_SPECS[plan.layout];
  const theme = PPT_THEME_MAP[themeId];
  const editable = Boolean(onCardChange);

  return (
    <section
      className={`ppt-slide${spec.hasTitleBar ? ' has-title' : ''}${mode === 'wireframe' ? ' is-wireframe' : ''}`}
      style={theme.vars as React.CSSProperties}
    >
      {spec.hasTitleBar ? (
        <div className="ppt-slide-title">{plan.title}</div>
      ) : null}
      <div
        className="ppt-slide-grid"
        style={{ gridTemplate: gridTemplateForCount(plan.layout, plan.cards.length) }}
      >
        {plan.cards.map((card, i) => {
          const slot = spec.slots[Math.min(i, spec.slots.length - 1)];
          return (
            <div
              key={card.id}
              className={`ppt-card role-${card.role}`}
              style={slot?.gridColumn ? { gridColumn: slot.gridColumn } : undefined}
            >
              {card.role === 'step' ? (
                <div className="ppt-card-kicker">{String(i + 1).padStart(2, '0')}</div>
              ) : null}
              {editable ? (
                <>
                  <input
                    className="ppt-card-title ppt-card-input"
                    value={card.title}
                    onChange={(e) =>
                      onCardChange?.(card.id, { title: e.target.value })
                    }
                  />
                  <textarea
                    className="ppt-card-body ppt-card-input"
                    value={card.body}
                    rows={3}
                    onChange={(e) =>
                      onCardChange?.(card.id, { body: e.target.value })
                    }
                  />
                </>
              ) : (
                <>
                  <h3 className="ppt-card-title">{card.title}</h3>
                  {card.body ? <p className="ppt-card-body">{card.body}</p> : null}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
