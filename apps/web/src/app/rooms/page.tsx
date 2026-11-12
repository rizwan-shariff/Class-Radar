'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Room } from '@/lib/api';
import { Search, MapPin, Users, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function FreeRoomsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('2026-11-09');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [roomType, setRoomType] = useState<'CLASSROOM' | 'LAB' | ''>('');
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [purpose, setPurpose] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: freeRooms, isLoading, refetch } = useQuery<Room[]>({
    queryKey: ['free-rooms', selectedDate, selectedPeriod, roomType],
    queryFn: () =>
      api.rooms.free({
        date: selectedDate,
        period: selectedPeriod,
        type: roomType || undefined,
      }),
  });

  const handleBookRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom || !purpose) return;

    try {
      await api.rooms.book({
        roomId: bookingRoom.id,
        date: selectedDate,
        period: selectedPeriod,
        purpose,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingRoom(null);
        setBookingSuccess(false);
        setPurpose('');
        refetch();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Booking failed. Room might have been booked simultaneously.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Search Header */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div>
          <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
            Campus Live Availability
          </span>
          <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Free Room Finder</h2>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#4C463C] mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full py-2 px-3 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8]/80 text-[#1B1C19] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#4C463C] mb-1">Period (1 - 8)</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8]/80 text-[#1B1C19] focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setRoomType('')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              roomType === ''
                ? 'bg-[#6C5939] text-white shadow-sm'
                : 'bg-[#F0EEE9] text-[#4C463C] hover:bg-[#E5E2DD]'
            }`}
          >
            All Spaces
          </button>
          <button
            onClick={() => setRoomType('CLASSROOM')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              roomType === 'CLASSROOM'
                ? 'bg-[#6C5939] text-white shadow-sm'
                : 'bg-[#F0EEE9] text-[#4C463C] hover:bg-[#E5E2DD]'
            }`}
          >
            Classrooms
          </button>
          <button
            onClick={() => setRoomType('LAB')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              roomType === 'LAB'
                ? 'bg-[#6C5939] text-white shadow-sm'
                : 'bg-[#F0EEE9] text-[#4C463C] hover:bg-[#E5E2DD]'
            }`}
          >
            Labs
          </button>
        </div>
      </div>

      {/* Free Rooms Results */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : !freeRooms || freeRooms.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-xs text-[#7E766B]">
            No vacant rooms available matching your criteria for Period {selectedPeriod}.
          </div>
        ) : (
          freeRooms.map((room) => (
            <div
              key={room.id}
              className="glass-panel rounded-3xl p-4 border border-[#CFC5B8]/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1B1C19]">{room.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-[#7E766B] mt-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#CFC5B8]/40 text-[10px] font-bold">
                      {room.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {room.capacity} seats
                    </span>
                  </div>
                </div>
              </div>

              {/* Faculty Booking Action */}
              {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
                <button
                  onClick={() => setBookingRoom(room)}
                  className="py-1.5 px-3 rounded-xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Book</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Faculty Booking Modal / Sheet */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel bg-[#FCF9F4] rounded-3xl p-6 shadow-2xl border border-[#CFC5B8] animate-in slide-in-from-bottom-6 duration-200">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#6C5939] mx-auto" />
                <h3 className="text-base font-bold text-[#1B1C19]">Room Booked!</h3>
                <p className="text-xs text-[#7E766B]">
                  {bookingRoom.name} confirmed for Period {selectedPeriod}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookRoom} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#86724F] uppercase tracking-wider">
                    Instant Room Reservation
                  </span>
                  <h3 className="text-base font-bold text-[#1B1C19] mt-0.5">
                    Book {bookingRoom.name}
                  </h3>
                  <p className="text-xs text-[#7E766B] mt-1">
                    Date: {selectedDate} • Period {selectedPeriod}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4C463C] mb-1">
                    Purpose of Reservation
                  </label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Remedial Class, Lab Exam, Project Review"
                    className="w-full py-2.5 px-3 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8] text-xs text-[#1B1C19] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingRoom(null)}
                    className="flex-1 py-2 px-3 rounded-2xl bg-[#F0EEE9] text-[#4C463C] text-xs font-semibold hover:bg-[#E5E2DD]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
