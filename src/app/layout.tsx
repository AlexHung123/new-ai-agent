export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/theme/Provider';
import { ChatProvider } from '@/lib/hooks/useChat';

export const metadata: Metadata = {
  title: 'iTMS AI - Chat with iTMS',
  description:
    'iTMS AI an AI powered chatbot that is connected to iTMS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body className="h-full font-sans">
        <ThemeProvider>
          <ChatProvider>
            <Sidebar>{children}</Sidebar>
            <Toaster
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast:
                    'bg-light-secondary dark:bg-dark-secondary dark:text-white/70 text-black-70 rounded-lg p-4 flex flex-row items-center space-x-2',
                },
              }}
            />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
