// frontend/src/hooks/useBooking.js
import { useState, useCallback } from 'react';
import bookingService from '@/features/booking/Services/BookingService';

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking   = (data)          => run(() => bookingService.createBooking(data));
  const getMyBookings   = ()              => run(() => bookingService.getMyBookings());
  const getBookingById  = (id)            => run(() => bookingService.getBookingById(id));
  const getAllBookings   = (status)        => run(() => bookingService.getAllBookings(status));
  const getSchedule     = (rId, date)     => run(() => bookingService.getSchedule(rId, date));
  const reviewBooking   = (id, payload)   => run(() => bookingService.reviewBooking(id, payload));
  const cancelBooking   = (id)            => run(() => bookingService.cancelBooking(id));
  const deleteBooking   = (id)            => run(() => bookingService.deleteBooking(id));

  return {
    loading, error,
    createBooking, getMyBookings, getBookingById,
    getAllBookings, getSchedule, reviewBooking,
    cancelBooking, deleteBooking,
  };
}