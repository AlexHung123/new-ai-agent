/* eslint-disable @next/next/no-img-element */
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Document } from '@langchain/core/documents';
import { File, Globe, X } from 'lucide-react';
import { Fragment, useState } from 'react';

const MessageSources = ({ sources }: { sources: Document[] }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeModal = () => {
    setIsDialogOpen(false);
    document.body.classList.remove('overflow-hidden-scrollable');
  };

  const openModal = () => {
    setIsDialogOpen(true);
    document.body.classList.add('overflow-hidden-scrollable');
  };

  return (
    <div className="flex flex-row items-center">
      <button
        onClick={openModal}
        className="bg-light-secondary hover:bg-light-200 dark:bg-dark-secondary dark:hover:bg-dark-200 border border-light-200 dark:border-dark-200 transition duration-200 rounded-full px-3 py-1.5 flex flex-row items-center space-x-2"
      >
        <div className="flex flex-row items-center -space-x-1">
          {sources.slice(0, 3).map((source, i) => {
            return source.metadata.url === 'File' ? (
              <div
                key={i}
                className="bg-dark-200 z-10 flex items-center justify-center w-5 h-5 rounded-full border border-light-secondary dark:border-dark-secondary"
              >
                <File size={10} className="text-white/70" />
              </div>
            ) : (
              <div
                key={i}
                className="bg-light-200 dark:bg-dark-200 z-10 flex items-center justify-center w-5 h-5 rounded-full border border-light-secondary dark:border-dark-secondary"
              >
                <Globe size={10} className="text-black/70 dark:text-white/70" />
              </div>
            );
          })}
        </div>
        <p className="text-xs font-medium text-black/70 dark:text-white/70">
          {sources.length} 個來源
        </p>
      </button>

      <Transition appear show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-end">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 translate-x-full"
              >
                <DialogPanel className="w-full max-w-md transform bg-light-secondary dark:bg-dark-secondary h-screen shadow-xl transition-all flex flex-col border-l border-light-200 dark:border-dark-200">
                  <div className="flex flex-row items-center justify-between p-4 border-b border-light-200 dark:border-dark-200">
                    <DialogTitle className="text-lg font-medium dark:text-white">
                      {sources.length} 個來源
                    </DialogTitle>
                    <button
                      onClick={closeModal}
                      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-200 dark:hover:bg-dark-200 transition duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex flex-col space-y-4 overflow-y-auto p-4 flex-1">
                    {sources.map((source, i) => (
                      <a
                        className="bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-dark-200 transition duration-200 rounded-lg p-4 flex flex-col space-y-2 font-medium"
                        key={i}
                        href={source.metadata.url}
                        target="_blank"
                      >
                        <div className="flex flex-row items-center space-x-2">
                          {source.metadata.url === 'File' ? (
                            <div className="bg-dark-200 flex items-center justify-center w-6 h-6 rounded-full">
                              <File size={12} className="text-white/70" />
                            </div>
                          ) : (
                            <div className="bg-light-200 dark:bg-dark-200 flex items-center justify-center w-6 h-6 rounded-full">
                              <Globe size={12} className="text-black/70 dark:text-white/70" />
                            </div>
                          )}
                          <p className="text-xs text-black/50 dark:text-white/50 overflow-hidden whitespace-nowrap text-ellipsis">
                            {source.metadata.url.replace(/.+\/\/|www.|\..+/g, '')}
                          </p>
                        </div>
                        <p className="dark:text-white text-sm line-clamp-2">
                          {source.metadata.title}
                        </p>
                        {source.pageContent && (
                          <p className="text-xs text-black/50 dark:text-white/50 line-clamp-3 font-normal">
                            {source.pageContent}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MessageSources;