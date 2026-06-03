import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Save, Loader2, Clock } from "lucide-react";
import { bookingAPI } from "../../services/bookings";
import { petAPI, PetResponse } from "../../services/pets";
import { productAPI, ProductResponse } from "../../services/products";
import { useToast } from "../../components/ToastProvider";
import type { PaymentMethod } from "../../services/types";

interface ServiceOption {
  value: string;
  label: string;
  duration: number;
}

export default function BookingForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service");
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!id;

  const [pets, setPets] = useState<PetResponse[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [service, setService] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay");
  const [slots, setSlots] = useState<Array<{ time: string; available: boolean }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const formatLocalDate = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  const today = formatLocalDate(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [petsData, productsData, booking] = await Promise.all([
          petAPI.getAll(),
          productAPI.getAll(0, 100, undefined, "service"),
          id ? bookingAPI.getById(id) : Promise.resolve(null),
        ]);

        setPets(petsData);
        let options = productsData.map(product => ({
          value: product.name,
          label: product.name,
          duration: product.duration_minutes ?? 60,
        }));

        if (booking && booking.service && !options.some((option) => option.value === booking.service)) {
          options = [{ value: booking.service, label: booking.service, duration: booking.duration_minutes }, ...options];
        }

        setServiceOptions(options);

        if (booking) {
          setSelectedPet(booking.pet_id);
          setService(booking.service);
          const bookingDate = new Date(booking.booking_datetime);
          setDate(bookingDate.toISOString().slice(0, 10));
          setTime(bookingDate.toISOString().slice(11, 16));
          setNotes(booking.notes ?? "");
          setDurationMinutes(booking.duration_minutes);
        } else {
          const selected = options.find((option) => option.value === requestedService);
          if (selected) {
            setService(selected.value);
            setDurationMinutes(selected.duration);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load booking form data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, requestedService]);

  const handleServiceChange = (value: string) => {
    setService(value);
    const selected = serviceOptions.find((option) => option.value === value);
    setDurationMinutes(selected?.duration ?? 60);
    setTime("");
  };

  useEffect(() => {
    const loadSlots = async () => {
      if (!service || !date || isEdit) {
        setSlots([]);
        return;
      }
      try {
        setLoadingSlots(true);
        const availability = await bookingAPI.getAvailability(service, date, durationMinutes);
        setSlots(availability.slots);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load available booking times.");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [service, date, durationMinutes, isEdit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPet || !service || !date || !time) {
      setError("Please complete all required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const selectedDateTime = new Date(`${date}T${time}:00`);
      if (!isEdit && selectedDateTime <= new Date()) {
        setError("Please choose a future booking time.");
        setSaving(false);
        return;
      }
      const booking_datetime = new Date(`${date}T${time}:00`).toISOString();

      if (isEdit && id) {
        await bookingAPI.update(id, { notes });
        toast.success("Booking updated.");
      } else {
        const booking = await bookingAPI.create({
          pet_id: selectedPet,
          service,
          booking_datetime,
          duration_minutes: durationMinutes,
          notes,
          payment_method: paymentMethod,
        });
        toast.success(paymentMethod === "vnpay" ? "Booking created. Redirecting to payment." : "Booking created with COD payment.");
        if (booking.checkout_url) {
          window.location.href = booking.checkout_url;
          return;
        }
      }

      navigate("/bookings");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to save booking. Please try again.";
      setError(message);
      toast.error(message);
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
                min={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {isEdit && (
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
            )}
          </div>

          {!isEdit && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Available Times *</label>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Available</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Booked</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-6 text-sm text-gray-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading times...
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {slots.map((slot) => {
                      const isFutureSlot = new Date(`${date}T${slot.time}:00`) > new Date();
                      const available = slot.available && isFutureSlot;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => available && setTime(slot.time)}
                          disabled={!available}
                          className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            available
                            ? time === slot.time
                              ? "border-green-700 bg-green-600 text-white"
                              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            : "cursor-not-allowed border-red-200 bg-red-50 text-red-700 opacity-80"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-gray-600">Choose a service and date to see the time grid.</p>
                )}
              </div>
            </div>
          )}

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

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment method *</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { value: "vnpay", label: "VNPAY", desc: "Pay online before the appointment." },
                  { value: "cod", label: "COD", desc: "Pay cash at the service time." },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-lg border px-4 py-3 ${
                      paymentMethod === option.value ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value as PaymentMethod)}
                      className="sr-only"
                    />
                    <span className="block font-medium text-gray-900">{option.label}</span>
                    <span className="mt-1 block text-sm text-gray-600">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {service && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Booking Summary</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  Service: <span className="font-medium">{service}</span>
                </p>
                <p>
                  Duration: <span className="font-medium">{durationMinutes} minutes</span>
                </p>
              </div>
            </div>
          )}

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
