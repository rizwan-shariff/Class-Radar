import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/context/Providers';
import { BottomNav } from '@/components/BottomNav';
import { TopHeader } from '@/components/TopHeader';

export const metadata: Metadata = {
  title: 'ClassRadar — Academic Schedule & Attendance Intelligence',
  description: 'Live academic timetable, substitute intelligence, free room finder, and anti-proxy rotating QR attendance system.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FCF9F4] text-[#1B1C19] flex flex-col antialiased selection:bg-[#E7DFD1] selection:text-[#6C5939]">
        <Providers>
          <TopHeader />
          <main className="flex-1 pb-28 pt-2">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
