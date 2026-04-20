import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Save } from "lucide-react";

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/bookings');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/bookings" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Booking' : 'New Booking'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a pet</option>
              <option value="1">Max (Golden Retriever)</option>
              <option value="2">Luna (Persian Cat)</option>
              <option value="3">Charlie (Beagle)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Service *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a service</option>
              <option value="1">Basic Grooming - $35 (60 min)</option>
              <option value="2">Deluxe Grooming - $65 (90 min)</option>
              <option value="3">Annual Checkup - $75 (30 min)</option>
              <option value="4">Basic Training Session - $50 (45 min)</option>
              <option value="5">Full Day Daycare - $35 (8 hours)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                min="2026-04-19"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select time</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special requests or notes for the service provider..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Booking Summary</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>Service: <span className="font-medium">Annual Checkup</span></p>
              <p>Duration: <span className="font-medium">30 minutes</span></p>
              <p>Price: <span className="font-medium">$75.00</span></p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Booking' : 'Confirm Booking'}
            </button>
            <Link
              to="/bookings"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
