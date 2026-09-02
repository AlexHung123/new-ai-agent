'use client';

import { useMemo, useState } from 'react';
import type { PptAskQuestion, PptBrief } from '@/lib/ppt/types';

const CORE = new Set(['audience', 'purpose', 'pages', 'style']);

export function PptAskForm({
  questions,
  onSubmit,
  disabled,
}: {
  questions: PptAskQuestion[];
  onSubmit: (brief: PptBrief) => void;
  disabled?: boolean;
}) {
  const extras = useMemo(
    () => questions.filter((q) => !CORE.has(q.id)),
    [questions],
  );
  const [audience, setAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [pages, setPages] = useState('10');
  const [style, setStyle] = useState('');
  const [extra, setExtra] = useState<Record<string, string>>({});

  const submit = (defaultsApplied: boolean) => {
    const extraText = extras
      .map((q) => `${q.prompt}: ${extra[q.id] || ''}`.trim())
      .filter((line) => !line.endsWith(':'));
    onSubmit({
      audience: audience.trim() || '内部同事',
      purpose: [purpose.trim() || '把主题讲清楚并促成下一步', ...extraText]
        .filter(Boolean)
        .join('。'),
      pages: Math.min(16, Math.max(6, Number(pages) || 10)),
      style: style.trim() || 'navy-bento 专业简洁',
      defaultsApplied,
    });
  };

  return (
    <form
      className="ppt-ask-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <h3>先确认需求</h3>
      <label>
        <span>为谁做？</span>
        <input
          value={audience}
          placeholder="例如：部门管理层"
          onChange={(e) => setAudience(e.target.value)}
        />
      </label>
      <label>
        <span>目的是什么？</span>
        <input
          value={purpose}
          placeholder="例如：立项评审，要一个决策"
          onChange={(e) => setPurpose(e.target.value)}
        />
      </label>
      <label>
        <span>大约多少页？</span>
        <input
          type="number"
          min={6}
          max={16}
          value={pages}
          onChange={(e) => setPages(e.target.value)}
        />
      </label>
      <label>
        <span>风格？</span>
        <input
          value={style}
          placeholder="专业简洁 / 海军蓝"
          onChange={(e) => setStyle(e.target.value)}
        />
      </label>
      {extras.map((q) => (
        <label key={q.id}>
          <span>{q.prompt}</span>
          <input
            value={extra[q.id] || ''}
            placeholder={q.placeholder || ''}
            onChange={(e) =>
              setExtra((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
          />
        </label>
      ))}
      <div className="ppt-ask-actions">
        <button type="submit" disabled={disabled}>
          确认需求
        </button>
        <button
          type="button"
          className="ppt-btn-ghost"
          disabled={disabled}
          onClick={() => submit(true)}
        >
          按你判断
        </button>
      </div>
    </form>
  );
}
