import { Link } from "react-router";
import { Plus, Calendar, Weight, Edit, Loader, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { petAPI, PetResponse } from "../../utils/api";

// Species-based background colors for the placeholder
const SPECIES_COLORS: Record<string, string> = {
  Dog: "bg-amber-50",
  Cat: "bg-purple-50",
  Bird: "bg-sky-50",
  Rabbit: "bg-pink-50",
  Fish: "bg-cyan-50",
  Hamster: "bg-orange-50",
  Other: "bg-gray-50",
};

const SPECIES_ICON_COLORS: Record<string, string> = {
  Dog: "text-amber-300",
  Cat: "text-purple-300",
  Bird: "text-sky-300",
  Rabbit: "text-pink-300",
  Fish: "text-cyan-300",
  Hamster: "text-orange-300",
  Other: "text-gray-300",
};

export default function PetList() {
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true);
        const data = await petAPI.getAll();
        setPets(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load pets");
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Pets</h1>
        <Link
          to="/pets/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Pet
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => {
          const bgColor = SPECIES_COLORS[pet.species] ?? SPECIES_COLORS.Other;
          const iconColor = SPECIES_ICON_COLORS[pet.species] ?? SPECIES_ICON_COLORS.Other;

          return (
            <div
              key={pet.id}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
            >
              {/* Photo or placeholder */}
              {pet.photo_url ? (
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className={`w-full h-48 ${bgColor} flex items-center justify-center`}>
                  <PawPrint className={`w-16 h-16 ${iconColor}`} />
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
                    <p className="text-sm text-gray-600">{pet.breed}</p>
                  </div>
                  <Link
                    to={`/pets/${pet.id}/edit`}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{pet.species}{pet.age ? ` - ${pet.age}` : ""}</span>
                  </div>
                  {pet.weight ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Weight className="w-4 h-4" />
                      <span>{pet.weight} kg</span>
                    </div>
                  ) : null}
                </div>

                <Link
                  to={`/pets/${pet.id}`}
                  className="block text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {pets.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No pets added yet</p>
          <Link
            to="/pets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Your First Pet
          </Link>
        </div>
      )}
    </div>
  );
}