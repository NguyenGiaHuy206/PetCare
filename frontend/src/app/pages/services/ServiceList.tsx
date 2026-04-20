import { Link } from "react-router";
import { Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react";

export default function ServiceList() {
  const services = [
    {
      id: 1,
      name: "Basic Grooming",
      category: "Grooming",
      duration: "60 min",
      price: "$35",
      description: "Bath, brush, nail trim, and ear cleaning",
    },
    {
      id: 2,
      name: "Deluxe Grooming",
      category: "Grooming",
      duration: "90 min",
      price: "$65",
      description: "Everything in basic plus haircut and teeth brushing",
    },
    {
      id: 3,
      name: "Annual Checkup",
      category: "Veterinary",
      duration: "30 min",
      price: "$75",
      description: "Complete health examination and vaccination review",
    },
    {
      id: 4,
      name: "Basic Training Session",
      category: "Training",
      duration: "45 min",
      price: "$50",
      description: "One-on-one obedience training session",
    },
    {
      id: 5,
      name: "Full Day Daycare",
      category: "Daycare",
      duration: "8 hours",
      price: "$35",
      description: "Supervised playtime, meals, and rest periods",
    },
  ];

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
        <Link to="/services/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Link>
      </div>

      {/* Filter by Category */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg">All</button>
          {categories.map(category => (
            <button key={category} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {service.category}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <DollarSign className="w-4 h-4" />
                    <span>{service.price}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/services/${service.id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="w-4 h-4" />
                </Link>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
