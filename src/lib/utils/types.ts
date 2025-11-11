export type RatingItem = { count: number; value: string };
export type FreeTextItem = { answer: string };

export type Group = RatingItem[] | FreeTextItem[];

export type Survey = Record<string, Group>;

export type RatingsOnly = Record<string, RatingItem[]>;
export type FreeTextOnly = Record<string, FreeTextItem[]>;
