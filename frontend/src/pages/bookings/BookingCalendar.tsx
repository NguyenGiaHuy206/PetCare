import { Link } from "react-router";
import { Plus, Loader2, Search, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { bookingAPI, BookingResponse } from "../../services/bookings";
import { useAuth } from "../../contexts/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import { adminAPI } from "../../services/admin";
import type { UserResponse } from "../../services/types";
import BookingTimeline from "../../components/BookingTimeline";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function BookingCalendar() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [selectedTimetableDate, setSelectedTimetableDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        if (user?.role === "admin") {
          const bookingData = await bookingAPI.getAllAdmin();
          setBookings(bookingData);
          try {
            const userData = await adminAPI.getUsers();
            const map = userData.reduce((acc, item) => {
              acc[item.id] = item;
              return acc;
            }, {} as Record<string, UserResponse>);
            setUsersById(map);
          } catch {
            setUsersById({});
          }
        } else {
          const data = await bookingAPI.getAll();
          setBookings(data);
          setUsersById({});
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load bookings."));
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user?.role]);

  const normalizedUserSearch = userSearch.trim().toLowerCase();

  const matchesUserSearch = (userId: string) => {
    if (!normalizedUserSearch) {
      return true;
    }
    const owner = usersById[userId];
    if (!owner) {
      return false;
    }
    return `${owner.full_name} ${owner.email}`.toLowerCase().includes(normalizedUserSearch);
  };

  const serviceOptions = Array.from(new Set(bookings.map((booking) => booking.service))).sort();

  const filteredBookings = bookings
    .filter((booking) =>
      statusFilter === "All" ? true : booking.status.toLowerCase() === statusFilter.toLowerCase()
    )
    .filter((booking) => (user?.role === "admin" ? matchesUserSearch(booking.user_id) : true))
    .filter((booking) => (serviceFilter === "All" ? true : booking.service === serviceFilter));

  const statusCounts = bookings.reduce((acc, booking) => {
    const key = booking.status.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const key = booking.user_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, BookingResponse[]>);

  const getUserLabel = (userId: string) => {
    const found = usersById[userId];
    if (!found) {
      return `User ${userId.slice(0, 8)}`;
    }
    return `${found.full_name} (${found.email})`;
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingBookingId(bookingId);
      const updated = await bookingAPI.updateStatus(bookingId, newStatus);
      setBookings((current) => current.map((booking) => (booking.id === updated.id ? updated : booking)));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, `Failed to update booking status to ${newStatus}.`));
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const getAvailableTransitions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled", "pending"],
      completed: ["pending", "confirmed", "cancelled"],
      cancelled: ["pending", "confirmed"],
    };
    return transitions[currentStatus.toLowerCase()] || [];
  };

  const timetableSlots = Array.from({ length: 20 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  });

  const toLocalDateKey = (value: string) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const selectedDateBookings = filteredBookings.filter((booking) => {
    return toLocalDateKey(booking.booking_datetime) === selectedTimetableDate;
  });

  const bookingsForSlot = (slot: string) => {
    const [hour, minute] = slot.split(":").map(Number);
    const slotStart = hour * 60 + minute;
    const slotEnd = slotStart + 30;
    return selectedDateBookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_datetime);
      const bookingStart = bookingDate.getHours() * 60 + bookingDate.getMinutes();
      const bookingEnd = bookingStart + booking.duration_minutes;
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  };

  const selectedSlotBookings = selectedSlot ? bookingsForSlot(selectedSlot) : [];

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
          <h1 className="text-2xl font-bold text-gray-900">{user?.role === "admin" ? "Users' Bookings" : "My Bookings"}</h1>
          <p className="text-gray-600 mt-1">{user?.role === "admin" ? "Review and manage users' bookings." : "Manage upcoming appointments for your pets."}</p>
        </div>
        {user?.role !== "admin" && (
          <Link
            to="/bookings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
                <p className="text-sm text-gray-600">Total bookings: {bookings.length}.</p>
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

            {user?.role === "admin" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by user</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search by name or email"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {serviceOptions.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Service</label>
                <select
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Services</option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">
                  No bookings match this filter.
                </div>
              ) : user?.role === "admin" ? (
                Object.entries(groupedBookings).map(([userId, userBookings]) => (
                  <section key={userId} className="space-y-3 rounded-lg border border-gray-200 p-3">
                    <h3 className="text-sm font-semibold text-gray-800">{getUserLabel(userId)}</h3>
                    {userBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border p-4 hover:shadow-sm transition">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.booking_datetime).toLocaleDateString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric',
                              })}
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900">{booking.service}</h3>
                            <p className="text-sm text-gray-600">Pet: {booking.pet_name ?? booking.pet_id}</p>
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
                          {user?.role === "admin" && (
                            <select
                              value={booking.status}
                              onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                              disabled={updatingBookingId === booking.id}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value={booking.status}>{booking.status}</option>
                              {getAvailableTransitions(booking.status).map((status) => (
                                <option key={status} value={status}>
                                  Change to {status}
                                </option>
                              ))}
                            </select>
                          )}
                          <Link
                            to={`/bookings/${booking.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit booking
                          </Link>
                        </div>
                        <BookingTimeline booking={booking} />
                      </div>
                    ))}
                  </section>
                ))
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
                        <p className="text-sm text-gray-600">Pet: {booking.pet_name ?? booking.pet_id}</p>
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
                    <BookingTimeline booking={booking} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          {user?.role === "admin" && (
            <div className="bg-white rounded-lg border p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daily Timetable</h2>
                  <p className="text-sm text-gray-600">Green slots are free. Red slots have bookings.</p>
                </div>
                <input
                  type="date"
                  value={selectedTimetableDate}
                  onChange={(event) => {
                    setSelectedTimetableDate(event.target.value);
                    setSelectedSlot(null);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                {timetableSlots.map((slot) => {
                  const slotBookings = bookingsForSlot(slot);
                  const occupied = slotBookings.length > 0;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-base font-semibold ${
                        selectedSlot === slot
                          ? "ring-2 ring-blue-500"
                          : occupied
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {slot}
                    </button>
                  );
                })}
              </div>
              {selectedSlot && (
                <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                  <h3 className="font-medium text-gray-900">{selectedSlot}</h3>
                  {selectedSlotBookings.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {selectedSlotBookings.map((booking) => (
                        <div key={booking.id} className="rounded-lg bg-white p-3 text-sm">
                          <p className="font-medium text-gray-900">{booking.service}</p>
                          <p className="text-gray-600">Pet: {booking.pet_name ?? booking.pet_id}</p>
                          <p className="text-gray-600">User: {getUserLabel(booking.user_id)}</p>
                          <p className="text-gray-600">Duration: {booking.duration_minutes} min</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">No booking in this time slot.</p>
                  )}
                </div>
              )}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}


