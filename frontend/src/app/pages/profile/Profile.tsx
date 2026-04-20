import { User, Mail, Phone, MapPin, Shield, Save } from "lucide-react";

export default function Profile() {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, New York, NY 10001",
    role: "customer",
    joinedDate: "January 2025",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-4">
              <User className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{user.name}</h3>
            <p className="text-sm text-gray-600 mb-4">Member since {user.joinedDate}</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full">
              Upload Photo
            </button>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  defaultValue={user.phone}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  defaultValue={user.address}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Role & Permissions */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Role & Permissions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Role</p>
            <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Permissions</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">View Pets</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Book Services</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Make Purchases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
            <span className="text-gray-700">Change Password</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
            <span className="text-gray-700">Two-Factor Authentication</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full text-left px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex justify-between items-center">
            <span>Delete Account</span>
            <span className="text-red-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
