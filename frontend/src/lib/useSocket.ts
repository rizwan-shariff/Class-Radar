import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export function useSocket(events?: Record<string, (data: any) => void>) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // console.log('Socket connected:', socket.id);
    });

    if (events) {
      Object.entries(events).forEach(([eventName, handler]) => {
        socket.on(eventName, handler);
      });
    }

    return () => {
      if (events) {
        Object.entries(events).forEach(([eventName, handler]) => {
          socket.off(eventName, handler);
        });
      }
      socket.disconnect();
    };
  }, []);

  const emit = (event: string, payload?: any) => {
    socketRef.current?.emit(event, payload);
  };

  const joinRooms = () => {
    socketRef.current?.emit('join:rooms');
  };

  const joinSession = (sessionId: string) => {
    socketRef.current?.emit('join:session', { sessionId });
  };

  return {
    socket: socketRef.current,
    emit,
    joinRooms,
    joinSession,
  };
}

