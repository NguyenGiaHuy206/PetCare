import { Link } from "react-router";
import { Plus, Calendar, FileText, Image as ImageIcon } from "lucide-react";

export default function CareLogs() {
  const logs = [
    {
      id: 1,
      date: "2026-04-18",
      time: "14:30",
      pet: "Max",
      type: "Grooming",
      note: "Completed full grooming session. Max was very cooperative and looks great!",
      photos: ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300"],
    },
    {
      id: 2,
      date: "2026-04-15",
      time: "10:00",
      pet: "Luna",
      type: "Medication",
      note: "Administered monthly flea and tick prevention medication.",
      photos: [],
    },
    {
      id: 3,
      date: "2026-04-12",
      time: "16:00",
      pet: "Max",
      type: "Feeding",
      note: "Changed to new grain-free diet as recommended by vet. Max seems to enjoy it.",
      photos: [],
    },
    {
      id: 4,
      date: "2026-04-10",
      time: "09:15",
      pet: "Charlie",
      type: "Training",
      note: "Great progress with basic commands. Charlie can now consistently sit and stay on command.",
      photos: ["https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=300"],
    },
    {
      id: 5,
      date: "2026-04-08",
      time: "11:00",
      pet: "Luna",
      type: "Health",
      note: "Annual vaccination completed. No adverse reactions observed.",
      photos: [],
    },
  ];

  const pets = ["All Pets", "Max", "Luna", "Charlie"];
  const types = ["All Types", "Grooming", "Medication", "Feeding", "Training", "Health"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Care Logs</h1>
        <Link to="/care-logs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Pet</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {pets.map(pet => (
                <option key={pet} value={pet}>{pet}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {logs.map(log => (
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
                    <h3 className="font-semibold text-gray-900">{log.pet} - {log.type}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(log.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {log.time}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {log.type}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{log.note}</p>
                {log.photos.length > 0 && (
                  <div className="flex gap-2">
                    {log.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo}
                          alt="Care log"
                          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
