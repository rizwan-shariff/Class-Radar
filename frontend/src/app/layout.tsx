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
      <body className="min-h-screen bg-[#FCF9F4] dark:bg-[#18191C] text-[#1B1C19] dark:text-[#E8EAED] flex flex-col antialiased selection:bg-[#E7DFD1] selection:text-[#6C5939] dark:selection:bg-[#3C5A8A] dark:selection:text-white transition-colors duration-300 relative">
        {/* Specular Ambient Glows for Dark Mode */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden dark:block hidden">
          <div className="absolute top-0 left-1/4 w-[45rem] h-[30rem] rounded-full bg-[#1A73E8]/8 blur-[150px]" />
          <div className="absolute top-1/2 right-1/4 w-[40rem] h-[25rem] rounded-full bg-[#8AB4F8]/6 blur-[140px]" />
          <div className="absolute -bottom-10 left-1/3 w-[35rem] h-[25rem] rounded-full bg-[#1A73E8]/5 blur-[160px]" />
        </div>

        <Providers>
          <TopHeader />
          <main className="flex-1 pb-28 pt-2">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
