import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('attach image composer', () => {
  it('shows Attach image on Agent Writing and Agent HTML composers', () => {
    const control = readSrc('../../components/AttachImageControls.tsx');
    const input = readSrc('../../components/MessageInput.tsx');
    const empty = readSrc('../../components/EmptyChatMessageInput.tsx');
    expect(control).toMatch(/Attach image/);
    expect(control).toMatch(/accept="image\/\*"/);
    expect(control).toMatch(/agentWriting/);
    expect(control).toMatch(/agentHtml/);
    expect(input).toMatch(/AttachImageControls/);
    expect(empty).toMatch(/AttachImageControls/);
    expect(input).toMatch(/onPaste=\{images\.onPaste\}/);
    expect(empty).toMatch(/onPaste=\{images\.onPaste\}/);
  });

  it('sends image bytes beside the text and keeps them off the saved message content', () => {
    const chat = readSrc('../hooks/useChat.tsx');
    const route = readSrc('../../app/api/chat/route.ts');
    expect(chat).toMatch(/images: attached/);
    expect(chat).toMatch(/content: message/);
    expect(route).toMatch(/content: message\.content/);
    expect(route).toMatch(/imagesForFocus/);
    expect(route).not.toMatch(/images: turnImages/);
  });

  it('passes attached images into the writing and HTML prompts', () => {
    const html = readSrc('../search/htmlAgent.ts');
    const writing = readSrc('../search/writingAgent.ts');
    expect(html).toMatch(/promptWithImages\([\s\S]*'agentHtml'/);
    expect(html).toMatch(/agent\.prompt\(prompt\.text, prompt\.images\)/);
    expect(writing).toMatch(/promptWithImages\([\s\S]*'agentWriting'/);
    expect(writing).toMatch(/agent\.prompt\(prompt\.text, prompt\.images\)/);
  });

  it('shows this session’s thumbnails on the user bubble', () => {
    const box = readSrc('../../components/MessageBox.tsx');
    expect(box).toMatch(/userMessage\.images/);
  });
});
