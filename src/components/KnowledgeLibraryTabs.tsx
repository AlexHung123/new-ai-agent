'use client';

import { Globe, Lock } from 'lucide-react';
import type { KnowledgeLibrary } from '@/lib/knowledge/library';

type Props = {
  value: KnowledgeLibrary;
  onChange: (library: KnowledgeLibrary) => void;
  className?: string;
};

export default function KnowledgeLibraryTabs({
  value,
  onChange,
  className,
}: Props) {
  const tabs: { id: KnowledgeLibrary; label: string; icon: typeof Lock }[] = [
    { id: 'private', label: 'Private', icon: Lock },
    { id: 'public', label: 'Public', icon: Globe },
  ];
  return (
    <div
      className={
        className
          ? `knowledge-library-tabs ${className}`
          : 'knowledge-library-tabs'
      }
      role="tablist"
      aria-label="Library"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`knowledge-library-tab-${tab.id}`}
            className={
              selected
                ? 'knowledge-library-tab is-active'
                : 'knowledge-library-tab'
            }
            onClick={() => onChange(tab.id)}
          >
            <Icon size={13} aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
