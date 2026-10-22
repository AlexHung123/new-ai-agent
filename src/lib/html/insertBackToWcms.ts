import { toTinyMceBodyFragment } from './tinyMceFragment';
import {
  agentHtmlApplyMessage,
  parseItmsOrigin,
  type WcmsLang,
} from './wcmsQuery';

export type InsertBackResult = 'sent' | 'missing' | 'not-embedded';

export function insertBackToWcms(input: {
  wcmsContentId: number | null;
  pageIndex: number;
  lang: WcmsLang;
  html: string;
  embedded: boolean;
  targetOrigin?: string | null;
  post: (message: unknown, targetOrigin: string) => void;
}): InsertBackResult {
  if (!input.wcmsContentId) return 'missing';
  if (!input.embedded) return 'not-embedded';
  input.post(
    agentHtmlApplyMessage(
      {
        wcmsContentId: input.wcmsContentId,
        pageIndex: input.pageIndex,
        lang: input.lang,
      },
      toTinyMceBodyFragment(input.html),
    ),
    parseItmsOrigin(input.targetOrigin) || '*',
  );
  return 'sent';
}
