import { describe, expect, it } from 'vitest';
import {
  mermaidFlowchartToFlow,
  rewriteMermaidFences,
} from './mermaidToFlow';

const PROCUREMENT = `flowchart TD
  A[開始：確定所需電腦為「物料採購」] --> B{該電腦是否在<br>GLD未分配庫存<br>或GLD批量合約內?}
  B -- 是 --> C[經GLD / 使用GLD合約取得<br>SPR 235(a)]
  B -- 否 --> D{金額範圍?<br>同類12個月內不可累計<br>超過報價關口 SPR 246}
  D -- 不超過報價關口<br>物料: ≤135萬 --> E[第II章 報價程序<br>SPR 220/260]
  D -- 超過報價關口<br>但 ≤100萬部門限額 --> F[可自行招標 SPR 235(b)]
  D -- 超過部門限額100萬 --> G[由GLD作為代理代採購<br>SPR 235(a)]
  E --> H[接受最低符合報價<br>或最高總評分 SPR 260]
  F --> I[第III章招標 / 或GLD代辦]
  G --> J[GLD代辦並用一般規格 SPR 350]
`;

describe('mermaidFlowchartToFlow', () => {
  it('converts a mermaid flowchart TD into AM flow TB with shapes and edge labels', () => {
    const out = mermaidFlowchartToFlow(`flowchart TD
A[Start] --> B{Ready?}
B -- yes --> C[Go]
B -- no --> D[Wait]
`);
    expect(out).toBeTruthy();
    expect(out).toMatch(/^```flow TB\n/);
    expect(out).toMatch(/\[Start\] -> \{Ready\?\}/);
    expect(out).toMatch(/\{Ready\?\} -> \[Go\]: yes/);
    expect(out).toMatch(/\{Ready\?\} -> \[Wait\]: no/);
    expect(out).toMatch(/```$/);
  });

  it('maps mermaid --> to AM solid ->, not dashed -->', () => {
    const out = mermaidFlowchartToFlow('flowchart LR\nA[One] --> B[Two]\n');
    expect(out).toContain('```flow LR');
    expect(out).toContain('[One] -> [Two]');
    expect(out).not.toMatch(/\[One\] --> \[Two\]/);
  });

  it('replaces <br> in node and edge labels with spaces', () => {
    const out = mermaidFlowchartToFlow(PROCUREMENT);
    expect(out).toBeTruthy();
    expect(out).not.toMatch(/<br\s*\/?>/i);
    expect(out).toMatch(/GLD未分配庫存/);
    expect(out).toMatch(/物料採購/);
    expect(out).toMatch(/: 是/);
    expect(out).toMatch(/: 否/);
    expect(out).toMatch(/\{該電腦是否在 GLD未分配庫存 或GLD批量合約內\?\}/);
  });

  it('returns null for sequence diagrams and subgraphs', () => {
    expect(
      mermaidFlowchartToFlow('sequenceDiagram\nAlice->>Bob: hi\n'),
    ).toBeNull();
    expect(
      mermaidFlowchartToFlow(
        'flowchart TD\nsubgraph S\nA --> B\nend\n',
      ),
    ).toBeNull();
  });
});

describe('rewriteMermaidFences', () => {
  it('rewrites mermaid flowchart fences and leaves other fences alone', () => {
    const draft = `---
title: Buy a PC
---

## Route

\`\`\`mermaid
${PROCUREMENT}\`\`\`

## Notes

\`\`\`flow TB
(Keep) -> [This]
\`\`\`
`;
    const result = rewriteMermaidFences(draft);
    expect(result.draft).not.toMatch(/```mermaid/);
    expect(result.draft).toMatch(/```flow TB/);
    expect(result.draft).toMatch(/\(Keep\) -> \[This\]/);
    expect(result.draft).toMatch(/物料採購/);
    expect(result.warnings).toEqual([]);
  });

  it('keeps an unconverted mermaid fence and records a warning', () => {
    const draft = '```mermaid\nsequenceDiagram\nA->>B: hi\n```\n';
    const result = rewriteMermaidFences(draft);
    expect(result.draft).toContain('```mermaid');
    expect(result.draft).toContain('sequenceDiagram');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/mermaid/i);
  });
});
