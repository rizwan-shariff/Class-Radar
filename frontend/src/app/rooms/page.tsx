'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Room } from '@/lib/api';
import {
  Search,
  MapPin,
  Users,
  CheckCircle2,
  BookmarkPlus,
  Calendar,
  Clock,
  Filter,
  Check,
  Building,
  Sparkles
} from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[40rem] h-[25rem] rounded-full bg-[#EAE1D4]/40 blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-[30rem] h-[30rem] rounded-full bg-[#F9DFB5]/20 blur-[100px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
              Spatial Radar v2 · Campus Free Space Finder
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Unallocated Academic Rooms
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Instant spatial lookup for vacant auditoriums, lecture theatres, and computer labs across campus.
          </p>
        </div>

        {/* Date & Period Filtering Hub */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 border border-[#CFC5B8]/70 py-1.5 px-3.5 rounded-2xl text-xs font-medium text-[#4C463C] shadow-sm">
            <Calendar className="w-4 h-4 text-[#86724F]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-[#1B1C19] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/80 border border-[#CFC5B8]/70 py-1.5 px-3.5 rounded-2xl text-xs font-medium text-[#4C463C] shadow-sm">
            <Clock className="w-4 h-4 text-[#86724F]" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="bg-transparent focus:outline-none text-xs font-semibold text-[#1B1C19] cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/80 border border-[#CFC5B8]/70 py-1.5 px-3.5 rounded-2xl text-xs font-medium text-[#4C463C] shadow-sm">
            <Filter className="w-4 h-4 text-[#86724F]" />
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as any)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-[#1B1C19] cursor-pointer"
            >
              <option value="">All Spaces</option>
              <option value="CLASSROOM">Classrooms</option>
              <option value="LAB">Labs</option>
            </select>
          </div>
        </div>
      </section>

      {/* Free Rooms Stream Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#86724F]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#86724F]">
              Available Spaces for Period {selectedPeriod}
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#7E766B]">
            {freeRooms?.length || 0} Free Rooms Found
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-[#F0EEE9]/70 animate-pulse border border-[#CFC5B8]/40" />
            ))}
          </div>
        ) : !freeRooms || freeRooms.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-[#CFC5B8]/50">
            <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1B1C19]">All Rooms Occupied</h3>
            <p className="text-xs text-[#7E766B] max-w-sm mx-auto">
              All classrooms and labs are fully scheduled for Period {selectedPeriod}. Try choosing a different period above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeRooms.map((room) => (
              <div
                key={room.id}
                className="group rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-sm hover:shadow-md border border-[#CFC5B8]/60 transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#6C5939]" />

                <div className="space-y-2 pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                      {room.type}
                    </span>
                    <span className="text-xs font-semibold text-[#7E766B] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Cap {room.capacity}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1B1C19] group-hover:text-[#6C5939] transition-colors">
                    {room.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-[#7E766B]">
                    <MapPin className="w-3.5 h-3.5 text-[#86724F]" />
                    <span>Academic Wing · Level 2</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#CFC5B8]/40 flex items-center justify-between pl-2">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Unoccupied</span>
                  </span>

                  {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
                    <button
                      onClick={() => setBookingRoom(room)}
                      className="py-1.5 px-3.5 rounded-xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Book Space</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#FCF9F4] border border-[#CFC5B8]/80 p-7 shadow-2xl space-y-5">
            <div>
              <span className="text-[10px] font-bold text-[#86724F] uppercase tracking-wider">
                Instant Room Reservation
              </span>
              <h3 className="text-lg font-bold text-[#1B1C19] mt-0.5">
                Reserve {bookingRoom.name}
              </h3>
              <p className="text-xs text-[#7E766B] mt-0.5">
                Date: {selectedDate} · Period {selectedPeriod}
              </p>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#1B1C19]">Room Reserved!</h4>
                <p className="text-xs text-[#7E766B]">
                  Your reservation is confirmed and synced to campus occupancy screens.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4C463C] mb-1">
                    Purpose / Event Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Remedial lecture, guest seminar, project defense..."
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#CFC5B8] text-xs text-[#1B1C19] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingRoom(null)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-[#4C463C] hover:bg-[#F0EEE9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition shadow-sm"
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
