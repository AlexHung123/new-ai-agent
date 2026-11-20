'use client';

import KnowledgeFileManager from '@/components/knowledge/KnowledgeFileManager';
import { initializeAuthToken } from '@/lib/utils/auth';
import { FolderOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

const KnowledgePageInner = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    initializeAuthToken(searchParams);
  }, [searchParams]);

  return (
    <div>
      <div className="flex flex-col pt-4">
        <div className="flex items-center">
          <FolderOpen />
          <h1 className="text-3xl font-medium p-2">Knowledge</h1>
        </div>
        <hr className="border-t border-[#2B2C2C] my-4 w-full" />
      </div>
      <KnowledgeFileManager />
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <KnowledgePageInner />
  </Suspense>
);

export default Page;
