import { MainNavbar } from '@/components/layout/MainNavbar';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import React from 'react';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Industrial Test Data Analyser',
  description: 'Test Data analysis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MainNavbar />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
