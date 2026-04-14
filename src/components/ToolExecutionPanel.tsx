import React, { useState, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ToolExecutionPanel = () => {
  const { toolExecution, loading, messageAppeared } = useChat();
  const [showToolExecution, setShowToolExecution] = useState(false);
  const [internalToolExecution, setInternalToolExecution] = useState<
    any | null
  >(null);

  useEffect(() => {
    if (toolExecution) {
      setInternalToolExecution(toolExecution);
      setShowToolExecution(true);
    }
  }, [toolExecution]);

  // Remove the internal state when toolExecution becomes null (like when starting a new message)
  useEffect(() => {
    if (toolExecution === null) {
      setInternalToolExecution(null);
      setShowToolExecution(false);
    }
  }, [toolExecution]);

  const isWaitingForToken = loading && !messageAppeared;
  const shouldShowPanel = (internalToolExecution && showToolExecution) || isWaitingForToken;

  if (!shouldShowPanel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed right-6 top-24 z-30 hidden xl:block w-[350px] 2xl:w-[450px]"
      >
        <div className="bg-light-secondary dark:bg-dark-secondary rounded-2xl border border-light-200 dark:border-dark-200 shadow-lg p-4 text-xs overflow-hidden transition-all flex flex-col gap-4">
          <AnimatePresence>
            {isWaitingForToken && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-[#24A0ED]/10 border border-[#24A0ED]/30 text-[#24A0ED] dark:text-[#5ab8f5] rounded-xl p-3 flex items-center gap-3 overflow-hidden shadow-sm"
              >
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Processing...</span>
                  <span className="text-xs opacity-90">Please wait patiently, generating response.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {internalToolExecution && showToolExecution && (
            <>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-black dark:text-white flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    ⚙️ {internalToolExecution.name}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowToolExecution(false)}
                  className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Hide
                </button>
              </div>

              <div className="mb-1">
                {internalToolExecution.state === 'COMPLETED' ? (
                  <span className="text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-md">
                    COMPLETED ({internalToolExecution.durationMs}ms)
                  </span>
                ) : internalToolExecution.state === 'FAILED' ? (
                  <span className="text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-md">
                    FAILED
                  </span>
                ) : (
                  <span className="text-sky-500 font-medium bg-sky-500/10 px-2 py-1 rounded-md flex items-center w-max gap-1">
                    RUNNING
                    <span className="animate-pulse flex space-x-1 ml-1">
                      <span className="w-1 h-1 bg-sky-500 rounded-full"></span>
                      <span className="w-1 h-1 bg-sky-500 rounded-full animation-delay-150"></span>
                      <span className="w-1 h-1 bg-sky-500 rounded-full animation-delay-300"></span>
                    </span>
                  </span>
                )}
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-4 scrollbar-thin pr-1">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                    Input Parameters
                  </p>
                  <pre className="bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 p-3 rounded-lg text-black dark:text-white whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
                    {typeof internalToolExecution.inputPreview === 'string'
                      ? internalToolExecution.inputPreview
                      : JSON.stringify(internalToolExecution.inputPreview, null, 2)}
                  </pre>
                </div>

                {(internalToolExecution.state === 'COMPLETED' || internalToolExecution.state === 'FAILED') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className={`${internalToolExecution.state === 'FAILED' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} font-medium mb-1.5 uppercase tracking-wider text-[10px]`}>
                      Result Output
                    </p>
                    <pre className={`bg-light-primary dark:bg-dark-primary border ${internalToolExecution.state === 'FAILED' ? 'border-red-500/50 text-red-500' : 'border-light-200 dark:border-dark-200 text-black dark:text-white'} p-3 rounded-lg whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed`}>
                      {typeof internalToolExecution.resultPreview === 'string'
                        ? internalToolExecution.resultPreview
                        : JSON.stringify(
                            internalToolExecution.resultPreview,
                            null,
                            2,
                          )}
                    </pre>
                  </motion.div>
                )}

                {internalToolExecution.state === 'COMPLETED' && isWaitingForToken && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center justify-center gap-2 text-sky-500 dark:text-sky-400 py-3 bg-sky-500/10 rounded-lg border border-sky-500/20 shadow-sm"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium tracking-wide">分析中...</span>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ToolExecutionPanel;
