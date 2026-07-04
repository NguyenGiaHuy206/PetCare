import { Link, useParams } from "react-router";
import { Edit, Calendar, Weight, Pill, Syringe, FileText, ArrowLeft, Loader2, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { petAPI, PetResponse } from "../../services/pets";
import { bookingAPI, type BookingResponse } from "../../services/bookings";
import { getImageSrc } from "../../utils/images";

export default function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState<PetResponse | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPetData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [petData, bookingsData] = await Promise.all([
          petAPI.getById(id),
          bookingAPI.getAll(0, 100),
        ]);
        setPet(petData);
        const petBookings = bookingsData.filter(b => b.pet_id === id);
        setBookings(petBookings);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    };

    loadPetData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="space-y-4">
        <Link to="/pets" className="inline-flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
          Back to pets
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          {error || "Pet not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/pets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{pet.name}</h1>
        <Link to={`/pets/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          {pet.photo_url ? (
            <img src={getImageSrc(pet.photo_url)} alt={pet.name} className="w-full h-64 object-cover rounded-lg mb-4" />
          ) : (
            <div className="w-full h-64 bg-blue-50 rounded-lg mb-4 flex items-center justify-center">
              <PawPrint className="w-16 h-16 text-blue-300" />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Species</p>
              <p className="font-medium text-gray-900">{pet.species}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Breed</p>
              <p className="font-medium text-gray-900">{pet.breed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-medium text-gray-900">{pet.age || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Color</p>
              <p className="font-medium text-gray-900">{pet.color || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="font-medium text-gray-900">{pet.weight ? `${pet.weight} kg` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Microchip ID</p>
              <p className="font-medium text-gray-900 text-sm">{pet.microchip_id || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Bookings & Services</h2>
              </div>
              <Link to="/bookings/new" className="text-sm text-blue-600 hover:text-blue-700">
                Book New
              </Link>
            </div>
            <div className="space-y-3">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.service}</p>
                      <p className="text-sm text-gray-600">{new Date(booking.booking_datetime).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      booking.status === 'completed'
                        ? 'bg-gray-100 text-gray-700'
                        : booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No bookings yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
