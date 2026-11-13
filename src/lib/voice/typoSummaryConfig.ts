import configManager from '@/lib/config';
import { resolveTypoSummaryInstruction } from './transcriptFormat';

/** `voice.typoSummaryInstruction` in data/config.json, or the built-in default. */
export function getTypoSummaryInstruction(): string {
  return resolveTypoSummaryInstruction(configManager.getConfig('voice'));
}
