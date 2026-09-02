import {
  LAYOUT_SPECS,
  PPT_CANVAS,
  gridTemplateForCount,
} from './layouts';
import { themeCssVars } from './themes';
import type { PptDeckState, PptPagePlan, PptThemeId } from './types';
import { listDeckPlans } from './outline';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SLIDE_CSS = `
.ppt-slide {
  width: ${PPT_CANVAS.width}px;
  height: ${PPT_CANVAS.height}px;
  padding: ${PPT_CANVAS.padding}px;
  background: var(--ppt-bg);
  color: var(--ppt-ink);
  display: grid;
  gap: ${PPT_CANVAS.gap}px;
  box-sizing: border-box;
  font-family: "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
}
.ppt-slide.has-title { grid-template-rows: ${PPT_CANVAS.titleBar}px 1fr; }
.ppt-slide-title {
  display: flex; align-items: center;
  font-size: 28px; font-weight: 700; letter-spacing: -0.03em;
  padding: 0 4px;
}
.ppt-slide-grid { display: grid; gap: ${PPT_CANVAS.gap}px; min-height: 0; }
.ppt-card {
  background: var(--ppt-card);
  border: 1px solid var(--ppt-line);
  border-radius: ${PPT_CANVAS.radius}px;
  padding: 22px 24px;
  display: flex; flex-direction: column; justify-content: center;
  min-width: 0;
}
.ppt-card.role-hero {
  background: var(--ppt-card-hero);
  color: var(--ppt-card-hero-ink);
  border-color: transparent;
}
.ppt-card.role-stat .ppt-card-title { font-size: 40px; letter-spacing: -0.04em; }
.ppt-card-kicker {
  font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ppt-accent); margin-bottom: 8px; font-weight: 700;
}
.ppt-card.role-hero .ppt-card-kicker { color: color-mix(in srgb, var(--ppt-card-hero-ink) 70%, transparent); }
.ppt-card-title { margin: 0 0 8px; font-size: 22px; letter-spacing: -0.03em; }
.ppt-card-body { margin: 0; font-size: 15px; line-height: 1.45; color: var(--ppt-muted); }
.ppt-card.role-hero .ppt-card-body { color: color-mix(in srgb, var(--ppt-card-hero-ink) 82%, transparent); }
.ppt-slide.is-wireframe { background: #fafaf9; color: #1c1917; }
.ppt-slide.is-wireframe .ppt-card {
  background: #e7e5e4; border: 1.5px dashed #a8a29e; color: #44403c;
}
.ppt-slide.is-wireframe .ppt-card.role-hero { background: #ddd6ce; color: #1c1917; }
.ppt-slide.is-wireframe .ppt-card-body { color: #57534e; }
`;

export function renderPageHtml(
  plan: PptPagePlan,
  themeId: PptThemeId,
  mode: 'wireframe' | 'design' = 'design',
): string {
  const spec = LAYOUT_SPECS[plan.layout];
  const grid = gridTemplateForCount(plan.layout, plan.cards.length);
  const titleBar = spec.hasTitleBar
    ? `<div class="ppt-slide-title">${escapeHtml(plan.title)}</div>`
    : '';
  const cards = plan.cards
    .map((card, i) => {
      const slot = spec.slots[Math.min(i, spec.slots.length - 1)];
      const col = slot?.gridColumn
        ? ` style="grid-column:${slot.gridColumn}"`
        : '';
      const kicker =
        card.role === 'step' ? `<div class="ppt-card-kicker">${escapeHtml(card.id)}</div>` : '';
      return `<div class="ppt-card role-${card.role}"${col}>${kicker}<h3 class="ppt-card-title">${escapeHtml(card.title)}</h3>${card.body ? `<p class="ppt-card-body">${escapeHtml(card.body)}</p>` : ''}</div>`;
    })
    .join('');

  return `<section class="ppt-slide${spec.hasTitleBar ? ' has-title' : ''}${mode === 'wireframe' ? ' is-wireframe' : ''}" style="${themeCssVars(themeId)}">
${titleBar}
<div class="ppt-slide-grid" style="grid-template:${grid}">${cards}</div>
</section>`;
}

export function renderDeckHtml(deck: PptDeckState): string {
  const slides = listDeckPlans(deck)
    .map((plan) => renderPageHtml(plan, deck.themeId, 'design'))
    .join('\n');
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/><title>PPT</title>
<style>
  body { margin: 0; background: #111; }
  .ppt-deck { display: flex; flex-direction: column; gap: 24px; padding: 24px; align-items: center; }
  ${SLIDE_CSS}
</style></head>
<body><div class="ppt-deck">${slides}</div></body></html>`;
}

export { SLIDE_CSS };
