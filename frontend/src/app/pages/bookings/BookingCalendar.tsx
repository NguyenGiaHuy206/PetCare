import { Link } from "react-router";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { bookingAPI, BookingResponse } from "../../utils/api";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function BookingCalendar() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingAPI.getAll();
        setBookings(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) =>
    statusFilter === "All" ? true : booking.status.toLowerCase() === statusFilter.toLowerCase()
  );

  const statusCounts = bookings.reduce((acc, booking) => {
    const key = booking.status.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage upcoming appointments for your pets.</p>
        </div>
        <Link
          to="/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
                <p className="text-sm text-gray-600">You have {bookings.length} bookings.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'All' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">
                  No bookings match this filter.
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border p-4 hover:shadow-sm transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.booking_datetime).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.service}</h3>
                        <p className="text-sm text-gray-600">Pet ID: {booking.pet_id}</p>
                      </div>
                      <div className="text-sm text-gray-600 text-right">
                        <p>{new Date(booking.booking_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p>Duration: {booking.duration_minutes} min</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusStyles[booking.status.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                        {booking.status}
                      </span>
                      <Link
                        to={`/bookings/${booking.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit booking
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking Summary</h2>
            <div className="space-y-3">
              {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <div key={status} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="capitalize">{status}</span>
                  <span className="font-semibold">{statusCounts[status] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/bookings/new"
                className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                Schedule a new booking
              </Link>
              <Link
                to="/pets"
                className="block px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Manage pets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


