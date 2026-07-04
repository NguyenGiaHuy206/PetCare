import { Link } from "react-router";
import { Plus, Calendar, FileText, Image as ImageIcon, Loader2, Edit, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { careLogAPI, CareLogResponse } from "../../services/careLogs";
import { petAPI, PetResponse } from "../../services/pets";
import { categoryAPI, CategoryResponse } from "../../services/categories";
import { getApiErrorMessage } from "../../utils/errors";
import { adminAPI } from "../../services/admin";
import type { UserResponse } from "../../services/types";
import { getImageSrc } from "../../utils/images";

export default function CareLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CareLogResponse[]>([]);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserResponse>>({});
  const [types, setTypes] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPet, setSelectedPet] = useState("all");
  const [selectedType, setSelectedType] = useState("All Types");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (user?.role === "admin") {
          const [logsData, petsData, typeData] = await Promise.all([
            careLogAPI.getAll(),
            petAPI.getAllAdmin(),
            categoryAPI.getAll("carelog"),
          ]);
          setLogs(logsData);
          setPets(petsData);
          setTypes(typeData);
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
          const [logsData, petsData, typeData] = await Promise.all([
            careLogAPI.getAll(),
            petAPI.getAll(),
            categoryAPI.getAll("carelog"),
          ]);
          setLogs(logsData);
          setPets(petsData);
          setTypes(typeData);
          setUsersById({});
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load care logs"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role]);

  const normalizedUserSearch = userSearch.trim().toLowerCase();

  const matchesUserSearch = (userId: string) => {
    if (!normalizedUserSearch) {
      return true;
    }
    const found = usersById[userId];
    if (!found) {
      return false;
    }
    return `${found.full_name} ${found.email}`.toLowerCase().includes(normalizedUserSearch);
  };

  const filteredLogs = logs.filter(log => {
    const petMatch = selectedPet === "all" || log.pet_id === selectedPet;
    const typeMatch = selectedType === "All Types" || log.activity === selectedType;
    const userMatch = user?.role === "admin" ? matchesUserSearch(log.user_id) : true;
    return petMatch && typeMatch && userMatch;
  });

  const getPetName = (petId: string) => {
    return pets.find(p => p.id === petId)?.name ?? "Unknown Pet";
  };

  const getUserLabel = (userId: string) => {
    const found = usersById[userId];
    if (!found) {
      return `User ${userId.slice(0, 8)}`;
    }
    return `${found.full_name} (${found.email})`;
  };

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const key = log.user_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {} as Record<string, CareLogResponse[]>);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this care log?")) {
      return;
    }
    try {
      await careLogAPI.delete(id);
      setLogs((current) => current.filter((log) => log.id !== id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete care log."));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{user?.role === "admin" ? "Users' Care Logs" : "Care Logs"}</h1>
        {user?.role === "admin" && (
          <Link to="/care-logs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Entry
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Pet</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={selectedPet}
              onChange={e => setSelectedPet(e.target.value)}
            >
              <option value="all">All Pets</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="All Types">All Types</option>
              {types.map((type) => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
        {user?.role === "admin" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Username</label>
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
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {user?.role === "admin" ? (
          Object.entries(groupedLogs).map(([userId, userLogs]) => (
            <section key={userId} className="space-y-3 rounded-lg border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-800">{getUserLabel(userId)}</h3>
              {userLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {getPetName(log.pet_id)} - {log.activity}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(log.timestamp).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(log.timestamp).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                          {log.activity}
                        </span>
                      </div>
                      {log.notes && <p className="text-gray-700 mb-3">{log.notes}</p>}
                      {log.image_url && (
                        <div className="relative group inline-block">
                          <img
                            src={getImageSrc(log.image_url)}
                            alt="Care log"
                            className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                          />
                          <div className="absolute inset-0 rounded-lg bg-transparent transition group-hover:bg-black/10 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <Link
                          to={`/care-logs/${log.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {getPetName(log.pet_id)} - {log.activity}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(log.timestamp).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(log.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                      {log.activity}
                    </span>
                  </div>
                  {log.notes && <p className="text-gray-700 mb-3">{log.notes}</p>}
                  {log.image_url && (
                    <div className="relative group inline-block">
                      <img
                        src={getImageSrc(log.image_url)}
                        alt="Care log"
                        className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      />
                      <div className="absolute inset-0 rounded-lg bg-transparent transition group-hover:bg-black/10 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredLogs.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No care logs yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your pet's care activities</p>
          {user?.role === "admin" && (
            <Link to="/care-logs/new" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add First Entry
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
