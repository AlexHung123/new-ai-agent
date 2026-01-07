import { ProgressData } from '@/lib/hooks/useChat';
import { CheckCircle2, Loader2 } from 'lucide-react';

const MessageBoxLoading = ({ progress }: { progress?: ProgressData | null }) => {
  if (!progress) {
    return (
      <div className="flex flex-col space-y-4 w-full lg:w-9/12">
        <div className="flex flex-col space-y-2 bg-light-primary dark:bg-dark-primary rounded-lg py-3">
          <div className="h-2 rounded-full w-full bg-light-secondary dark:bg-dark-secondary animate-pulse" />
          <div className="h-2 rounded-full w-9/12 bg-light-secondary dark:bg-dark-secondary animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="h-2 rounded-full w-10/12 bg-light-secondary dark:bg-dark-secondary animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 w-full lg:w-9/12">
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 space-y-4">
        {/* 标题和总进度 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-black dark:text-white">
            {progress.message}
          </span>
          <span className="text-sm text-black/70 dark:text-white/70">
            {progress.current} / {progress.total}
          </span>
        </div>

        {/* 总体进度条 */}
        <div className="w-full bg-light-200 dark:bg-dark-200 rounded-full h-2">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(progress.current / progress.total) * 100}%`,
            }}
          />
        </div>

        {/* 任务列表 - 显示所有已记录的任务 */}
        <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto">
          {progress.tasks && progress.tasks.length > 0 ? (
            progress.tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  task.status === 'processing'
                    ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800'
                    : 'bg-green-50 dark:bg-green-900/20'
                }`}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-sky-500 flex-shrink-0 animate-spin" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black dark:text-white truncate">
                    {task.question}
                    {task.status === 'processing' && (
                      <span className="inline-block ml-1 animate-pulse">...</span>
                    )}
                  </p>
                </div>

                <span className="text-xs flex-shrink-0">
                  {task.status === 'completed' ? (
                    <span className="text-green-600 dark:text-green-400">Finished</span>
                  ) : (
                    <span className="text-sky-600 dark:text-sky-400">Processing</span>
                  )}
                </span>
              </div>
            ))
          ) : progress.question ? (
            // 如果没有 tasks 数组但有 question，显示当前任务（兼容旧数据）
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 transition-all">
              <Loader2 className="w-4 h-4 text-sky-500 flex-shrink-0 animate-spin" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-black dark:text-white truncate">
                  {progress.question}
                  <span className="inline-block ml-1 animate-pulse">...</span>
                </p>
              </div>
              <span className="text-xs text-sky-600 dark:text-sky-400 flex-shrink-0">Processing</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 底部骨架屏 */}
      <div className="flex flex-col space-y-2 bg-light-primary dark:bg-dark-primary rounded-lg py-3">
        <div className="h-2 rounded-full w-full bg-light-secondary dark:bg-dark-secondary animate-pulse" />
        <div className="h-2 rounded-full w-9/12 bg-light-secondary dark:bg-dark-secondary animate-pulse" style={{ animationDelay: '0.1s' }} />
        <div className="h-2 rounded-full w-10/12 bg-light-secondary dark:bg-dark-secondary animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  );
};

export default MessageBoxLoading;
