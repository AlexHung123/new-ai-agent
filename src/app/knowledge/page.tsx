'use client';

import KnowledgeFileManager from '@/components/knowledge/KnowledgeFileManager';
import KnowledgeLoading from '@/components/knowledge/KnowledgeLoading';
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
  <Suspense fallback={<KnowledgeLoading />}>
    <KnowledgePageInner />
  </Suspense>
);

export default Page;
