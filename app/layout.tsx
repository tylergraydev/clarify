import type { Metadata } from 'next';

import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/providers/toast-provider';

import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  description: 'Transform informal feature requests into actionable implementation plans using AI',
  title: 'Clarify',
};

type RootLayoutProps = RequiredChildren;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={'en'} suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
        `}
      >
        {/* base-ui requires this root class */}
        {/* eslint-disable-next-line better-tailwindcss/no-unknown-classes */}
        <div className={'root'}>
          <NuqsAdapter>
            <QueryProvider>
              <ThemeProvider>
                <ToastProvider>{children}</ToastProvider>
              </ThemeProvider>
            </QueryProvider>
          </NuqsAdapter>
        </div>
      </body>
    </html>
  );
}
