import { Link } from "react-router";
import { Plus, Calendar, Weight, Edit, Loader, PawPrint, Trash2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { petAPI, PetResponse } from "../../services/pets";
import { useAuth } from "../../contexts/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import { adminAPI } from "../../services/admin";
import type { UserResponse } from "../../services/types";
import { getImageSrc } from "../../utils/images";

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
  const { user } = useAuth();
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true);
        if (user?.role === "admin") {
          const petData = await petAPI.getAllAdmin();
          setPets(petData);
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
          const data = await petAPI.getMine();
          setPets(data);
          setUsersById({});
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load pets"));
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const getUserLabel = (userId: string) => {
    const found = usersById[userId];
    if (!found) {
      return `User ${userId.slice(0, 8)}`;
    }
    return `${found.full_name} (${found.email})`;
  };

  const isAdmin = user?.role === "admin";
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchesUserSearch = (ownerId: string) => {
    if (!normalizedSearch) {
      return true;
    }
    const owner = usersById[ownerId];
    if (!owner) {
      return false;
    }
    return `${owner.full_name} ${owner.email}`.toLowerCase().includes(normalizedSearch);
  };

  const visiblePets = isAdmin ? pets.filter((pet) => matchesUserSearch(pet.owner_id)) : pets;

  const groupedPets = visiblePets.reduce((acc, pet) => {
    const key = pet.owner_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(pet);
    return acc;
  }, {} as Record<string, PetResponse[]>);

  const handleDelete = async (petId: string) => {
    if (!window.confirm("Delete this pet? This cannot be undone.")) {
      return;
    }
    try {
      setError("");
      await petAPI.delete(petId);
      setPets((current) => current.filter((pet) => pet.id !== petId));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete pet."));
    }
  };

  const renderPetCard = (pet: PetResponse) => {
    const bgColor = SPECIES_COLORS[pet.species] ?? SPECIES_COLORS.Other;
    const iconColor = SPECIES_ICON_COLORS[pet.species] ?? SPECIES_ICON_COLORS.Other;

    return (
      <div
        key={pet.id}
        className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
      >
        {pet.photo_url ? (
          <img
            src={getImageSrc(pet.photo_url)}
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
            {isAdmin ? (
              <button
                type="button"
                onClick={() => handleDelete(pet.id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to={`/pets/${pet.id}/edit`}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </Link>
            )}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? "Users and Their Pets" : "My Pets"}</h1>
        {!isAdmin && (
          <Link
            to="/pets/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Pet
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search by user</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="space-y-8">
          {Object.entries(groupedPets).map(([ownerId, ownerPets]) => (
            <section key={ownerId} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{getUserLabel(ownerId)}</h2>
                <span className="text-sm text-gray-500">{ownerPets.length} pet{ownerPets.length === 1 ? "" : "s"}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownerPets.map(renderPetCard)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePets.map(renderPetCard)}
        </div>
      )}

      {visiblePets.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No pets found</p>
          {!isAdmin && (
            <Link
              to="/pets/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Your First Pet
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
