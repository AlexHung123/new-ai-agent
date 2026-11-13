import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('Agent Image page contract', () => {
  it('chats through /api/chat and only shows images from generated_image events', () => {
    const page = readSrc('../../app/image/page.tsx');
    expect(page).toMatch(/Waiting for input/);
    expect(page).toMatch(/Agent Image/);
    expect(page).toMatch(/chatImageAgent:execute/);
    expect(page).toMatch(/\/itms\/ai\/api\/chat/);
    expect(page).toMatch(/focusMode: 'agentImage'/);
    expect(page).toMatch(/GENERATED_IMAGE_EVENT_TYPE/);
    expect(page).toMatch(/generate_image/);
    expect(page).toMatch(/getAuthHeaders/);
    expect(page).toMatch(/x-agent-id/);
    expect(page).toMatch(/x-chat-id/);
    expect(page).not.toMatch(/\/itms\/ai\/api\/image\/generate/);
    expect(page).not.toMatch(/正在等待输入/);
    expect(page).not.toMatch(/127\.0\.0\.1:8188/);
    expect(page).toMatch(/bg-light-primary/);
    expect(page).toMatch(/dark:bg-dark-primary/);
    expect(page).toMatch(/bg-blue-600/);
    expect(page).not.toMatch(/#0b0b0b/);
    expect(page).not.toMatch(/#111111/);
  });
});
