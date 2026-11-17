'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
    } else if (user.role === 'STUDENT') {
      router.push('/student');
    } else if (user.role === 'FACULTY') {
      router.push('/faculty');
    } else if (user.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#6C5939] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#7E766B] font-medium tracking-wide uppercase">Connecting ClassRadar...</p>
      </div>
    </div>
  );
}
