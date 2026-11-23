'use client';

import KnowledgeFileManager from '@/components/knowledge/KnowledgeFileManager';
import { initializeAuthToken } from '@/lib/utils/auth';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

const KnowledgePageInner = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    initializeAuthToken(searchParams);
  }, [searchParams]);

  return <KnowledgeFileManager />;
};

const Page = () => (
  <Suspense fallback={null}>
    <KnowledgePageInner />
  </Suspense>
);

export default Page;
