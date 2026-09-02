import PptxGenJS from 'pptxgenjs';
import { LAYOUT_SPECS, PPT_CANVAS } from './layouts';
import { PPT_THEME_MAP } from './themes';
import { listDeckPlans } from './outline';
import {
  SLIDE_IN,
  cardBoxesForPlan,
  pxToInch,
  titleBarBox,
  type CardBox,
  type InchBox,
} from './exportLayout';
import type { PptCard, PptDeckState, PptPagePlan, PptThemeId } from './types';

const FONT = 'Microsoft YaHei';
const PX_TO_PT = (SLIDE_IN.h * 72) / PPT_CANVAS.height;

function hex(css: string): string {
  return css.replace(/^#/, '').toUpperCase();
}

function pt(px: number): number {
  return Math.max(10, Math.round(px * PX_TO_PT));
}

function themeColors(themeId: PptThemeId) {
  const vars = PPT_THEME_MAP[themeId].vars;
  return {
    bg: hex(vars['--ppt-bg'] ?? '#F4F1EA'),
    ink: hex(vars['--ppt-ink'] ?? '#1C1917'),
    muted: hex(vars['--ppt-muted'] ?? '#57534E'),
    card: hex(vars['--ppt-card'] ?? '#FFFFFF'),
    hero: hex(vars['--ppt-card-hero'] ?? '#1E3A5F'),
    heroInk: hex(vars['--ppt-card-hero-ink'] ?? '#F8FAFC'),
    accent: hex(vars['--ppt-accent'] ?? '#1E3A5F'),
    line: hex(vars['--ppt-line'] ?? '#D6D3D1'),
  };
}

type Colors = ReturnType<typeof themeColors>;

function isHeroFill(card: PptCard, kind: PptPagePlan['kind']): boolean {
  return card.role === 'hero' || kind === 'cover' || kind === 'section' || kind === 'end';
}

function inset(box: InchBox, padX: number, padY: number): InchBox {
  return {
    x: box.x + padX,
    y: box.y + padY,
    w: Math.max(0.2, box.w - padX * 2),
    h: Math.max(0.2, box.h - padY * 2),
  };
}

type Slide = ReturnType<PptxGenJS['addSlide']>;

function addCard(
  slide: Slide,
  box: CardBox,
  plan: PptPagePlan,
  colors: Colors,
) {
  const hero = isHeroFill(box.card, plan.kind);
  slide.addShape('roundRect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: hero ? colors.hero : colors.card },
    line: hero
      ? { color: colors.hero, width: 0 }
      : { color: colors.line, width: 0.75 },
    rectRadius: pxToInch(PPT_CANVAS.radius),
    shadow: {
      type: 'outer',
      color: '000000',
      blur: 4,
      offset: 1,
      angle: 135,
      opacity: 0.08,
    },
  });

  const inner = inset(box, pxToInch(24), pxToInch(22));
  const ink = hero ? colors.heroInk : colors.ink;
  const muted = hero ? colors.heroInk : colors.muted;
  const titleSize =
    box.card.role === 'stat'
      ? pt(40)
      : plan.kind === 'cover' || plan.kind === 'end'
        ? pt(36)
        : plan.kind === 'section'
          ? pt(32)
          : pt(22);
  const showKicker = box.card.role === 'step';
  const kickerH = showKicker ? Math.min(0.28, inner.h * 0.18) : 0;
  const titleShare =
    box.card.role === 'stat' ? 0.5 : box.card.body ? 0.38 : 0.9;
  const titleH = Math.max(
    0.28,
    Math.min(inner.h - kickerH, inner.h * titleShare),
  );
  let y = inner.y;

  if (showKicker) {
    slide.addText(String(box.index + 1).padStart(2, '0'), {
      x: inner.x,
      y,
      w: inner.w,
      h: kickerH,
      fontFace: FONT,
      fontSize: pt(12),
      bold: true,
      color: hero ? colors.heroInk : colors.accent,
      margin: 0,
      valign: 'middle',
    });
    y += kickerH;
  }

  if (box.card.title) {
    slide.addText(box.card.title, {
      x: inner.x,
      y,
      w: inner.w,
      h: titleH,
      fontFace: FONT,
      fontSize: titleSize,
      bold: true,
      color: ink,
      margin: 0,
      valign: box.card.body ? 'top' : 'middle',
      align:
        plan.kind === 'cover' || plan.kind === 'section' || plan.kind === 'end'
          ? 'left'
          : 'left',
      wrap: true,
    });
    y += titleH;
  }

  if (box.card.body) {
    const bodyH = Math.max(0.22, inner.y + inner.h - y);
    slide.addText(box.card.body, {
      x: inner.x,
      y,
      w: inner.w,
      h: bodyH,
      fontFace: FONT,
      fontSize: box.card.role === 'stat' ? pt(15) : pt(15),
      color: muted,
      margin: 0,
      valign: 'top',
      wrap: true,
    });
  }
}

function addSlide(
  pres: PptxGenJS,
  plan: PptPagePlan,
  colors: Colors,
) {
  const spec = LAYOUT_SPECS[plan.layout];
  const slide = pres.addSlide();
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: SLIDE_IN.w,
    h: SLIDE_IN.h,
    fill: { color: colors.bg },
    line: { color: colors.bg, width: 0 },
  });

  if (spec.hasTitleBar && plan.title) {
    const bar = titleBarBox();
    slide.addText(plan.title, {
      x: bar.x,
      y: bar.y,
      w: bar.w,
      h: bar.h,
      fontFace: FONT,
      fontSize: pt(28),
      bold: true,
      color: colors.ink,
      margin: 0,
      valign: 'middle',
    });
  }

  for (const box of cardBoxesForPlan(plan)) {
    addCard(slide, box, plan, colors);
  }

  if (plan.notes) {
    slide.addNotes(plan.notes);
  }
}

export async function exportPptxBuffer(deck: PptDeckState): Promise<Buffer> {
  const plans = listDeckPlans(deck);
  if (plans.length === 0) {
    throw new Error('No planned pages to export');
  }
  const colors = themeColors(deck.themeId);
  const pres = new PptxGenJS();
  pres.defineLayout({
    name: 'LAYOUT_1280',
    width: SLIDE_IN.w,
    height: SLIDE_IN.h,
  });
  pres.layout = 'LAYOUT_1280';
  pres.title = deck.outline?.cover.title || plans[0]?.title || 'PPT';
  pres.author = 'Agent PPT';
  pres.subject = deck.brief?.purpose || '';

  for (const plan of plans) {
    addSlide(pres, plan, colors);
  }

  const out = await pres.write({ outputType: 'nodebuffer' });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
