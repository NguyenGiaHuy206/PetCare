import { Link, useParams } from "react-router";
import { Edit, Calendar, Weight, Pill, Syringe, FileText, Plus, ArrowLeft } from "lucide-react";

export default function PetDetail() {
  const { id } = useParams();

  const pet = {
    id: 1,
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "3 years",
    birthDate: "2023-01-15",
    weight: "30 kg",
    color: "Golden",
    microchipId: "123456789012345",
    photo: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600",
  };

  const vaccinations = [
    { name: "Rabies", date: "2025-12-10", nextDue: "2026-12-10", status: "Current" },
    { name: "DHPP", date: "2025-11-20", nextDue: "2026-11-20", status: "Current" },
    { name: "Bordetella", date: "2025-10-05", nextDue: "2026-10-05", status: "Current" },
  ];

  const medications = [
    { name: "Heartgard Plus", dosage: "1 tablet monthly", startDate: "2025-01-01", status: "Active" },
  ];

  const appointments = [
    { date: "2026-04-25", service: "Annual Checkup", status: "Scheduled" },
    { date: "2026-03-10", service: "Grooming", status: "Completed" },
  ];

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
        {/* Pet Info Card */}
        <div className="bg-white rounded-lg border p-6">
          <img src={pet.photo} alt={pet.name} className="w-full h-64 object-cover rounded-lg mb-4" />
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
              <p className="text-sm text-gray-600">Color</p>
              <p className="font-medium text-gray-900">{pet.color}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Birth Date</p>
              <p className="font-medium text-gray-900">{pet.birthDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="font-medium text-gray-900">{pet.weight}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Microchip ID</p>
              <p className="font-medium text-gray-900 text-sm">{pet.microchipId}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Vaccinations */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Vaccinations</h2>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700">Add</button>
            </div>
            <div className="space-y-3">
              {vaccinations.map((vaccination, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{vaccination.name}</p>
                    <p className="text-sm text-gray-600">Last: {vaccination.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {vaccination.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">Due: {vaccination.nextDue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Medications</h2>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700">Add</button>
            </div>
            <div className="space-y-3">
              {medications.map((medication, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{medication.name}</p>
                    <p className="text-sm text-gray-600">{medication.dosage}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {medication.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
              </div>
              <Link to="/bookings/new" className="text-sm text-blue-600 hover:text-blue-700">
                Book New
              </Link>
            </div>
            <div className="space-y-3">
              {appointments.map((appointment, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.service}</p>
                    <p className="text-sm text-gray-600">{appointment.date}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    appointment.status === 'Completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
