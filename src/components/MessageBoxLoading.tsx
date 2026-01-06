import { ProgressData } from '@/lib/hooks/useChat';

const MessageBoxLoading = ({ progress }: { progress?: ProgressData | null }) => {
  return (
    <div className="flex flex-col space-y-4 w-full lg:w-9/12">
      {progress && (
        <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black dark:text-white">
              {progress.message}
            </span>
            <span className="text-sm text-black/70 dark:text-white/70">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-light-200 dark:bg-dark-200 rounded-full h-2">
            <div
              className="bg-sky-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(progress.current / progress.total) * 100}%`,
              }}
            />
          </div>
          {progress.question && (
            <p className="text-xs text-black/60 dark:text-white/60 truncate">
              {progress.question}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col space-y-2 bg-light-primary dark:bg-dark-primary animate-pulse rounded-lg py-3">
        <div className="h-2 rounded-full w-full bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2 rounded-full w-9/12 bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2 rounded-full w-10/12 bg-light-secondary dark:bg-dark-secondary" />
      </div>
    </div>
  );
};

export default MessageBoxLoading;
