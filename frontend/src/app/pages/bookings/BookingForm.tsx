import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { bookingAPI, petAPI, PetResponse } from "../../utils/api";

const serviceOptions = [
  { value: "Basic Grooming", label: "Basic Grooming", duration: 60 },
  { value: "Deluxe Grooming", label: "Deluxe Grooming", duration: 90 },
  { value: "Annual Checkup", label: "Annual Checkup", duration: 30 },
  { value: "Basic Training Session", label: "Basic Training Session", duration: 45 },
  { value: "Full Day Daycare", label: "Full Day Daycare", duration: 480 },
];

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [service, setService] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [petsData, booking] = await Promise.all([
          petAPI.getAll(),
          id ? bookingAPI.getById(id) : Promise.resolve(null),
        ]);

        setPets(petsData);
        if (booking) {
          setSelectedPet(booking.pet_id);
          setService(booking.service);
          const bookingDate = new Date(booking.booking_datetime);
          setDate(bookingDate.toISOString().slice(0, 10));
          setTime(bookingDate.toISOString().slice(11, 16));
          setNotes(booking.notes ?? "");
          const matching = serviceOptions.find((option) => option.value === booking.service);
          setDurationMinutes(matching?.duration || booking.duration_minutes);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load booking form data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleServiceChange = (value: string) => {
    setService(value);
    const selected = serviceOptions.find((option) => option.value === value);
    setDurationMinutes(selected?.duration ?? 60);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPet || !service || !date || !time) {
      setError("Please complete all required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const booking_datetime = new Date(`${date}T${time}:00`).toISOString();

      if (isEdit && id) {
        await bookingAPI.update(id, { notes });
      } else {
        await bookingAPI.create({
          pet_id: selectedPet,
          service,
          booking_datetime,
          duration_minutes: durationMinutes,
          notes,
        });
      }

      navigate("/bookings");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/bookings" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Booking" : "New Booking"}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet *</label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a pet</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Service *</label>
            <select
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a service</option>
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.duration} min
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special requests or notes for the service provider..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Booking Summary</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                Service: <span className="font-medium">{service || 'TBD'}</span>
              </p>
              <p>
                Duration: <span className="font-medium">{durationMinutes} minutes</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : isEdit ? 'Update Booking' : 'Confirm Booking'}
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
