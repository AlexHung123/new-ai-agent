import type {
    Survey,
    RatingItem,
    FreeTextItem,
    RatingsOnly,
    FreeTextOnly,
  } from '../utils/types';
  
  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;
  
  const looksLikeRating = (arr: unknown[]): arr is RatingItem[] =>
    arr.every(
      (x) =>
        isObject(x) &&
        typeof (x as any).count === 'number' &&
        typeof (x as any).value === 'string'
    );
  
  const looksLikeFreeText = (arr: unknown[]): arr is FreeTextItem[] =>
    arr.every((x) => isObject(x) && typeof (x as any).answer === 'string');
  
  export function splitSurvey(survey: Survey): { ratingsOnly: RatingsOnly; freeTextOnly: FreeTextOnly } {
    const ratingsOnly: RatingsOnly = {};
    const freeTextOnly: FreeTextOnly = {};
  
    for (const [question, items] of Object.entries(survey)) {
      if (!Array.isArray(items) || items.length === 0) continue;
  
      if (looksLikeRating(items)) {
        // Optional: trim values and keep order
        ratingsOnly[question] = items.map((it) => ({
          count: it.count,
          value: it.value.trim(),
        }));
        continue;
      }
  
      if (looksLikeFreeText(items)) {
        // Optional: trim answers and drop empty ones
        const cleaned = items
          .map((it) => ({ answer: it.answer.trim() }))
          .filter((it) => it.answer.length > 0);
        if (cleaned.length > 0) freeTextOnly[question] = cleaned;
        continue;
      }
  
      // Mixed or malformed groups: choose a strategy
      // Strategy here: ignore; or you could attempt to partition by shape.
    }
  
    return { ratingsOnly, freeTextOnly };
  }
  