import { Link } from "react-router";
import { Plus, Calendar, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { careLogAPI, petAPI, CareLogResponse, PetResponse } from "../../utils/api";

export default function CareLogs() {
  const [logs, setLogs] = useState<CareLogResponse[]>([]);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPet, setSelectedPet] = useState("all");
  const [selectedType, setSelectedType] = useState("All Types");

  const types = ["All Types", "feeding", "grooming", "walking", "medication", "training", "health", "other"];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [logsData, petsData] = await Promise.all([
          careLogAPI.getAll(),
          petAPI.getAll(),
        ]);
        setLogs(logsData);
        setPets(petsData);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load care logs");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLogs = logs.filter(log => {
    const petMatch = selectedPet === "all" || log.pet_id === selectedPet;
    const typeMatch = selectedType === "All Types" || log.activity === selectedType;
    return petMatch && typeMatch;
  });

  const getPetName = (petId: string) => {
    return pets.find(p => p.id === petId)?.name ?? "Unknown Pet";
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
        <h1 className="text-2xl font-bold text-gray-900">Care Logs</h1>
        <Link to="/care-logs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </Link>
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
              {types.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredLogs.map(log => (
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
                      src={log.image_url}
                      alt="Care log"
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No care logs yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your pet's care activities</p>
          <Link to="/care-logs/new" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add First Entry
          </Link>
        </div>
      )}
    </div>
  );
}