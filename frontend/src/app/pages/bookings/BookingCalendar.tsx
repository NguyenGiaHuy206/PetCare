import { Link } from "react-router";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 19));

  const bookings = [
    { id: 1, date: "2026-04-22", time: "10:00", pet: "Luna", service: "Grooming", status: "Confirmed" },
    { id: 2, date: "2026-04-25", time: "14:30", pet: "Max", service: "Annual Checkup", status: "Confirmed" },
    { id: 3, date: "2026-04-28", time: "09:00", pet: "Charlie", service: "Training", status: "Pending" },
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const hasBooking = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.some(b => b.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link to="/bookings/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === 19 && currentDate.getMonth() === 3;
              const isBooked = hasBooking(day);

              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg border cursor-pointer transition ${
                    isToday ? 'bg-blue-50 border-blue-500 text-blue-600 font-semibold' :
                    isBooked ? 'bg-green-50 border-green-200 text-green-700' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
          <div className="space-y-3">
            {bookings.map(booking => (
              <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm text-gray-600">{booking.time}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{booking.pet}</p>
                <p className="text-sm text-gray-600">{booking.service}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                  booking.status === 'Confirmed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
