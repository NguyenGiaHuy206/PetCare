import { Link } from "react-router";
import { Plus, Calendar, Weight, Edit } from "lucide-react";

export default function PetList() {
  const pets = [
    {
      id: 1,
      name: "Max",
      species: "Dog",
      breed: "Golden Retriever",
      age: "3 years",
      weight: "30 kg",
      photo: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400",
      nextAppointment: "2026-04-25",
    },
    {
      id: 2,
      name: "Luna",
      species: "Cat",
      breed: "Persian",
      age: "2 years",
      weight: "4 kg",
      photo: "https://images.unsplash.com/photo-1573865526739-10c1de0e2a0f?w=400",
      nextAppointment: "2026-04-22",
    },
    {
      id: 3,
      name: "Charlie",
      species: "Dog",
      breed: "Beagle",
      age: "5 years",
      weight: "12 kg",
      photo: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400",
      nextAppointment: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Pets</h1>
        <Link to="/pets/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Pet
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map(pet => (
          <div key={pet.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition">
            <img src={pet.photo} alt={pet.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
                  <p className="text-sm text-gray-600">{pet.breed}</p>
                </div>
                <Link to={`/pets/${pet.id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{pet.age}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Weight className="w-4 h-4" />
                  <span>{pet.weight}</span>
                </div>
              </div>
              {pet.nextAppointment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-600 mb-1">Next Appointment</p>
                  <p className="text-sm text-blue-900 font-medium">
                    {new Date(pet.nextAppointment).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <Link to={`/pets/${pet.id}`} className="block text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {pets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No pets added yet</p>
          <Link to="/pets/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Your First Pet
          </Link>
        </div>
      )}
    </div>
  );
}
