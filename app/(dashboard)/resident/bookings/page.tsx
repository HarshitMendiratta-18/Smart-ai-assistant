"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Activity,
  Compass,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AMENITIES = [
  { id: 'gym', name: 'Premium Fitness Center', icon: Activity, desc: 'Equipped with cardio machines, weights, and crossfit racks.' },
  { id: 'pool', name: 'Swimming Pool Poolside', icon: Compass, desc: 'Temperature-controlled lap pool and children lounge deck.' },
  { id: 'clubhouse', name: 'Society Clubhouse Lounge', icon: Award, desc: 'Spacious air-conditioned hall for family meetings.' },
  { id: 'tennis', name: 'Synthetic Tennis Court', icon: Award, desc: 'Professional floodlit outdoor synthetic court.' },
  { id: 'hall', name: 'Community Celebration Hall', icon: Award, desc: 'Banquet area for private birthday parties and festivals.' }
];

const PRESET_SLOTS = [
  { id: 'slot-1', start: '06:00', end: '08:00', label: '06:00 AM - 08:00 AM' },
  { id: 'slot-2', start: '08:00', end: '10:00', label: '08:00 AM - 10:00 AM' },
  { id: 'slot-3', start: '10:00', end: '12:00', label: '10:00 AM - 12:00 PM' },
  { id: 'slot-4', start: '14:00', end: '16:00', label: '02:00 PM - 04:00 PM' },
  { id: 'slot-5', start: '16:00', end: '18:00', label: '04:00 PM - 06:00 PM' },
  { id: 'slot-6', start: '18:00', end: '20:00', label: '06:00 PM - 08:00 PM' },
  { id: 'slot-7', start: '20:00', end: '22:00', label: '08:00 PM - 10:00 PM' }
];

export default function ResidentBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedAmenity, setSelectedAmenity] = useState(AMENITIES[0].id);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, selectedAmenity, selectedDate]);

  async function loadBookings() {
    try {
      setLoading(true);
      const list = await dbService.getBookings();
      setAllBookings(list);
      
      // Filter list for logged-in user history
      const myBookings = list.filter((b: any) => b.residentId === user?.uid);
      setBookings(myBookings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  // Get list of slot IDs already booked for the selected amenity and date
  const getBookedSlots = () => {
    return allBookings
      .filter(
        (b: any) => 
          b.amenityId === selectedAmenity && 
          b.date === selectedDate && 
          b.status === 'booked'
      )
      .map((b: any) => b.slotId);
  };

  const bookedSlotIds = getBookedSlots();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast({
        title: 'Error',
        description: 'Please select a timeslot.',
        type: 'warning',
      });
      return;
    }

    // Double check conflict detection
    const isConflict = allBookings.some(
      (b: any) => 
        b.amenityId === selectedAmenity && 
        b.date === selectedDate && 
        b.slotId === selectedSlot &&
        b.status === 'booked'
    );

    if (isConflict) {
      toast({
        title: 'Conflict Detected',
        description: 'This timeslot has just been reserved. Please pick another time.',
        type: 'destructive',
      });
      return;
    }

    setBookingLoading(true);
    try {
      const slotDetail = PRESET_SLOTS.find(s => s.id === selectedSlot);
      const newBooking = {
        residentId: user?.uid,
        residentName: user?.name,
        unitNumber: user?.unitNumber || 'Tower A - 501',
        amenityId: selectedAmenity,
        amenityName: AMENITIES.find(a => a.id === selectedAmenity)?.name,
        date: selectedDate,
        startTime: slotDetail?.start,
        endTime: slotDetail?.end,
        slotId: selectedSlot,
        slotLabel: slotDetail?.label
      };

      await dbService.createBooking(newBooking);
      
      // Trigger canvas confetti celebration for premium feel!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: 'Booking Confirmed!',
        description: `Your slot for the ${newBooking.amenityName} has been booked.`,
        type: 'success',
      });

      setSelectedSlot(null);
      loadBookings();
    } catch (err: any) {
      toast({
        title: 'Booking Failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await dbService.cancelBooking(bookingId);
      toast({
        title: 'Booking Cancelled',
        description: 'Facility slot released.',
        type: 'success',
      });
      loadBookings();
    } catch (err: any) {
      toast({
        title: 'Cancellation failed',
        description: err.message,
        type: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['resident']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Facility Bookings</h1>
          <p className="text-muted-foreground">Reserve slots at society facilities with zero conflicts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FACILITY SELECT & CALENDAR (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              1. Choose Facility & Date
            </h2>

            {/* Amenities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AMENITIES.map((am) => {
                const Icon = am.icon;
                const isSelected = selectedAmenity === am.id;
                return (
                  <button
                    key={am.id}
                    onClick={() => {
                      setSelectedAmenity(am.id);
                      setSelectedSlot(null);
                    }}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary' 
                        : 'border-border bg-card hover:border-primary/20'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      {isSelected && <Badge>Active</Badge>}
                    </div>
                    <h3 className="font-bold text-sm mt-3 text-foreground">{am.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{am.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Date Picker */}
            <Card className="glass-card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm">Select Reservation Date</h4>
                  <p className="text-xs text-muted-foreground">Booking window open for next 7 days</p>
                </div>
                <div className="w-full sm:w-64">
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* TIMESLOT GRID & SUBMISSION (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary animate-pulse" />
              2. Select Slot
            </h2>

            <Card className="glass-card">
              <form onSubmit={handleBookingSubmit}>
                <CardContent className="p-6 space-y-6">
                  {/* Slots list */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Available Time Blocks</p>
                    <div className="grid grid-cols-1 gap-2">
                      {PRESET_SLOTS.map((slot) => {
                        const isBooked = bookedSlotIds.includes(slot.id);
                        const isSelected = selectedSlot === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`flex justify-between items-center px-4 py-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                              isBooked 
                                ? 'bg-muted/10 border-border text-muted-foreground/40 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10'
                                : 'bg-card border-border hover:border-primary/20 text-foreground'
                            }`}
                          >
                            <span>{slot.label}</span>
                            <span>{isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full cursor-pointer shadow-lg" 
                    loading={bookingLoading}
                    disabled={!selectedSlot}
                  >
                    Confirm Reservation
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>
        </div>

        {/* BOOKINGS HISTORY */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            My Reservations Log
          </h2>

          {loading ? (
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-card animate-pulse" />
            </div>
          ) : bookings.length === 0 ? (
            <Card className="border border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-card/25">
              <HelpCircle className="h-8 w-8 text-muted-foreground mb-1" />
              <p className="font-semibold text-xs">No reservations made</p>
              <p className="text-[10px] text-muted-foreground mt-1">Select a facility and slot to make a reservation.</p>
            </Card>
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-card/60">
                      <th className="p-4 font-bold">Facility</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Time Frame</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((book) => {
                      const amenityName = AMENITIES.find(a => a.id === book.amenityId)?.name || 'Facility';
                      const isUpcoming = new Date(`${book.date}T${book.startTime}`) > new Date();
                      return (
                        <tr key={book.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold">{amenityName}</td>
                          <td className="p-4">{new Date(book.date).toLocaleDateString()}</td>
                          <td className="p-4">{book.slotLabel || `${book.startTime} - ${book.endTime}`}</td>
                          <td className="p-4">
                            <Badge 
                              variant={
                                book.status === 'booked' 
                                  ? (isUpcoming ? 'default' : 'success') 
                                  : 'destructive'
                              }
                              className="capitalize"
                            >
                              {book.status === 'booked' ? (isUpcoming ? 'upcoming' : 'completed') : 'cancelled'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {book.status === 'booked' && isUpcoming ? (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleCancelBooking(book.id)}
                                className="cursor-pointer"
                              >
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
